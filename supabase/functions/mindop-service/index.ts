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

interface CollaborationTask {
  id: string
  requester_mindop_id: string
  target_mindop_id: string
  query: string
  status: 'pending' | 'processing_by_target' | 'target_processing_complete' | 'completed' | 'failed'
  response?: string
  created_at: string
  updated_at: string
  requester_mindop?: {
    id: string
    mindop_name: string
    user_id: string
  }
  target_mindop?: {
    id: string
    mindop_name: string
    user_id: string
  }
}

interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_role: 'user' | 'agent';
  sender_mindop_id?: string;
  content: string;
  created_at: string;
  metadata?: any;
}

interface Conversation {
  id: string;
  user_id: string;
  mindop_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
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

// Load conversation history for context
async function loadConversationHistory(
  supabaseClient: any,
  conversationId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  try {
    const { data: messages, error } = await supabaseClient
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('❌ Error loading conversation history:', error);
      return [];
    }

    return messages || [];
  } catch (error) {
    console.error('❌ Error in loadConversationHistory:', error);
    return [];
  }
}

// Create a new conversation
async function createConversation(
  supabaseClient: any,
  userId: string,
  mindopId: string,
  title?: string
): Promise<string | null> {
  try {
    const { data: conversation, error } = await supabaseClient
      .from('conversations')
      .insert({
        user_id: userId,
        mindop_id: mindopId,
        title: title || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating conversation:', error);
      return null;
    }

    return conversation.id;
  } catch (error) {
    console.error('❌ Error in createConversation:', error);
    return null;
  }
}

// Save messages to conversation
async function saveConversationMessages(
  supabaseClient: any,
  conversationId: string,
  userMessage: string,
  assistantResponse: string,
  mindopId: string
): Promise<boolean> {
  try {
    const messages = [
      {
        conversation_id: conversationId,
        sender_role: 'user',
        content: userMessage,
        created_at: new Date().toISOString()
      },
      {
        conversation_id: conversationId,
        sender_role: 'agent',
        sender_mindop_id: mindopId,
        content: assistantResponse,
        created_at: new Date().toISOString()
      }
    ];

    const { error: messagesError } = await supabaseClient
      .from('conversation_messages')
      .insert(messages);

    if (messagesError) {
      console.error('❌ Error saving conversation messages:', messagesError);
      return false;
    }

    // Update conversation timestamp
    const { error: updateError } = await supabaseClient
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) {
      console.error('❌ Error updating conversation timestamp:', updateError);
    }

    return true;
  } catch (error) {
    console.error('❌ Error in saveConversationMessages:', error);
    return false;
  }
}

// Build conversation context for LLM
function buildConversationContext(
  messages: ConversationMessage[],
  relevantContext: string
): string {
  if (messages.length === 0) {
    return relevantContext;
  }

  // Build conversation history
  const conversationHistory = messages
    .slice(-6) // Last 6 messages to keep context manageable
    .map(msg => {
      const role = msg.sender_role === 'user' ? 'Usuario' : 'Asistente';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');

  return `Historial de conversación reciente:
${conversationHistory}

Información relevante de la base de datos:
${relevantContext}`;
}

// Auto-create MindOp for user if not exists
async function ensureUserHasMindOp(
  supabaseClient: any,
  userId: string
): Promise<MindopRecord> {
  console.log(`🔍 Verificando MindOp para usuario: ${userId}`);
  
  // Try to get existing MindOp
  const { data: existingMindOp, error: findError } = await supabaseClient
    .from('mindops')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (findError) {
    if (findError.code === 'PGRST116') {
      // No MindOp found, create one automatically
      console.log('🔄 No se encontró MindOp, creando automáticamente...');
      
      const defaultName = 'Mi MindOp Principal';
      const defaultDescription = 'MindOp creado automáticamente para gestionar tus datos y conversaciones.';
      
      const { data: newMindOp, error: createError } = await supabaseClient
        .from('mindops')
        .insert({
          user_id: userId,
          mindop_name: defaultName,
          mindop_description: defaultDescription
        })
        .select('*')
        .single();
        
      if (createError) {
        console.error('❌ Error creando MindOp automáticamente:', createError);
        throw new Error(`No se pudo crear MindOp automáticamente: ${createError.message}`);
      }
      
      console.log('✅ MindOp creado automáticamente:', newMindOp.id);
      return newMindOp as MindopRecord;
    } else {
      // Other database error
      console.error('❌ Error consultando MindOp:', findError);
      throw new Error(`Error accediendo a la configuración de MindOp: ${findError.message}`);
    }
  }

  console.log(`✅ MindOp existente encontrado: ${existingMindOp.id}`);
  return existingMindOp as MindopRecord;
}

// Process collaboration task
async function processCollaborationTask(
  supabaseClient: any,
  collaborationTaskId: string,
  userId: string
): Promise<Response> {
  console.log(`🔄 Procesando tarea de colaboración: ${collaborationTaskId}`)
  
  // 1. Leer la tarea de colaboración
  const { data: taskData, error: taskError } = await supabaseClient
    .from('mindop_collaboration_tasks')
    .select(`
      id,
      requester_mindop_id,
      target_mindop_id,
      query,
      status,
      created_at,
      requester_mindop:requester_mindop_id (
        id,
        mindop_name,
        user_id
      ),
      target_mindop:target_mindop_id (
        id,
        mindop_name,
        mindop_description,
        user_id
      )
    `)
    .eq('id', collaborationTaskId)
    .single()

  if (taskError || !taskData) {
    console.error('❌ Error obteniendo tarea de colaboración:', taskError?.message)
    return new Response(
      JSON.stringify({ 
        error: 'Tarea de colaboración no encontrada',
        code: 'COLLABORATION_TASK_NOT_FOUND'
      }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const task: CollaborationTask = taskData as CollaborationTask
  console.log(`📋 Tarea encontrada: ${task.query}`)

  // 2. Validar autorización - el usuario debe ser el propietario del MindOp objetivo
  if (task.target_mindop?.user_id !== userId) {
    console.error('❌ Usuario no autorizado para procesar esta tarea')
    return new Response(
      JSON.stringify({ 
        error: 'No tienes autorización para procesar esta tarea',
        code: 'UNAUTHORIZED_TASK_ACCESS'
      }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // 3. Verificar que la tarea esté en estado 'pending'
  if (task.status !== 'pending') {
    console.error(`❌ Tarea en estado incorrecto: ${task.status}`)
    return new Response(
      JSON.stringify({ 
        error: `La tarea no puede ser procesada. Estado actual: ${task.status}`,
        code: 'INVALID_TASK_STATUS'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  // 4. Actualizar estado a 'processing_by_target'
  const { error: updateError1 } = await supabaseClient
    .from('mindop_collaboration_tasks')
    .update({
      status: 'processing_by_target',
      updated_at: new Date().toISOString()
    })
    .eq('id', collaborationTaskId)

  if (updateError1) {
    console.error('❌ Error actualizando estado a processing:', updateError1.message)
    return new Response(
      JSON.stringify({ 
        error: 'Error actualizando estado de la tarea',
        code: 'STATUS_UPDATE_ERROR'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  console.log('✅ Estado actualizado a processing_by_target')

  try {
    // 5. Procesar la consulta usando la lógica existente
    console.log('🔍 Generando embedding para la consulta...')
    const queryEmbedding = await generateEmbedding(task.query)

    console.log('🔍 Buscando chunks relevantes...')
    const relevantChunks = await searchRelevantChunks(
      supabaseClient,
      queryEmbedding,
      task.target_mindop_id,
      5
    )

    let response: string
    if (relevantChunks.length === 0) {
      // Generar respuesta de fallback
      response = await generateGeminiResponse(
        task.query,
        "No se encontraron datos específicos relacionados con esta consulta en la base de datos.",
        task.target_mindop?.mindop_name || 'MindOp',
        true // Es colaboración
      )
    } else {
      // Construir contexto y generar respuesta
      const contextParts = relevantChunks.map((chunk, index) => 
        `Fuente ${index + 1} (${chunk.source_csv_name}, similitud: ${chunk.similarity.toFixed(3)}):\n${chunk.content}`
      )
      const relevantContext = contextParts.join('\n\n---\n\n')

      response = await generateGeminiResponse(
        task.query,
        relevantContext,
        task.target_mindop?.mindop_name || 'MindOp',
        true // Es colaboración
      )
    }

    console.log('✅ Respuesta generada con Gemini')

    // 6. Actualizar la tarea con la respuesta y estado 'target_processing_complete'
    const { error: updateError2 } = await supabaseClient
      .from('mindop_collaboration_tasks')
      .update({
        response: response,
        status: 'target_processing_complete',
        updated_at: new Date().toISOString()
      })
      .eq('id', collaborationTaskId)

    if (updateError2) {
      console.error('❌ Error actualizando respuesta:', updateError2.message)
      return new Response(
        JSON.stringify({ 
          error: 'Error guardando la respuesta',
          code: 'RESPONSE_SAVE_ERROR'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Tarea de colaboración procesada exitosamente')

    // 7. Retornar respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tarea de colaboración procesada exitosamente',
        task: {
          id: task.id,
          query: task.query,
          response: response,
          status: 'target_processing_complete',
          requester_mindop: task.requester_mindop,
          target_mindop: task.target_mindop
        },
        chunks_found: relevantChunks.length,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (processingError) {
    // Si hay error durante el procesamiento, actualizar la tarea a 'failed'
    console.error('❌ Error durante el procesamiento:', processingError.message)
    
    await supabaseClient
      .from('mindop_collaboration_tasks')
      .update({
        status: 'failed',
        response: `Error procesando la consulta: ${processingError.message}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', collaborationTaskId)

    return new Response(
      JSON.stringify({ 
        error: 'Error procesando la tarea de colaboración',
        details: processingError.message,
        code: 'PROCESSING_ERROR'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
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
    }

    // Get authorization header
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
    
    // Check if this is a collaboration task processing request
    if (requestBody.action_type === 'process_collaboration_task') {
      console.log('🔄 Modo: Procesar tarea de colaboración')
      const collaborationTaskId = requestBody.collaboration_task_id
      
      if (!collaborationTaskId) {
        return new Response(
          JSON.stringify({ error: 'collaboration_task_id is required for process_collaboration_task action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      // Initialize Supabase client with service role key
      console.log('🔧 Inicializando cliente de Supabase para tarea de colaboración...')
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

      // Verify the JWT token and get user
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
      }

      const userId = userData.user.id
      console.log(`Authenticated user for collaboration task: ${userId}`)
      
      // Procesar la tarea de colaboración
      return await processCollaborationTask(supabaseAdmin, collaborationTaskId, userId)
    }
      // Standard mode - process query directly
    const userQuery = requestBody.query || requestBody.message
    const targetMindOpId = requestBody.target_mindop_id // Para colaboración dirigida
    const conversationId = requestBody.conversation_id // Para manejo de conversaciones
    
    console.log('📝 Query recibida:', userQuery)
    console.log('🎯 Target MindOp ID:', targetMindOpId || 'No especificado (usando propio MindOp)')
    console.log('💬 Conversation ID:', conversationId || 'Nueva conversación')

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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the JWT token and get user
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
    }

    const userId = userData.user.id
    console.log(`Authenticated user: ${userId}`)

    let mindop: MindopRecord;
    const isCollaborationRequest = !!targetMindOpId;

    if (isCollaborationRequest) {
      // MODO COLABORACIÓN: Procesar en tiempo real
      console.log('🤝 Modo colaboración en tiempo real...')
      
      // Primero obtener el MindOp ID del usuario autenticado
      const { data: userMindOpData, error: userMindOpError } = await supabaseAdmin
        .from('mindops')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (userMindOpError || !userMindOpData) {
        console.error('❌ Error obteniendo MindOp del usuario:', userMindOpError?.message)
        return new Response(
          JSON.stringify({ 
            error: 'No se pudo encontrar tu MindOp. Verifica tu configuración.',
            code: 'USER_MINDOP_NOT_FOUND'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const userMindOpId = userMindOpData.id
      console.log(`👤 MindOp del usuario: ${userMindOpId}`)
      
      // Verificar que existe una conexión aprobada entre el MindOp del usuario y el MindOp objetivo
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
        .eq('requester_mindop_id', userMindOpId) // El MindOp del usuario debe ser quien sigue
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
        } else {
      // MODO LOCAL: Procesar inmediatamente como antes
      console.log('👤 Modo local: obteniendo o creando MindOp...')
      
      try {
        mindop = await ensureUserHasMindOp(supabaseAdmin, userId);
        console.log(`✅ Usando propio MindOp: ${mindop.mindop_name} (${mindop.id})`)
      } catch (autoCreateError) {
        console.error('❌ Error obteniendo o creando MindOp:', autoCreateError)
        return new Response(
          JSON.stringify({ 
            error: autoCreateError.message || 'No se pudo obtener o crear configuración de MindOp',
            code: 'MINDOP_ACCESS_ERROR'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // === CONVERSATION MANAGEMENT ===
    let currentConversationId = conversationId;
    let conversationHistory: ConversationMessage[] = [];
    
    // If conversation_id is provided, load conversation history
    if (conversationId) {
      console.log('💬 Cargando historial de conversación:', conversationId);
      conversationHistory = await loadConversationHistory(supabaseAdmin, conversationId, 10);
      console.log(`📋 Historial cargado: ${conversationHistory.length} mensajes`);
    } else {
      // Create new conversation if none provided
      console.log('🆕 Creando nueva conversación...');
      const title = userQuery.substring(0, 50) + (userQuery.length > 50 ? '...' : '');
      currentConversationId = await createConversation(supabaseAdmin, userId, mindop.id, title);
      
      if (!currentConversationId) {
        console.error('❌ Error creando nueva conversación');
        // Continue without conversation management for this request
      } else {
        console.log('✅ Nueva conversación creada:', currentConversationId);
      }
    }

    // Procesar tanto consultas locales como de colaboración
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
    );    if (relevantChunks.length === 0) {
      // Generate a helpful response even without specific data context
      const contextWithHistory = conversationHistory.length > 0 
        ? buildConversationContext(conversationHistory, "No se encontraron datos específicos relacionados con esta consulta en la base de datos del usuario.")
        : "No se encontraron datos específicos relacionados con esta consulta en la base de datos del usuario.";
        
      const fallbackResponse = await generateGeminiResponse(
        userQuery,
        contextWithHistory,
        mindop.mindop_name,
        isCollaborationRequest // Usar flag de colaboración
      )
      
      // Save messages to conversation if we have a conversation ID
      if (currentConversationId) {
        await saveConversationMessages(supabaseAdmin, currentConversationId, userQuery, fallbackResponse, mindop.id);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          response: fallbackResponse,
          conversation_id: currentConversationId,
          history_messages_used: conversationHistory.length,
          mindop: {
            id: mindop.id,
            name: mindop.mindop_name,
            description: mindop.mindop_description
          },
          collaboration: isCollaborationRequest,
          chunks_found: 0,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }    // Build context from relevant chunks
    const contextParts = relevantChunks.map((chunk, index) => 
      `Fuente ${index + 1} (${chunk.source_csv_name}, similitud: ${chunk.similarity.toFixed(3)}):\n${chunk.content}`
    )
    const relevantContext = contextParts.join('\n\n---\n\n')
    
    // Build context including conversation history
    const fullContext = conversationHistory.length > 0 
      ? buildConversationContext(conversationHistory, relevantContext)
      : relevantContext;

    console.log(`Found ${relevantChunks.length} relevant chunks, generating Gemini response`)

    // Generate response using Gemini
    const geminiResponse = await generateGeminiResponse(
      userQuery,
      fullContext,
      mindop.mindop_name,
      isCollaborationRequest // Usar flag de colaboración
    )
    
    // Save messages to conversation if we have a conversation ID
    if (currentConversationId) {
      await saveConversationMessages(supabaseAdmin, currentConversationId, userQuery, geminiResponse, mindop.id);
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        response: geminiResponse,
        conversation_id: currentConversationId,
        history_messages_used: conversationHistory.length,
        mindop: {
          id: mindop.id,
          name: mindop.mindop_name,
          description: mindop.mindop_description
        },
        collaboration: isCollaborationRequest,
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
    )

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

Standard mode (direct query):
curl -i --location --request POST 'http://localhost:54321/functions/v1/mindop-service' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"query": "¿Cuáles son las principales tendencias en los datos?"}'

Collaboration mode (direct query to another MindOp):
curl -i --location --request POST 'http://localhost:54321/functions/v1/mindop-service' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"query": "¿Cuáles son las principales tendencias en los datos?", "target_mindop_id": "TARGET_MINDOP_ID"}'

Collaboration task processing mode:
curl -i --location --request POST 'http://localhost:54321/functions/v1/mindop-service' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"action_type": "process_collaboration_task", "collaboration_task_id": "TASK_ID"}'
*/
