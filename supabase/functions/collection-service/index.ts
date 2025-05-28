import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCollectionRequest {
  name: string
  description?: string
  metadata?: Record<string, any>
}

interface AddDocumentToCollectionRequest {
  documentId: string
  collectionId: string
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
    
    if (pathname.endsWith('/collections')) {
      if (req.method === 'GET') {
        return await getCollections(req, supabaseClient)
      } else if (req.method === 'POST') {
        return await createCollection(req, supabaseClient)
      }
    } else if (pathname.includes('/collections/') && pathname.endsWith('/documents')) {
      if (req.method === 'POST') {
        return await addDocumentToCollection(req, supabaseClient)
      } else if (req.method === 'GET') {
        return await getCollectionDocuments(req, supabaseClient)
      }
    } else if (pathname.includes('/collections/') && pathname.endsWith('/stats')) {
      return await getCollectionStats(req, supabaseClient)
    } else if (pathname.includes('/collections/')) {
      const collectionId = pathname.split('/collections/')[1].split('/')[0]
      if (req.method === 'GET') {
        return await getCollection(req, supabaseClient, collectionId)
      } else if (req.method === 'PUT') {
        return await updateCollection(req, supabaseClient, collectionId)
      } else if (req.method === 'DELETE') {
        return await deleteCollection(req, supabaseClient, collectionId)
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Collection service error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function getCollections(req: Request, supabaseClient: any) {
  try {
    const { data: collections, error } = await supabaseClient
      .from('vectors.collections')
      .select(`
        *,
        document_count:vectors.document_collections(count),
        documents:vectors.document_collections(
          document:vectors.documents(id, title, created_at)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Get collections error: ${error.message}`)
    }

    // Transform the data to include proper counts
    const transformedCollections = collections?.map(collection => ({
      ...collection,
      document_count: collection.document_count?.[0]?.count || 0,
      recent_documents: collection.documents?.slice(0, 5).map((dc: any) => dc.document) || []
    })) || []

    return new Response(
      JSON.stringify({ collections: transformedCollections }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Get collections error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get collections', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function createCollection(req: Request, supabaseClient: any) {
  const { name, description, metadata = {} }: CreateCollectionRequest = await req.json()

  if (!name) {
    return new Response(
      JSON.stringify({ error: 'Collection name is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    const { data: collection, error } = await supabaseClient
      .from('vectors.collections')
      .insert({
        name,
        description,
        metadata
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Create collection error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ 
        collection,
        message: 'Collection created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Create collection error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create collection', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getCollection(req: Request, supabaseClient: any, collectionId: string) {
  try {
    const { data: collection, error } = await supabaseClient
      .from('vectors.collections')
      .select(`
        *,
        documents:vectors.document_collections(
          document:vectors.documents(
            *,
            embeddings:vectors.embeddings(count)
          )
        )
      `)
      .eq('id', collectionId)
      .single()

    if (error) {
      throw new Error(`Get collection error: ${error.message}`)
    }

    if (!collection) {
      return new Response(
        JSON.stringify({ error: 'Collection not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Transform the data
    const transformedCollection = {
      ...collection,
      documents: collection.documents?.map((dc: any) => ({
        ...dc.document,
        embedding_count: dc.document.embeddings?.[0]?.count || 0
      })) || []
    }

    return new Response(
      JSON.stringify({ collection: transformedCollection }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Get collection error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get collection', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function updateCollection(req: Request, supabaseClient: any, collectionId: string) {
  const { name, description, metadata }: Partial<CreateCollectionRequest> = await req.json()

  try {
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (metadata !== undefined) updateData.metadata = metadata

    const { data: collection, error } = await supabaseClient
      .from('vectors.collections')
      .update(updateData)
      .eq('id', collectionId)
      .select()
      .single()

    if (error) {
      throw new Error(`Update collection error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ 
        collection,
        message: 'Collection updated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Update collection error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update collection', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function deleteCollection(req: Request, supabaseClient: any, collectionId: string) {
  try {
    const { error } = await supabaseClient
      .from('vectors.collections')
      .delete()
      .eq('id', collectionId)

    if (error) {
      throw new Error(`Delete collection error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ message: 'Collection deleted successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Delete collection error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete collection', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function addDocumentToCollection(req: Request, supabaseClient: any) {
  const { documentId, collectionId }: AddDocumentToCollectionRequest = await req.json()

  if (!documentId || !collectionId) {
    return new Response(
      JSON.stringify({ error: 'Document ID and Collection ID are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    const { data: association, error } = await supabaseClient
      .from('vectors.document_collections')
      .insert({
        document_id: documentId,
        collection_id: collectionId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Add document to collection error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ 
        association,
        message: 'Document added to collection successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Add document to collection error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to add document to collection', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getCollectionDocuments(req: Request, supabaseClient: any) {
  const url = new URL(req.url)
  const collectionId = url.pathname.split('/collections/')[1].split('/')[0]

  try {
    const { data: documents, error } = await supabaseClient
      .from('vectors.document_collections')
      .select(`
        document:vectors.documents(
          *,
          embeddings:vectors.embeddings(count)
        )
      `)
      .eq('collection_id', collectionId)

    if (error) {
      throw new Error(`Get collection documents error: ${error.message}`)
    }

    const transformedDocuments = documents?.map((dc: any) => ({
      ...dc.document,
      embedding_count: dc.document.embeddings?.[0]?.count || 0
    })) || []

    return new Response(
      JSON.stringify({ documents: transformedDocuments }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Get collection documents error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get collection documents', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function getCollectionStats(req: Request, supabaseClient: any) {
  const url = new URL(req.url)
  const collectionId = url.pathname.split('/collections/')[1].split('/')[0]

  try {
    // Get collection basic info
    const { data: collection, error: collectionError } = await supabaseClient
      .from('vectors.collections')
      .select('*')
      .eq('id', collectionId)
      .single()

    if (collectionError) {
      throw new Error(`Get collection error: ${collectionError.message}`)
    }

    // Get document count and stats
    const { data: stats, error: statsError } = await supabaseClient
      .from('vectors.document_collections')
      .select(`
        document:vectors.documents(
          id,
          title,
          created_at,
          embeddings:vectors.embeddings(count)
        )
      `)
      .eq('collection_id', collectionId)

    if (statsError) {
      throw new Error(`Get collection stats error: ${statsError.message}`)
    }

    const documentCount = stats?.length || 0
    const totalEmbeddings = stats?.reduce((total: number, item: any) => {
      return total + (item.document.embeddings?.[0]?.count || 0)
    }, 0) || 0

    const recentDocuments = stats
      ?.map((item: any) => item.document)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5) || []

    return new Response(
      JSON.stringify({
        collection,
        stats: {
          documentCount,
          totalEmbeddings,
          averageEmbeddingsPerDocument: documentCount > 0 ? Math.round(totalEmbeddings / documentCount) : 0,
          recentDocuments
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Get collection stats error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get collection stats', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}
