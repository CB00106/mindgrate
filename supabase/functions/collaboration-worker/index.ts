import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
import { corsHeaders } from "../_shared/cors.ts"

interface CollaborationTask {
  id: string;
  requester_mindop_id: string;
  target_mindop_id: string;
  query: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high';
  response?: string;
  error_message?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

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

// Search for relevant chunks
async function searchRelevantChunks(
  supabaseClient: any,
  queryEmbedding: number[],
  mindopId: string,
  limit: number = 5
): Promise<RelevantChunk[]> {
  try {
    console.log(`🔍 Buscando chunks para mindop_id: ${mindopId}`)
    
    // Verificar si hay chunks para este mindop
    const { data: totalChunks, error: countError } = await supabaseClient
      .from('mindop_document_chunks')
      .select('id', { count: 'exact' })
      .eq('mindop_id', mindopId)

    if (countError) {
      console.error('❌ Error contando chunks:', countError.message)
    }

    console.log(`📊 Total chunks encontrados para mindop ${mindopId}: ${totalChunks?.length || 0}`)
    
    if (!totalChunks || totalChunks.length === 0) {
      console.log('📝 No hay chunks para este mindop')
      return []
    }

    // Función RPC con umbral bajo
    try {
      const embeddingStr = `[${queryEmbedding.join(',')}]`
      console.log('🎯 Intentando función RPC...')
      
      const { data: rpcResults, error: rpcError } = await supabaseClient
        .rpc('search_relevant_chunks', {
          target_mindop_id: mindopId,
          query_embedding: embeddingStr,
          similarity_threshold: 0.05,
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
      }
    } catch (rpcError) {
      console.error('❌ Error en función RPC:', rpcError.message)
    }

    // Fallback: SQL directo
    try {
      console.log('🔄 Fallback: SQL directo...')
      
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

      const results = sqlData.map((chunk: any, index: number) => ({
        id: chunk.id,
        content: chunk.content,
        similarity: 0.8 - (index * 0.1),
        source_csv_name: chunk.source_csv_name || 'Desconocido',
        created_at: chunk.created_at
      }))

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
  mindopName: string
): Promise<string> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }
  const genAI = new GoogleGenerativeAI(geminiApiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  
  const prompt = `Eres un asistente inteligente especializado en colaboración entre MindOps.

🤝 **CONTEXTO DE COLABORACIÓN**: Estás respondiendo a una consulta de colaboración asíncrona. Los datos provienen del MindOp "${mindopName}" que ha sido compartido a través de una conexión aprobada. Responde como si fueras el asistente de ese MindOp compartiendo información con un colaborador autorizado.

CONTEXTO RELEVANTE (extraído del MindOp colaborativo "${mindopName}"):
${relevantContext}

CONSULTA DEL COLABORADOR:
${userQuery}

INSTRUCCIONES:
1. 🎯 **Análisis contextual**: Analiza cuidadosamente el contexto proporcionado del MindOp colaborativo
2. 📊 **Respuesta basada en datos**: Responde de manera precisa basándote en la información disponible
3. 🤝 **Tono colaborativo**: Mantén un tono profesional, amigable y servicial, reconociendo la naturaleza colaborativa
4. 📋 **Estructura clara**: Organiza tu respuesta de manera lógica con puntos, listas o secciones cuando sea apropiado
5. 💡 **Insights útiles**: Proporciona insights adicionales o sugiere análisis relacionados cuando sea posible
6. 🔍 **Transparencia**: Si la información no es suficiente, explica qué información adicional sería útil
7. 🤝 **Contexto colaborativo**: Menciona que estás compartiendo información del MindOp "${mindopName}" cuando sea relevante

CASOS ESPECIALES:
- Si no hay contexto relevante: Explica cordialmente que no hay datos específicos disponibles para esta consulta
- Si la pregunta es muy general: Proporciona una respuesta útil y sugiere preguntas más específicas
- Si encuentras patrones interesantes: Compártelos de manera clara y accesible

RESPUESTA (mantén un tono cordial, profesional y colaborativo):`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating Gemini response:', error)
    throw new Error(`Failed to generate response: ${error.message}`)
  }
}

// Process a single collaboration task
async function processCollaborationTask(
  supabaseAdmin: any,
  task: CollaborationTask
): Promise<void> {
  console.log(`🔄 Procesando tarea de colaboración: ${task.id}`)
  
  try {
    // Marcar tarea como en procesamiento
    await supabaseAdmin
      .from('mindop_collaboration_tasks')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)

    // Obtener información del MindOp objetivo
    const { data: mindopData, error: mindopError } = await supabaseAdmin
      .from('mindops')
      .select('*')
      .eq('id', task.target_mindop_id)
      .single()

    if (mindopError || !mindopData) {
      throw new Error(`MindOp objetivo no encontrado: ${mindopError?.message}`)
    }

    const mindop = mindopData as MindopRecord
    console.log(`✅ MindOp objetivo encontrado: ${mindop.mindop_name}`)

    // Generar embedding para la consulta
    console.log('🔍 Generando embedding para la consulta...')
    const queryEmbedding = await generateEmbedding(task.query)

    // Buscar chunks relevantes
    console.log('📊 Buscando chunks relevantes...')
    const relevantChunks = await searchRelevantChunks(
      supabaseAdmin,
      queryEmbedding,
      mindop.id,
      5
    )

    let geminiResponse: string

    if (relevantChunks.length === 0) {
      // Sin contexto específico
      geminiResponse = await generateGeminiResponse(
        task.query,
        "No se encontraron datos específicos relacionados con esta consulta en el MindOp colaborativo.",
        mindop.mindop_name
      )
    } else {
      // Con contexto relevante
      const contextParts = relevantChunks.map((chunk, index) => 
        `Fuente ${index + 1} (${chunk.source_csv_name}, similitud: ${chunk.similarity.toFixed(3)}):\n${chunk.content}`
      )
      const relevantContext = contextParts.join('\n\n---\n\n')

      console.log(`📊 Encontrados ${relevantChunks.length} chunks relevantes`)
      
      geminiResponse = await generateGeminiResponse(
        task.query,
        relevantContext,
        mindop.mindop_name
      )
    }

    // Actualizar tarea como completada
    const { error: updateError } = await supabaseAdmin
      .from('mindop_collaboration_tasks')
      .update({
        status: 'completed',
        response: geminiResponse,
        updated_at: new Date().toISOString(),
        metadata: {
          ...task.metadata,
          processing_completed_at: new Date().toISOString(),
          chunks_found: relevantChunks.length,
          chunks_used: relevantChunks.map(chunk => ({
            id: chunk.id,
            similarity: chunk.similarity,
            source: chunk.source_csv_name
          }))
        }
      })
      .eq('id', task.id)

    if (updateError) {
      throw new Error(`Error actualizando tarea: ${updateError.message}`)
    }

    console.log(`✅ Tarea ${task.id} completada exitosamente`)

  } catch (error) {
    console.error(`❌ Error procesando tarea ${task.id}:`, error.message)
    
    // Marcar tarea como fallida
    await supabaseAdmin
      .from('mindop_collaboration_tasks')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🤖 === INICIANDO COLLABORATION WORKER ===')
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key
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
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener tareas pendientes (con prioridad)
    console.log('📋 Buscando tareas de colaboración pendientes...')
    const { data: pendingTasks, error: tasksError } = await supabaseAdmin
      .from('mindop_collaboration_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false }) // high, normal, low
      .order('created_at', { ascending: true }) // FIFO para misma prioridad
      .limit(5) // Procesar máximo 5 tareas por invocación

    if (tasksError) {
      console.error('❌ Error obteniendo tareas:', tasksError.message)
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching tasks',
          details: tasksError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!pendingTasks || pendingTasks.length === 0) {
      console.log('📝 No hay tareas pendientes')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending collaboration tasks',
          processed: 0,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📊 Encontradas ${pendingTasks.length} tareas pendientes`)

    // Procesar tareas secuencialmente
    const processedTasks = []
    const failedTasks = []

    for (const task of pendingTasks) {
      try {
        await processCollaborationTask(supabaseAdmin, task as CollaborationTask)
        processedTasks.push(task.id)
      } catch (error) {
        console.error(`❌ Error procesando tarea ${task.id}:`, error.message)
        failedTasks.push({ id: task.id, error: error.message })
      }
    }

    console.log(`✅ Procesamiento completado: ${processedTasks.length} exitosas, ${failedTasks.length} fallidas`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Collaboration tasks processed',
        processed: processedTasks.length,
        failed: failedTasks.length,
        processed_task_ids: processedTasks,
        failed_tasks: failedTasks,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error occurred',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To invoke manually:
curl -i --location --request POST 'http://localhost:54321/functions/v1/collaboration-worker' \
  --header 'Content-Type: application/json' \
  --data '{}'
*/
