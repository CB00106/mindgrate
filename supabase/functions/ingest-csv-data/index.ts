import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { parse as csvParse } from 'https://deno.land/std@0.168.0/encoding/csv.ts'

interface ChunkData {
  mindop_id: string
  user_id: string
  content: string
  embedding: number[]
  source_csv_name: string
}

interface OpenAIEmbeddingResponse {
  data: {
    embedding: number[]
  }[]
}

// Simple tokenizer for text-embedding-3-small (approximate GPT-4 tokenization)
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  // This is a simplification but works for chunking purposes
  return Math.ceil(text.length / 4)
}

// Split text into chunks with overlap
function createChunks(text: string, maxTokens = 450, overlapTokens = 50): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentTokens = 0
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const wordTokens = estimateTokens(word)
    
    if (currentTokens + wordTokens > maxTokens && currentChunk.length > 0) {
      // Finalize current chunk
      chunks.push(currentChunk.join(' '))
      
      // Start new chunk with overlap
      const overlapWords = Math.floor(overlapTokens / 4) // Approximate words for overlap
      const startOverlap = Math.max(0, currentChunk.length - overlapWords)
      currentChunk = currentChunk.slice(startOverlap)
      currentTokens = estimateTokens(currentChunk.join(' '))
    }
    
    currentChunk.push(word)
    currentTokens += wordTokens
  }
  
  // Add the last chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }
  
  return chunks.filter(chunk => chunk.trim().length > 0)
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
// Sanitize text content to avoid Unicode and database issues
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

// Parse CSV content with better error handling
function parseCSVContent(csvContent: string): string[] {
  try {
    // Clean the CSV content first
    const cleanedContent = csvContent
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')    // Handle old Mac line endings
      .trim()

    // Try different parsing strategies
    let parsed;
    
    try {
      // First try: standard parsing
      parsed = csvParse(cleanedContent, { 
        skipFirstRow: false,
        separator: ','
      })
    } catch (firstError) {
      console.log('Standard CSV parsing failed, trying alternative methods...')
      
      try {
        // Second try: more lenient parsing
        parsed = csvParse(cleanedContent, { 
          skipFirstRow: false,
          separator: ','
        })
      } catch (secondError) {
        // Third try: simple line-by-line parsing for malformed CSVs
        console.log('Advanced CSV parsing failed, using simple line parsing...')
        const lines = cleanedContent.split('\n').filter(line => line.trim())
        return lines.map(line => {
          // Simple comma splitting with basic quote handling
          const sanitized = sanitizeText(line.replace(/"/g, ''))
          return sanitized.split(',').join(' | ').trim()
        }).filter(line => line.length > 0)
      }
    }
    
    const rows: string[] = []
    
    for (const row of parsed) {
      // Convert each row to a string representation
      if (Array.isArray(row)) {
        const rowText = row.map(cell => sanitizeText(String(cell))).join(' | ')
        if (rowText.trim()) {
          rows.push(rowText.trim())
        }
      } else {
        // Handle object format (with headers)
        const values = Object.values(row).map(cell => sanitizeText(String(cell))).join(' | ')
        if (values.trim()) {
          rows.push(values.trim())
        }
      }
    }
    
    return rows
  } catch (error) {
    // Provide more helpful error messages
    const errorMessage = error.message || 'Unknown parsing error'
    
    if (errorMessage.includes('bare " in non-quoted-field')) {
      throw new Error(`CSV contiene comillas mal formateadas. Por favor revisa que todas las comillas estén correctamente cerradas en tu archivo CSV. Error técnico: ${errorMessage}`)
    } else if (errorMessage.includes('parse error')) {
      throw new Error(`El archivo CSV tiene un formato inválido. Por favor verifica que esté correctamente formateado (separado por comas, con comillas correctas). Error técnico: ${errorMessage}`)
    } else {
      throw new Error(`Error al procesar el archivo CSV: ${errorMessage}`)
    }
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

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return new Response(
        JSON.stringify({ error: 'File must be a CSV file' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Read and parse CSV content
    const csvContent = await file.text()
    const csvRows = parseCSVContent(csvContent)
    
    if (csvRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'CSV file is empty or invalid' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )    }

    // Combine rows into text for chunking
    const fullText = csvRows.join('\n')
    
    // Create chunks
    const textChunks = createChunks(fullText)
    
    if (textChunks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid text chunks could be created from CSV' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }    // Generate embeddings and prepare data for insertion
    const chunksToInsert: ChunkData[] = []
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i]
      // Sanitize chunk content before processing
      const sanitizedChunk = sanitizeText(chunk)
      
      if (sanitizedChunk.length === 0) {
        console.log(`Skipping empty chunk ${i + 1} after sanitization`)
        continue
      }
        try {
        const embedding = await generateEmbedding(sanitizedChunk)
        
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
          content: sanitizedChunk,
          embedding: validEmbedding,
          source_csv_name: sanitizeText(file.name)
        })
        
        // Add a small delay to avoid rate limiting
        if (i < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error(`Failed to generate embedding for chunk ${i + 1}:`, error)
        throw new Error(`Failed to generate embedding for chunk ${i + 1}: ${error.message}`)
      }    }

    // Check if we have any chunks to insert after sanitization
    if (chunksToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid content chunks could be created after processing. The CSV may contain only invalid characters or empty data.' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Insert all chunks into database
    await insertChunks(supabaseClient, chunksToInsert)// Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'CSV file processed successfully',
        file_name: file.name,
        chunks_created: chunksToInsert.length,
        total_rows_processed: csvRows.length,
        mindop_id: mindopId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error processing CSV:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Failed to process CSV file',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
