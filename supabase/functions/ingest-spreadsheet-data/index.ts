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

// Simple tokenizer estimation (more reliable than external dependencies)
function estimateTokens(text: string): number {
  // GPT-3/4 tokenization approximation: ~1 token per 4 characters for English
  return Math.ceil(text.length / 4)
}

// Split text into chunks with overlap
function createChunks(text: string, maxTokens = 450, overlapTokens = 50): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentTokens = 0
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim()
    if (!sentence) continue
    
    const sentenceTokens = estimateTokens(sentence)
    
    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      // Finalize current chunk
      chunks.push(currentChunk.join('. ') + '.')
      
      // Start new chunk with overlap
      const overlapSentences = Math.min(2, currentChunk.length) // Keep last 2 sentences for overlap
      currentChunk = currentChunk.slice(-overlapSentences)
      currentTokens = estimateTokens(currentChunk.join('. '))
    }
    
    currentChunk.push(sentence)
    currentTokens += sentenceTokens
  }
  
  // Add the last chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('. ') + '.')
  }
  
  return chunks.filter(chunk => chunk.trim().length > 10) // Minimum chunk size
}

// Generate embedding using OpenAI API
async function generateEmbedding(text: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data: OpenAIEmbeddingResponse = await response.json()
  return data.data[0].embedding
}

// Sanitize text content to handle Unicode and special characters
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  return text
    // Remove or replace problematic Unicode escape sequences
    .replace(/\\u[0-9a-fA-F]{4}/g, '') // Remove Unicode escape sequences like \u0000
    .replace(/\\x[0-9a-fA-F]{2}/g, '') // Remove hex escape sequences like \x00
    .replace(/\\[rntbf]/g, ' ')        // Replace escape sequences with space
    .replace(/\\/g, '')                // Remove remaining backslashes
    // Remove null bytes and other control characters
    .replace(/\0/g, '')                // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    // Handle problematic Unicode characters
    .replace(/[\uFFFE\uFFFF]/g, '')    // Remove non-characters
    .replace(/[\uD800-\uDFFF]/g, '')   // Remove surrogate pairs (incomplete Unicode)
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

// Process Excel file using XLSX library
async function processExcelFile(file: File): Promise<{ content: string, metadata: any }[]> {
  try {
    console.log('📊 Procesando archivo Excel...')
    
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Parse Excel file
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    })
    
    const documents: { content: string, metadata: any }[] = []
    
    // Process each worksheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`📄 Procesando hoja: ${sheetName}`)
      
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to JSON format (array of objects)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Use array format
        defval: '', // Default value for empty cells
        blankrows: false // Skip blank rows
      })
      
      // Process each row
      jsonData.forEach((row: any[], rowIndex: number) => {
        if (Array.isArray(row) && row.length > 0) {
          // Convert row to text
          const rowText = row
            .map(cell => String(cell || '').trim())
            .filter(cell => cell.length > 0)
            .join(' | ')
          
          if (rowText.length > 0) {
            documents.push({
              content: sanitizeText(rowText),
              metadata: {
                sheetName: sheetName,
                rowIndex: rowIndex,
                source: 'excel_sheet'
              }
            })
          }
        }
      })
    }
    
    console.log(`✅ Procesados ${documents.length} documentos desde Excel`)
    
    if (documents.length === 0) {
      throw new Error('El archivo Excel no contiene datos válidos para procesar')
    }
    
    return documents
    
  } catch (error) {
    console.error('❌ Error procesando archivo Excel:', error)
    throw new Error(`Error procesando archivo Excel: ${error.message}`)
  }
}

// Get user's mindop_id with improved error handling and auto-creation fallback
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
      // No rows found - el usuario no tiene MindOp, crear uno automáticamente
      console.log('🔄 No se encontró MindOp para el usuario, creando uno automáticamente...');
      
      try {
        // Crear MindOp por defecto sin necesidad de obtener info adicional del usuario
        const defaultName = 'Mi MindOp Principal';
        const defaultDescription = 'MindOp creado automáticamente para gestionar tus datos y conversaciones.';
        
        // Crear MindOp automáticamente usando el cliente que ya tiene autorización
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
      // Otro tipo de error de base de datos
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

// Insert chunks into database
async function insertChunks(supabaseClient: any, chunks: ChunkData[]): Promise<void> {
  const { error } = await supabaseClient
    .from('mindop_document_chunks')
    .insert(chunks)

  if (error) {
    throw new Error(`Failed to insert chunks: ${error.message}`)
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

    // Validate file type for Excel files
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

    console.log(`📁 Procesando archivo: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Process Excel file
    const documents = await processExcelFile(file);
    
    // Combine all document content for chunking
    const fullText = documents.map(doc => doc.content).join('\n\n')
    
    // Create chunks
    const textChunks = createChunks(fullText)
    
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

    // Generate embeddings and prepare data for insertion
    const chunksToInsert: ChunkData[] = []
    
    console.log(`🔄 Generando embeddings para ${textChunks.length} chunks...`);
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i]
      
      // Sanitize chunk content before processing
      const sanitizedContent = sanitizeText(chunk)
      
      if (sanitizedContent.length === 0) {
        console.log(`Skipping empty chunk ${i + 1} after sanitization`)
        continue
      }

      try {
        const embedding = await generateEmbedding(sanitizedContent)
        
        // Validate embedding array
        if (!Array.isArray(embedding) || embedding.length === 0) {
          console.error(`Invalid embedding for chunk ${i + 1}`)
          continue
        }
        
        // Ensure all embedding values are valid numbers
        const validEmbedding = embedding.map(val => {
          if (typeof val !== 'number' || !isFinite(val)) {
            return 0.0 // Replace invalid values with 0
          }
          return val
        })
        
        chunksToInsert.push({
          mindop_id: mindopId,
          user_id: user.id,
          content: sanitizedContent,
          embedding: validEmbedding,
          source_csv_name: sanitizeText(file.name),
          metadata: {
            chunk_index: i,
            source_type: 'excel',
            total_chunks: textChunks.length,
            original_documents: documents.length
          }
        })
        
        // Add a small delay to avoid rate limiting
        if (i < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Log progress every 10 chunks
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Procesados ${i + 1}/${textChunks.length} chunks`);
        }
        
      } catch (error) {
        console.error(`Failed to generate embedding for chunk ${i + 1}:`, error)
        throw new Error(`Failed to generate embedding for chunk ${i + 1}: ${error.message}`)
      }
    }

    // Check if we have any chunks to insert after sanitization
    if (chunksToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid content chunks could be created after processing' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`💾 Insertando ${chunksToInsert.length} chunks en la base de datos...`);

    // Insert all chunks into database
    await insertChunks(supabaseClient, chunksToInsert)

    console.log('✅ Proceso completado exitosamente');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Excel file processed successfully',
        file_name: file.name,
        chunks_created: chunksToInsert.length,
        total_documents_processed: documents.length,
        mindop_id: mindopId,
        processing_details: {
          original_documents: documents.length,
          chunks_created: chunksToInsert.length,
          average_chunk_size_tokens: chunksToInsert.length > 0 
            ? Math.round(chunksToInsert.reduce((sum, chunk) => sum + estimateTokens(chunk.content), 0) / chunksToInsert.length)
            : 0
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