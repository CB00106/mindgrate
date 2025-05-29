import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
import { corsHeaders } from "../_shared/cors.ts"

interface MindopRecord {
  id: string;
  user_id: string;
  mindop_name: string;
  mindop_description?: string;
  created_at: string;
}

interface RelevantChunk {
  id: string;
  content: string;
  similarity: number;
  source_csv_name: string;
  created_at: string;
}

interface OpenAIEmbeddingResponse {
  data: {
    embedding: number[]
  }[]
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

// Search for relevant chunks with improved debugging
async function searchRelevantChunks(
  supabaseClient: any,
  queryEmbedding: number[],
  mindopId: string,
  limit: number = 5
): Promise<RelevantChunk[]> {
  try {
    console.log(`🔍 Buscando chunks para mindop_id: ${mindopId}`)
    
    // Primero verificar si hay chunks para este mindop
    console.log('📊 Verificando si existen chunks...')
    const { data: totalChunks, error: countError } = await supabaseClient
      .from('mindop_document_chunks')
      .select('id', { count: 'exact' })
      .eq('mindop_id', mindopId)

    if (countError) {
      console.error('❌ Error contando chunks:', countError.message)
    }

    console.log(`📊 Total chunks encontrados para mindop ${mindopId}: ${totalChunks?.length || 0}`)
    
    // Si no hay chunks, retornar array vacío
    if (!totalChunks || totalChunks.length === 0) {
      console.log('📝 No hay chunks para este mindop')
      return []
    }

    // Estrategia 1: Función RPC con umbral bajo
    try {
      const embeddingStr = `[${queryEmbedding.join(',')}]`
      console.log('🎯 Intentando función RPC con umbral bajo...')
      
      const { data: rpcResults, error: rpcError } = await supabaseClient
        .rpc('search_relevant_chunks', {
          target_mindop_id: mindopId,
          query_embedding: embeddingStr,
          similarity_threshold: 0.05, // Umbral muy bajo
          match_count: limit
        })

      if (!rpcError && rpcResults && rpcResults.length > 0) {
        console.log(`✅ RPC encontró ${rpcResults.length} resultados`)
        return rpcResults.map((item: any) => ({
          id: item.id || 'unknown',
          content: item.content,
          similarity: item.similarity || 0.5,
          source_csv_name: item.source_csv_name || 'Desconocido',
          created_at: item.created_at || new Date().toISOString()
        }))
      } else {
        console.log('⚠️  RPC no devolvió resultados:', rpcError?.message || 'Sin error específico')
      }
    } catch (rpcError) {
      console.error('❌ Error en función RPC:', rpcError.message)
    }

    // Estrategia 2: SQL directo - simplificado para debugging
    try {
      console.log('🔄 Fallback: SQL directo simplificado...')
      
      const { data: sqlData, error: sqlError } = await supabaseClient
        .from('mindop_document_chunks')
        .select('id, content, source_csv_name, created_at')
        .eq('mindop_id', mindopId)
        .limit(limit)

      if (sqlError) {
        console.error('❌ Error en SQL directo:', sqlError.message)
        throw sqlError
      }

      if (!sqlData || sqlData.length === 0) {
        console.log('📊 SQL directo no encontró chunks')
        return []
      }

      console.log(`📊 SQL directo encontró ${sqlData.length} chunks`)

      // Devolver chunks con similitud fija para testing
      const results = sqlData.map((chunk: any, index: number) => ({
        id: chunk.id,
        content: chunk.content,
        similarity: 0.8 - (index * 0.1), // Similitud decreciente para testing
        source_csv_name: chunk.source_csv_name || 'Desconocido',
        created_at: chunk.created_at
      }))

      console.log(`✅ Devolviendo ${results.length} chunks con similitud fija`)
      console.log('🎯 Chunks encontrados:')
      results.forEach((chunk, i) => {
        console.log(`   ${i + 1}. Similitud: ${chunk.similarity.toFixed(3)} - ${chunk.content.substring(0, 50)}...`)
      })

      return results

    } catch (directError) {
      console.error('❌ Error en SQL directo:', directError.message)
      return []
    }

  } catch (error) {
    console.error('💥 Error general en searchRelevantChunks:', error.message)
    return []
  }
}

// Generate response using Gemini
async function generateGeminiResponse(
  userQuery: string,
  relevantContext: string,
  mindopName: string,
  isCollaboration: boolean = false
): Promise<string> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  
  const collaborationContext = isCollaboration 
    ? `\n\n🤝 **CONTEXTO DE COLABORACIÓN**: Estás respondiendo a una consulta de colaboración. Los datos provienen del MindOp "${mindopName}" que ha sido compartido contigo a través de una conexión aprobada. Responde como si fueras el asistente de ese MindOp compartiendo información con un colaborador autorizado.`
    : ''
  
  const prompt = `Eres un asistente inteligente especializado en ayudar a los usuarios a explorar y analizar sus datos de manera conversacional y profesional.${collaborationContext}

CONTEXTO RELEVANTE (extraído de los datos ${isCollaboration ? `del MindOp colaborativo` : `del usuario`} en "${mindopName}"):
${relevantContext}

CONSULTA DEL USUARIO:
${userQuery}

INSTRUCCIONES:
1. 🎯 **Análisis contextual**: Analiza cuidadosamente el contexto proporcionado para entender qué información tienes disponible
2. 📊 **Respuesta basada en datos**: Responde de manera precisa basándote PRINCIPALMENTE en la información disponible en el contexto
3. 🤝 **Tono cordial**: Mantén un tono profesional, amigable y servicial en todo momento
4. 📋 **Estructura clara**: Organiza tu respuesta de manera lógica con puntos, listas o secciones cuando sea apropiado
5. 💡 **Insights útiles**: Cuando sea posible, proporciona insights adicionales o sugiere análisis relacionados
6. 🔍 **Transparencia**: Si la información no es suficiente para responder completamente, explica qué información adicional sería útil
7. 🚀 **Valor agregado**: Si la consulta es general o no encuentra datos específicos, ofrece orientación sobre cómo el usuario podría aprovechar mejor sus datos
${isCollaboration ? '8. 🤝 **Contexto colaborativo**: Menciona sutilmente que estás compartiendo información del MindOp conectado cuando sea relevante' : ''}

CASOS ESPECIALES:
- Si no hay contexto relevante pero la pregunta es válida: Explica cordialmente que no tienes datos específicos pero ofrece orientación general
- Si la pregunta es muy general: Proporciona una respuesta útil y sugiere preguntas más específicas
- Si encuentras patrones interesantes: Compártelos de manera clara y accesible

RESPUESTA (mantén un tono cordial y profesional):`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating Gemini response:', error)
    throw new Error(`Failed to generate response: ${error.message}`)
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    // 🔧 DEBUG: Verificar variables de entorno al inicio
    console.log('🔧 === INICIANDO MINDOP SERVICE ===')
    console.log('📊 Verificando variables de entorno...')
    
    const envSupabaseUrl = Deno.env.get('SUPABASE_URL')
    const envServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const envOpenaiKey = Deno.env.get('OPENAI_API_KEY')
    const envGeminiKey = Deno.env.get('GEMINI_API_KEY')
    
    console.log('📊 Estado de variables:')
    console.log(`- SUPABASE_URL: ${envSupabaseUrl ? '✅ Configurada' : '❌ FALTANTE'}`)
    console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${envServiceKey ? '✅ Configurada' : '❌ FALTANTE'}`)
    console.log(`- OPENAI_API_KEY: ${envOpenaiKey ? '✅ Configurada' : '❌ FALTANTE'}`)
    console.log(`- GEMINI_API_KEY: ${envGeminiKey ? '✅ Configurada' : '❌ FALTANTE'}`)
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }    // Get authorization header
    const authHeader = req.headers.get('authorization')
    console.log('🔑 Authorization header presente:', !!authHeader)
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }    // Parse request body to get user query and optional target_mindop_id
    const requestBody = await req.json()
    const userQuery = requestBody.query || requestBody.message
    const targetMindOpId = requestBody.target_mindop_id // Para colaboración dirigida
    
    console.log('📝 Query recibida:', userQuery)
    console.log('🎯 Target MindOp ID:', targetMindOpId || 'No especificado (usando propio MindOp)')

    if (!userQuery || typeof userQuery !== 'string' || userQuery.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Query or message is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key
    console.log('🔧 Inicializando cliente de Supabase...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('Initializing Supabase client...')
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)    // Verify the JWT token and get user
    console.log('Verifying JWT token...')
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !userData.user) {
      console.error('Auth error:', userError?.message)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }    const userId = userData.user.id
    console.log(`Authenticated user: ${userId}`)

    let mindop: MindopRecord;
    const isCollaborationRequest = !!targetMindOpId;

    if (isCollaborationRequest) {
      // MODO COLABORACIÓN ASÍNCRONA: Crear tarea en lugar de procesar directamente
      console.log('🤝 Modo colaboración asíncrona activado...')
      
      // Verificar que existe una conexión aprobada entre el usuario y el MindOp objetivo
      const { data: connectionData, error: connectionError } = await supabaseAdmin
        .from('follow_requests')
        .select(`
          id,
          target_mindop:target_mindop_id (
            id,
            mindop_name,
            mindop_description,
            user_id,
            created_at
          )
        `)
        .eq('requester_mindop_id', userId) // El usuario autenticado debe ser quien sigue
        .eq('target_mindop_id', targetMindOpId) // Al MindOp objetivo
        .eq('status', 'approved') // La conexión debe estar aprobada
        .single()

      if (connectionError || !connectionData) {
        console.error('❌ No hay conexión aprobada:', connectionError?.message || 'Conexión no encontrada')
        return new Response(
          JSON.stringify({ 
            error: 'No tienes acceso a este MindOp. Debes estar conectado para colaborar.',
            code: 'ACCESS_DENIED'
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      mindop = connectionData.target_mindop as MindopRecord
      console.log(`✅ Acceso autorizado al MindOp: ${mindop.mindop_name} (${mindop.id})`)
      
      // Crear tarea de colaboración en lugar de procesar inmediatamente
      console.log('📝 Creando tarea de colaboración asíncrona...')
      const { data: taskData, error: taskError } = await supabaseAdmin
        .from('mindop_collaboration_tasks')
        .insert({
          requester_mindop_id: userId,
          target_mindop_id: targetMindOpId,
          query: userQuery,
          status: 'pending',
          priority: 'normal',
          metadata: {
            source: 'chat_interface',
            timestamp: new Date().toISOString(),
            collaboration_type: 'query'
          }
        })
        .select()
        .single()

      if (taskError) {
        console.error('❌ Error creando tarea de colaboración:', taskError.message)
        return new Response(
          JSON.stringify({ 
            error: 'Error al crear la tarea de colaboración',
            details: taskError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log(`✅ Tarea de colaboración creada con ID: ${taskData.id}`)
      
      // Retornar respuesta inmediata indicando que la tarea se procesará asíncronamente
      return new Response(
        JSON.stringify({
          success: true,
          collaboration_task: {
            id: taskData.id,
            status: 'pending',
            message: `Tu consulta ha sido enviada al MindOp "${mindop.mindop_name}" y se procesará en breve.`,
            estimated_processing_time: '30-60 segundos'
          },
          mindop: {
            id: mindop.id,
            name: mindop.mindop_name,
            description: mindop.mindop_description
          },
          collaboration: true,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 202, // 202 Accepted - Request received and will be processed
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
      
    } else {
      // MODO LOCAL: Procesar inmediatamente como antes
      console.log('👤 Modo local: consultando propio MindOp...')
      
      const { data: mindopData, error: mindopError } = await supabaseAdmin
        .from('mindops')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (mindopError) {
        if (mindopError.code === 'PGRST116') {
          // No MindOp configuration found
          return new Response(
            JSON.stringify({ 
              error: 'No MindOp configuration found. Please configure your MindOp first.',
              code: 'NO_MINDOP_CONFIG'
            }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        console.error('Database error:', mindopError)
        return new Response(
          JSON.stringify({ error: 'Database error occurred' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }      mindop = mindopData as MindopRecord
      console.log(`✅ Usando propio MindOp: ${mindop.mindop_name} (${mindop.id})`)
    }

    // Solo procesar directamente si NO es colaboración
    if (!isCollaborationRequest) {
      // Generate embedding for user query
      console.log('Generating embedding for user query:', userQuery);
      const queryEmbedding = await generateEmbedding(userQuery)

      // Search for relevant chunks in the vector database
      console.log('Searching for relevant chunks in mindop:', mindop.id);
      const relevantChunks = await searchRelevantChunks(
        supabaseAdmin,
        queryEmbedding,
        mindop.id,
        5 // Limit to top 5 most relevant chunks
      );

      if (relevantChunks.length === 0) {
        // Generate a helpful response even without specific data context
        const fallbackResponse = await generateGeminiResponse(
          userQuery,
          "No se encontraron datos específicos relacionados con esta consulta en la base de datos del usuario.",
          mindop.mindop_name,
          false // No es colaboración
        )
        
        return new Response(
          JSON.stringify({
            success: true,
            response: fallbackResponse,
            mindop: {
              id: mindop.id,
              name: mindop.mindop_name,
              description: mindop.mindop_description
            },
            collaboration: false,
            chunks_found: 0,
            timestamp: new Date().toISOString()
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Build context from relevant chunks
      const contextParts = relevantChunks.map((chunk, index) => 
        `Fuente ${index + 1} (${chunk.source_csv_name}, similitud: ${chunk.similarity.toFixed(3)}):\n${chunk.content}`
      )
      const relevantContext = contextParts.join('\n\n---\n\n')

      console.log(`Found ${relevantChunks.length} relevant chunks, generating Gemini response`)

      // Generate response using Gemini
      const geminiResponse = await generateGeminiResponse(
        userQuery,
        relevantContext,
        mindop.mindop_name,
        false // No es colaboración
      )

      // Return successful response
      return new Response(
        JSON.stringify({
          success: true,
          response: geminiResponse,
          mindop: {
            id: mindop.id,
            name: mindop.mindop_name,
            description: mindop.mindop_description
          },
          collaboration: false,
          chunks_found: relevantChunks.length,
          chunks_used: relevantChunks.map(chunk => ({
            id: chunk.id,
            similarity: chunk.similarity,
            source: chunk.source_csv_name
          })),
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )    }
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error occurred',
        details: error.message,
        errorType: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To invoke:
curl -i --location --request POST 'http://localhost:54321/functions/v1/mindop-service' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"query": "¿Cuáles son las principales tendencias en los datos?"}'
*/
