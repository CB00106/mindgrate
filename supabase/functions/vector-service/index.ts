import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbeddingRequest {
  text: string
  model?: string
}

interface SimilaritySearchRequest {
  query: string
  threshold?: number
  limit?: number
  collectionIds?: string[]
  documentIds?: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { pathname } = new URL(req.url)
    
    // Route to different handlers based on path
    if (pathname.endsWith('/embed')) {
      return await handleEmbedding(req, supabaseClient)
    } else if (pathname.endsWith('/search')) {
      return await handleSimilaritySearch(req, supabaseClient)
    } else if (pathname.endsWith('/documents')) {
      return await handleDocumentOperations(req, supabaseClient)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('Vector service error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleEmbedding(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { text, model = 'text-embedding-3-small' }: EmbeddingRequest = await req.json()

  if (!text) {
    return new Response(
      JSON.stringify({ error: 'Text is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Generate embedding using OpenAI API
    const embedding = await generateEmbedding(text, model)
    
    return new Response(
      JSON.stringify({ 
        embedding,
        text,
        model,
        dimensions: embedding.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Embedding generation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate embedding', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleSimilaritySearch(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { 
    query, 
    threshold = 0.78, 
    limit = 10, 
    collectionIds,
    documentIds
  }: SimilaritySearchRequest = await req.json()

  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Query is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)
    
    // Log the search session
    await supabaseClient
      .from('vectors.search_sessions')
      .insert({
        query,
        query_embedding: JSON.stringify(queryEmbedding),
        metadata: { threshold, limit, collectionIds, documentIds }
      })

    // Perform similarity search
    const { data: results, error } = await supabaseClient
      .rpc('vectors.similarity_search', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limit,
        filter_document_ids: documentIds || null,
        filter_collection_ids: collectionIds || null
      })

    if (error) {
      throw new Error(`Search error: ${error.message}`)
    }

    // Update search session with results count
    await supabaseClient
      .from('vectors.search_sessions')
      .update({ results_count: results?.length || 0 })
      .eq('query', query)
      .order('created_at', { ascending: false })
      .limit(1)

    return new Response(
      JSON.stringify({ 
        query,
        results: results || [],
        totalResults: results?.length || 0,
        threshold,
        limit
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Similarity search error:', error)
    return new Response(
      JSON.stringify({ error: 'Search failed', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleDocumentOperations(req: Request, supabaseClient: any) {
  if (req.method === 'POST') {
    return await addDocument(req, supabaseClient)
  } else if (req.method === 'GET') {
    return await getDocuments(req, supabaseClient)
  } else {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function addDocument(req: Request, supabaseClient: any) {
  const { title, content, contentType = 'text/plain', sourceUrl, metadata = {}, chunkSize = 1000 } = await req.json()

  if (!title || !content) {
    return new Response(
      JSON.stringify({ error: 'Title and content are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Insert document
    const { data: document, error: docError } = await supabaseClient
      .from('vectors.documents')
      .insert({
        title,
        content,
        content_type: contentType,
        source_url: sourceUrl,
        metadata
      })
      .select()
      .single()

    if (docError) {
      throw new Error(`Document insertion error: ${docError.message}`)
    }

    // Chunk the content
    const chunks = chunkText(content, chunkSize)
    
    // Generate embeddings for each chunk
    const embeddingPromises = chunks.map(async (chunk, index) => {
      const embedding = await generateEmbedding(chunk)
      return {
        chunk_index: index,
        content: chunk,
        embedding: JSON.stringify(embedding),
        metadata: { chunk_size: chunk.length }
      }
    })

    const embeddings = await Promise.all(embeddingPromises)

    // Batch insert embeddings
    const { error: embeddingError } = await supabaseClient
      .rpc('vectors.batch_insert_embeddings', {
        doc_id: document.id,
        embeddings_data: JSON.stringify(embeddings)
      })

    if (embeddingError) {
      throw new Error(`Embedding insertion error: ${embeddingError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        document,
        chunksCreated: embeddings.length,
        message: 'Document added successfully with embeddings'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Add document error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to add document', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getDocuments(req: Request, supabaseClient: any) {
  try {
    const { data: documents, error } = await supabaseClient
      .from('vectors.documents')
      .select(`
        *,
        embeddings:vectors.embeddings(count),
        collections:vectors.document_collections(
          collection:vectors.collections(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Get documents error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ documents }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Get documents error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get documents', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function generateEmbedding(text: string, model: string = 'text-embedding-3-small'): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: model,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
  }

  const result = await response.json()
  return result.data[0].embedding
}

function chunkText(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  let currentChunk = ''
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    if (!trimmedSentence) continue
    
    const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmedSentence
    
    if (potentialChunk.length <= chunkSize) {
      currentChunk = potentialChunk
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.')
      }
      currentChunk = trimmedSentence
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk + '.')
  }
  
  return chunks.length > 0 ? chunks : [text]
}
