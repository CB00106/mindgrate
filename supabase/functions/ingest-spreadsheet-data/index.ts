import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

interface ChunkData {
  mindop_id: string
  user_id: string
  content: string
  embedding: number[]
  source_csv_name: string
  metadata?: any
}

interface OpenAIEmbeddingResponse {
  data: {
    embedding: number[]
  }[]
}

interface ProcessingProgress {
  current: number
  total: number
  stage: string
}

// Configuración optimizada para archivos grandes - Estrategia RAG refinada
const PROCESSING_CONFIG = {
  MAX_TOKENS_PER_CHUNK: 800,        // Estrategia refinada: 500-1000 tokens (comenzando con 800)
  OVERLAP_TOKENS: 150,              // 10-20% del chunkSize (150 tokens ≈ 18.75% de 800)
  BATCH_SIZE: 5,                    // Procesar embeddings en lotes pequeños
  MAX_CHUNKS_PER_REQUEST: 1000,     // Límite de chunks por procesamiento
  RATE_LIMIT_DELAY: 150,            // Delay entre llamadas a OpenAI (ms)
  DB_BATCH_SIZE: 50,                // Insertar en lotes en la BD
  MAX_FILE_SIZE: 50 * 1024 * 1024,  // 50MB límite
  MAX_ROWS_EXCEL: 10000,            // Límite de filas por hoja
}

// Simple tokenizer estimation (more reliable than external dependencies)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Enhanced text chunking with recursive character splitting strategy - Estrategia RAG refinada
function createChunks(
  text: string, 
  maxTokens = PROCESSING_CONFIG.MAX_TOKENS_PER_CHUNK, 
  overlapTokens = PROCESSING_CONFIG.OVERLAP_TOKENS
): string[] {
  if (!text || text.trim().length === 0) return []
  
  console.log(`✂️ Iniciando chunking refinado - Target: ${maxTokens} tokens, Overlap: ${overlapTokens} tokens`)
  
  const chunks: string[] = []
  
  // Separadores jerárquicos para implementar estrategia recursiva
  const separators = [
    '\n\n\n',    // Secciones grandes
    '\n\n',      // Párrafos 
    '\n',        // Líneas
    '. ',        // Oraciones
    '! ',        // Oraciones exclamativas
    '? ',        // Oraciones interrogativas
    '; ',        // Clausulas
    ', ',        // Frases
    ' ',         // Palabras
    ''           // Caracteres (último recurso)
  ]
  
  // Función recursiva para dividir texto
  function recursiveSplit(currentText: string, sepIndex: number = 0): string[] {
    if (!currentText || currentText.trim().length === 0) return []
    
    const currentTokens = estimateTokens(currentText)
    
    // Si el texto cabe en un chunk, retornarlo
    if (currentTokens <= maxTokens) {
      return [currentText.trim()]
    }
      // Si llegamos al final de separadores, dividir por caracteres
    if (sepIndex >= separators.length) {
      const charLimit = Math.floor(maxTokens * 4) // Aproximadamente 4 chars por token
      const result: string[] = []
      for (let i = 0; i < currentText.length; i += charLimit) {
        const chunk = currentText.slice(i, i + charLimit)
        if (chunk.trim().length > 0) {
          result.push(chunk.trim())
        }
      }
      return result
    }
    
    const separator = separators[sepIndex]
    const splits = currentText.split(separator)
    
    // Si no se puede dividir con este separador, probar el siguiente
    if (splits.length === 1) {
      return recursiveSplit(currentText, sepIndex + 1)
    }
    
    // Combinar splits respetando límites de tokens
    const result: string[] = []
    let currentChunk = ''
    let currentChunkTokens = 0
    
    for (let i = 0; i < splits.length; i++) {
      const split = splits[i]
      const splitTokens = estimateTokens(split)
      
      // Si el split individual es muy grande, dividirlo recursivamente
      if (splitTokens > maxTokens) {
        // Guardar chunk actual si tiene contenido
        if (currentChunk.trim().length > 0) {
          result.push(currentChunk.trim())
          currentChunk = ''
          currentChunkTokens = 0
        }
        
        // Dividir recursivamente el split grande
        const recursiveChunks = recursiveSplit(split, sepIndex + 1)
        result.push(...recursiveChunks)
        continue
      }
      
      // Verificar si agregar este split excedería el límite
      const potentialTokens = currentChunkTokens + splitTokens + 
        (currentChunk.length > 0 ? estimateTokens(separator) : 0)
      
      if (potentialTokens > maxTokens && currentChunk.trim().length > 0) {
        // Guardar chunk actual
        result.push(currentChunk.trim())
        
        // Crear overlap si es posible
        const overlapText = createOverlapText(currentChunk, separator, overlapTokens)
        currentChunk = overlapText + (overlapText.length > 0 ? separator : '') + split
        currentChunkTokens = estimateTokens(currentChunk)
      } else {
        // Agregar al chunk actual
        if (currentChunk.length > 0) {
          currentChunk += separator + split
        } else {
          currentChunk = split
        }
        currentChunkTokens = estimateTokens(currentChunk)
      }
    }
    
    // Agregar último chunk si tiene contenido
    if (currentChunk.trim().length > 0) {
      result.push(currentChunk.trim())
    }
    
    return result
  }
  
  // Función para crear texto de overlap inteligente
  function createOverlapText(text: string, separator: string, targetOverlapTokens: number): string {
    if (targetOverlapTokens <= 0) return ''
    
    const parts = text.split(separator)
    let overlapText = ''
    let overlapTokens = 0
    
    // Tomar partes desde el final hasta alcanzar el target de overlap
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i]
      const partTokens = estimateTokens(part)
      
      if (overlapTokens + partTokens <= targetOverlapTokens) {
        overlapText = part + (overlapText.length > 0 ? separator + overlapText : '')
        overlapTokens += partTokens
      } else {
        break
      }
    }
    
    return overlapText
  }
  
  // Procesar el texto completo
  const resultChunks = recursiveSplit(text)
  
  // Filtrar chunks muy pequeños (menos de 50 tokens)
  const filteredChunks = resultChunks.filter(chunk => {
    const tokens = estimateTokens(chunk)
    return tokens >= 50 && chunk.trim().length > 20
  })
  
  console.log(`✅ Chunking completado: ${filteredChunks.length} chunks creados`)
  console.log(`📊 Tamaños de chunks: min=${Math.min(...filteredChunks.map(c => estimateTokens(c)))} tokens, max=${Math.max(...filteredChunks.map(c => estimateTokens(c)))} tokens`)
  
  return filteredChunks
}

// Generate embedding with retry logic and rate limiting
async function generateEmbedding(text: string, retries = 3): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8000), // Truncar si es muy largo
          encoding_format: 'float',
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        
        // Rate limiting - esperar más tiempo
        if (response.status === 429) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 30000) // Backoff exponencial
          console.log(`⏳ Rate limit alcanzado, esperando ${waitTime}ms (intento ${attempt}/${retries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        
        throw new Error(`OpenAI API error: ${response.status} - ${error}`)
      }

      const data: OpenAIEmbeddingResponse = await response.json()
      return data.data[0].embedding
      
    } catch (error) {
      console.error(`Intento ${attempt} fallido:`, error.message)
      
      if (attempt === retries) {
        throw error
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  throw new Error('Failed to generate embedding after all retries')
}

// Process embeddings in batches
async function generateEmbeddingsBatch(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = []
  const batchSize = PROCESSING_CONFIG.BATCH_SIZE
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    console.log(`🔄 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)} (${batch.length} chunks)`)
    
    // Procesar cada chunk del lote secuencialmente para evitar rate limits
    for (const chunk of batch) {
      try {
        const embedding = await generateEmbedding(chunk)
        embeddings.push(embedding)
        
        // Rate limiting entre requests
        await new Promise(resolve => setTimeout(resolve, PROCESSING_CONFIG.RATE_LIMIT_DELAY))
        
      } catch (error) {
        console.error('Error generando embedding para chunk:', error.message)
        // En lugar de fallar completamente, usar un embedding vacío o saltar
        embeddings.push(new Array(1536).fill(0)) // text-embedding-3-small tiene 1536 dimensiones
      }
    }
  }
  
  return embeddings
}

// Sanitize text content - optimizado
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  return text
    .replace(/\\u[0-9a-fA-F]{4}/g, '')
    .replace(/\\x[0-9a-fA-F]{2}/g, '')
    .replace(/\\[rntbf]/g, ' ')
    .replace(/\\/g, '')
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uFFFE\uFFFF]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Process Excel file with memory optimization
async function processExcelFile(file: File): Promise<{ content: string, metadata: any }[]> {
  try {
    console.log('📊 Procesando archivo Excel...')
    
    // Validar tamaño del archivo
    if (file.size > PROCESSING_CONFIG.MAX_FILE_SIZE) {
      throw new Error(`Archivo demasiado grande. Límite: ${PROCESSING_CONFIG.MAX_FILE_SIZE / (1024*1024)}MB`)
    }
    
    const arrayBuffer = await file.arrayBuffer()
    
    // Configurar XLSX para optimizar memoria
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: false,    // Desactivar para mejor rendimiento
      cellNF: false,
      cellText: false,
      dense: true,         // Usar formato denso para menos memoria
      sheetStubs: false,   // No procesar celdas vacías
    })
    
    const documents: { content: string, metadata: any }[] = []
    let totalRows = 0
    
    // Procesar cada hoja con límites
    for (const sheetName of workbook.SheetNames) {
      console.log(`📄 Procesando hoja: ${sheetName}`)
      
      const worksheet = workbook.Sheets[sheetName]
      
      // Obtener rango de la hoja
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
      const maxRows = Math.min(range.e.r + 1, PROCESSING_CONFIG.MAX_ROWS_EXCEL)
      
      if (totalRows + maxRows > PROCESSING_CONFIG.MAX_ROWS_EXCEL * 2) {
        console.log(`⚠️ Límite de filas alcanzado, saltando hojas restantes`)
        break
      }
      
      // Convertir a JSON con límites
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false,
        range: maxRows < range.e.r + 1 ? `A1:${XLSX.utils.encode_col(range.e.c)}${maxRows}` : undefined
      })
      
      // Procesar filas en lotes para evitar problemas de memoria
      for (let i = 0; i < jsonData.length; i += 100) {
        const batch = jsonData.slice(i, i + 100)
        
        batch.forEach((row: any[], rowIndex: number) => {
          if (Array.isArray(row) && row.length > 0) {
            const rowText = row
              .map(cell => String(cell || '').trim())
              .filter(cell => cell.length > 0)
              .join(' | ')
            
            if (rowText.length > 10) { // Filtrar filas muy cortas
              documents.push({
                content: sanitizeText(rowText),
                metadata: {
                  sheetName: sheetName,
                  rowIndex: i + rowIndex,
                  source: 'excel_sheet'
                }
              })
            }
          }
        })
        
        totalRows += batch.length
      }
    }
    
    console.log(`✅ Procesados ${documents.length} documentos desde Excel (${totalRows} filas totales)`)
    
    if (documents.length === 0) {
      throw new Error('El archivo Excel no contiene datos válidos para procesar')
    }
    
    return documents
    
  } catch (error) {
    console.error('❌ Error procesando archivo Excel:', error)
    throw new Error(`Error procesando archivo Excel: ${error.message}`)
  }
}

// Get user's mindop_id (unchanged)
async function getUserMindopId(supabaseClient: any, userId: string): Promise<string> {
  console.log(`🔍 Buscando MindOp para usuario: ${userId}`);
  
  const { data, error } = await supabaseClient
    .from('mindops')
    .select('id, mindop_name, created_at')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('❌ Error consultando MindOp:', error.message);
    
    if (error.code === 'PGRST116') {
      console.log('🔄 No se encontró MindOp para el usuario, creando uno automáticamente...');
      
      try {
        const defaultName = 'Mi MindOp Principal';
        const defaultDescription = 'MindOp creado automáticamente para gestionar tus datos y conversaciones.';
        
        const { data: newMindop, error: createError } = await supabaseClient
          .from('mindops')
          .insert({
            user_id: userId,
            mindop_name: defaultName,
            mindop_description: defaultDescription
          })
          .select('id')
          .single();
          
        if (createError) {
          console.error('❌ Error creando MindOp automáticamente:', createError.message);
          throw new Error(`No se pudo crear MindOp automáticamente. Error: ${createError.message}. Intenta recargar la página.`);
        }
        
        console.log('✅ MindOp creado automáticamente:', newMindop.id);
        return newMindop.id;
        
      } catch (autoCreateError) {
        console.error('❌ Error en creación automática de MindOp:', autoCreateError);
        throw new Error(`No se encontró MindOp para este usuario y no se pudo crear automáticamente. Por favor, recarga la página o contacta al soporte técnico.`);
      }
    } else {
      throw new Error(`Error accediendo a la configuración de MindOp: ${error.message}. Por favor, intenta de nuevo.`);
    }
  }

  if (!data) {
    console.warn('⚠️ Consulta exitosa pero sin datos para el usuario:', userId);
    throw new Error('No se encontró configuración de MindOp para este usuario. Por favor, recarga la página.');
  }

  console.log(`✅ MindOp encontrado: ${data.id} (${data.mindop_name})`);
  return data.id;
}

// Insert chunks in batches to avoid database limits
async function insertChunksBatch(supabaseClient: any, chunks: ChunkData[]): Promise<void> {
  const batchSize = PROCESSING_CONFIG.DB_BATCH_SIZE
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    
    console.log(`💾 Insertando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)} (${batch.length} chunks)`)
    
    const { error } = await supabaseClient
      .from('mindop_document_chunks')
      .insert(batch)

    if (error) {
      throw new Error(`Failed to insert batch ${Math.floor(i/batchSize) + 1}: ${error.message}`)
    }
    
    // Pequeña pausa entre lotes
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user's mindop_id
    const mindopId = await getUserMindopId(supabaseClient, user.id)

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate file type and size
    const fileName = file.name.toLowerCase();
    const isValidExcelFile = fileName.endsWith('.xlsx') || 
                            fileName.endsWith('.xls') || 
                            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                            file.type === 'application/vnd.ms-excel';
    
    if (!isValidExcelFile) {
      return new Response(
        JSON.stringify({ 
          error: 'File must be an Excel file (.xlsx or .xls)',
          received_type: file.type,
          received_name: file.name
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`📁 Procesando archivo: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Process Excel file
    const documents = await processExcelFile(file);
    
    // Combinar contenido de documentos de manera más eficiente
    console.log('🔄 Combinando contenido de documentos...')
    const fullText = documents
      .map(doc => doc.content)
      .filter(content => content.length > 0)
      .join('\n\n')
      // Create chunks with enhanced recursive strategy
    console.log('✂️ Creando chunks con estrategia RAG refinada...')
    const textChunks = createChunks(fullText)
    
    console.log(`📊 Análisis de chunking:`)
    console.log(`   - Total chunks creados: ${textChunks.length}`)
    console.log(`   - Tamaño promedio: ${textChunks.length > 0 ? Math.round(textChunks.reduce((sum, chunk) => sum + estimateTokens(chunk), 0) / textChunks.length) : 0} tokens`)
    console.log(`   - Chunk más pequeño: ${textChunks.length > 0 ? Math.min(...textChunks.map(c => estimateTokens(c))) : 0} tokens`)
    console.log(`   - Chunk más grande: ${textChunks.length > 0 ? Math.max(...textChunks.map(c => estimateTokens(c))) : 0} tokens`)
    
    if (textChunks.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid content chunks could be created from the Excel file' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Limitar chunks si es necesario
    const finalChunks = textChunks.slice(0, PROCESSING_CONFIG.MAX_CHUNKS_PER_REQUEST)
    if (finalChunks.length < textChunks.length) {
      console.log(`⚠️ Limitando a ${PROCESSING_CONFIG.MAX_CHUNKS_PER_REQUEST} chunks (original: ${textChunks.length})`)
    }

    console.log(`🧠 Generando embeddings para ${finalChunks.length} chunks...`);
    
    // Generate embeddings in batches
    const embeddings = await generateEmbeddingsBatch(finalChunks)
    
    // Prepare data for insertion
    const chunksToInsert: ChunkData[] = []
    
    for (let i = 0; i < finalChunks.length; i++) {
      const chunk = finalChunks[i]
      const embedding = embeddings[i]
      
      if (!embedding || embedding.length === 0) {
        console.log(`Saltando chunk ${i + 1} - embedding inválido`)
        continue
      }
        chunksToInsert.push({
        mindop_id: mindopId,
        user_id: user.id,
        content: chunk,
        embedding: embedding,
        source_csv_name: sanitizeText(file.name),
        metadata: {
          chunk_index: i,
          source_type: 'excel',
          total_chunks: finalChunks.length,
          original_documents: documents.length,
          file_size_mb: parseFloat((file.size / 1024 / 1024).toFixed(2)),          // Metadatos de estrategia RAG refinada
          chunking_strategy: 'recursive_character_splitter',
          chunk_size_tokens: PROCESSING_CONFIG.MAX_TOKENS_PER_CHUNK,
          overlap_tokens: PROCESSING_CONFIG.OVERLAP_TOKENS,
          actual_chunk_tokens: estimateTokens(chunk),
          rag_version: '2.0_refined'
        }
      })
    }

    if (chunksToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid content chunks could be created after embedding generation' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`💾 Insertando ${chunksToInsert.length} chunks en la base de datos...`);

    // Insert chunks in batches
    await insertChunksBatch(supabaseClient, chunksToInsert)

    console.log('✅ Proceso completado exitosamente');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Excel file processed successfully',
        file_name: file.name,
        file_size_mb: parseFloat((file.size / 1024 / 1024).toFixed(2)),
        chunks_created: chunksToInsert.length,
        total_documents_processed: documents.length,
        chunks_skipped: textChunks.length - finalChunks.length,
        mindop_id: mindopId,        processing_details: {
          original_documents: documents.length,
          chunks_created: chunksToInsert.length,
          chunks_limited: finalChunks.length < textChunks.length,
          average_chunk_size_tokens: chunksToInsert.length > 0 
            ? Math.round(chunksToInsert.reduce((sum, chunk) => sum + estimateTokens(chunk.content), 0) / chunksToInsert.length)
            : 0,
          // Métricas de estrategia RAG refinada
          chunking_strategy: 'recursive_character_splitter_refined',
          target_chunk_size: PROCESSING_CONFIG.MAX_TOKENS_PER_CHUNK,
          target_overlap: PROCESSING_CONFIG.OVERLAP_TOKENS,
          min_chunk_size: chunksToInsert.length > 0 ? Math.min(...chunksToInsert.map(c => estimateTokens(c.content))) : 0,
          max_chunk_size: chunksToInsert.length > 0 ? Math.max(...chunksToInsert.map(c => estimateTokens(c.content))) : 0,
          processing_config: PROCESSING_CONFIG,
          rag_version: '2.0_refined'
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Error processing Excel file:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Failed to process Excel file',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})