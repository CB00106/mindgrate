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
async function generateEmbedding(text: string, requestId?: string): Promise<number[]> {
  const reqId = requestId || 'unknown';
  const startTime = Date.now();
  
  console.log(`🧠 [${reqId}] === GENERANDO EMBEDDING ===`);
  console.log(`📝 [${reqId}] Texto para embedding (${text.length} chars): ${text.substring(0, 100)}...`);
  
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    console.error(`❌ [${reqId}] OPENAI_API_KEY no configurada`);
    throw new Error('OPENAI_API_KEY not configured')
  }

  console.log(`🔑 [${reqId}] OpenAI API Key configurada: ✅`);
  console.log(`🌐 [${reqId}] Enviando request a OpenAI...`);

  try {
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

    const duration = Date.now() - startTime;
    console.log(`⏱️ [${reqId}] OpenAI request completado en ${duration}ms`);

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ [${reqId}] OpenAI API error: ${response.status} - ${error}`);
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }

    const data: OpenAIEmbeddingResponse = await response.json()
    const embedding = data.data[0].embedding;
    
    console.log(`✅ [${reqId}] Embedding generado exitosamente (${embedding.length} dimensiones)`);
    console.log(`📊 [${reqId}] Primer embedding value: ${embedding[0]?.toFixed(6)}`);
    
    return embedding;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [${reqId}] Error generando embedding (${duration}ms):`, error);
    throw error;
  }
}

// Search for relevant chunks with improved debugging
async function searchRelevantChunks(
  supabaseClient: any,
  queryEmbedding: number[],
  mindopId: string,
  limit: number = 5,
  requestId?: string
): Promise<RelevantChunk[]> {
  const reqId = requestId || 'unknown';
  const startTime = Date.now();
  
  console.log(`🔍 [${reqId}] === BÚSQUEDA DE CHUNKS RELEVANTES ===`);
  console.log(`🏷️ [${reqId}] MindOp ID: ${mindopId}`);
  console.log(`📊 [${reqId}] Embedding dimensions: ${queryEmbedding.length}`);
  console.log(`🔢 [${reqId}] Limit: ${limit}`);
  
  try {
      // Primero verificar si hay chunks para este mindop
    console.log(`📊 [${reqId}] Verificando si existen chunks...`);
    const { data: totalChunks, error: countError } = await supabaseClient
      .from('mindop_document_chunks')
      .select('id', { count: 'exact' })
      .eq('mindop_id', mindopId)

    if (countError) {
      console.error(`❌ [${reqId}] Error contando chunks:`, countError.message);
    }

    console.log(`📊 [${reqId}] Total chunks encontrados para mindop ${mindopId}: ${totalChunks?.length || 0}`);
    
    // Si no hay chunks, retornar array vacío
    if (!totalChunks || totalChunks.length === 0) {
      console.log(`📝 [${reqId}] No hay chunks para este mindop`);
      const duration = Date.now() - startTime;
      console.log(`⏱️ [${reqId}] Búsqueda completada en ${duration}ms (sin chunks)`);
      return [];
    }    // Estrategia 1: Función RPC con umbral bajo
    try {
      const embeddingStr = `[${queryEmbedding.join(',')}]`;
      console.log(`🎯 [${reqId}] Intentando función RPC con umbral bajo...`);
      
      const { data: rpcResults, error: rpcError } = await supabaseClient
        .rpc('search_relevant_chunks', {
          target_mindop_id: mindopId,
          query_embedding: embeddingStr,
          similarity_threshold: 0.05, // Umbral muy bajo
          match_count: limit
        })

      if (!rpcError && rpcResults && rpcResults.length > 0) {
        console.log(`✅ [${reqId}] RPC encontró ${rpcResults.length} resultados`);
        const duration = Date.now() - startTime;
        console.log(`⏱️ [${reqId}] Búsqueda RPC completada en ${duration}ms`);
        
        const mappedResults = rpcResults.map((item: any) => ({
          id: item.id || 'unknown',
          content: item.content,
          similarity: item.similarity || 0.5,
          source_csv_name: item.source_csv_name || 'Desconocido',
          created_at: item.created_at || new Date().toISOString()
        }));
        
        console.log(`📊 [${reqId}] Chunks con mayor similitud:`);
        mappedResults.slice(0, 3).forEach((chunk, i) => {
          console.log(`   ${i + 1}. Similitud: ${chunk.similarity.toFixed(3)} - ${chunk.content.substring(0, 50)}...`);
        });
        
        return mappedResults;
      } else {
        console.log(`⚠️ [${reqId}] RPC no devolvió resultados:`, rpcError?.message || 'Sin error específico');
      }
    } catch (rpcError) {
      console.error(`❌ [${reqId}] Error en función RPC:`, rpcError.message);
    }    // Estrategia 2: SQL directo - simplificado para debugging
    try {
      console.log(`🔄 [${reqId}] Fallback: SQL directo simplificado...`);
      
      const { data: sqlData, error: sqlError } = await supabaseClient
        .from('mindop_document_chunks')
        .select('id, content, source_csv_name, created_at')
        .eq('mindop_id', mindopId)
        .limit(limit)

      if (sqlError) {
        console.error(`❌ [${reqId}] Error en SQL directo:`, sqlError.message);
        throw sqlError;
      }

      if (!sqlData || sqlData.length === 0) {
        console.log(`📊 [${reqId}] SQL directo no encontró chunks`);
        const duration = Date.now() - startTime;
        console.log(`⏱️ [${reqId}] Búsqueda completada en ${duration}ms (sin resultados)`);
        return [];
      }

      console.log(`📊 [${reqId}] SQL directo encontró ${sqlData.length} chunks`);

      // Devolver chunks con similitud fija para testing
      const results = sqlData.map((chunk: any, index: number) => ({
        id: chunk.id,
        content: chunk.content,
        similarity: 0.8 - (index * 0.1), // Similitud decreciente para testing
        source_csv_name: chunk.source_csv_name || 'Desconocido',
        created_at: chunk.created_at
      }));

      const duration = Date.now() - startTime;
      console.log(`✅ [${reqId}] Devolviendo ${results.length} chunks con similitud fija en ${duration}ms`);
      console.log(`🎯 [${reqId}] Chunks encontrados:`);
      results.forEach((chunk, i) => {
        console.log(`   ${i + 1}. Similitud: ${chunk.similarity.toFixed(3)} - ${chunk.content.substring(0, 50)}...`);
      });

      return results;

    } catch (directError) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${reqId}] Error en SQL directo (${duration}ms):`, directError.message);
      return [];
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [${reqId}] Error general en searchRelevantChunks (${duration}ms):`, error.message);
    return [];
  }
}

// Generate response using Gemini
async function generateGeminiResponse(
  userQuery: string,
  relevantContext: string,
  mindopName: string,
  isCollaboration: boolean = false,
  requestId?: string
): Promise<string> {
  const reqId = requestId || 'unknown';
  const startTime = Date.now();
  
  console.log(`🤖 [${reqId}] === GENERANDO RESPUESTA CON GEMINI ===`);
  console.log(`📝 [${reqId}] Query: ${userQuery.substring(0, 100)}...`);
  console.log(`🏷️ [${reqId}] MindOp: ${mindopName}`);
  console.log(`🤝 [${reqId}] Es colaboración: ${isCollaboration ? 'Sí' : 'No'}`);
  console.log(`📊 [${reqId}] Contexto length: ${relevantContext.length} chars`);
  
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    console.error(`❌ [${reqId}] GEMINI_API_KEY no configurada`);
    throw new Error('GEMINI_API_KEY not configured')
  }

  console.log(`🔑 [${reqId}] Gemini API Key configurada: ✅`);

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    const collaborationContext = isCollaboration 
      ? `\n\n🤝 **CONTEXTO DE COLABORACIÓN**: Estás respondiendo a una consulta de colaboración. Los datos provienen del MindOp "${mindopName}" que ha sido compartido contigo a través de una conexión aprobada. Responde como si fueras el asistente de ese MindOp compartiendo información con un colaborador autorizado.`
      : ''
    
    const prompt = `Eres un MindOp, un agente de IA avanzado de la plataforma MindOps de Mindgrate. Tu propósito es asistir al usuario (por ejemplo, un Gestor de Proyectos) en la gestión inteligente de sus proyectos y operaciones. Tu especialidad es:

Ayudar a explorar, analizar y extraer insights valiosos de los datos CSV cargados por el usuario, todo de manera conversacional y profesional.
Mantener el contexto de la conversación actual para respuestas coherentes.
Si el usuario inicia una colaboración, interactuar con la información proporcionada por el MindOp colaborador bajo la dirección del usuario. Mantén un tono servicial, preciso y enfocado en la tarea.
${collaborationContext} // Considera si este contexto puede ser más estructurado o qué información específica debe incluir para guiar al LLM.

CONTEXTO RELEVANTE (extraído de los datos CSV ${isCollaboration ? `del MindOp colaborador '${mindopName}'` : `cargados por el usuario para '${mindopName}'`}):
${relevantContext}

CONSULTA DEL USUARIO:
${userQuery}

INSTRUCCIONES:

🎯 Análisis contextual: Analiza cuidadosamente la CONSULTA DEL USUARIO y el CONTEXTO RELEVANTE proporcionado para entender qué información tienes disponible.
📊 Respuesta basada en datos: Responde de manera precisa basándote ESTRICTAMENTE en la información disponible en el CONTEXTO RELEVANTE. Evita especulaciones o información externa a este contexto.
🤝 Tono profesional y colaborativo: Mantén un tono profesional, amigable, servicial y colaborativo en todo momento.
📋 Estructura clara: Organiza tu respuesta de manera lógica y fácil de entender, utilizando puntos, listas o secciones cuando sea apropiado para mejorar la claridad.
💡 Insights para la gestión: Cuando sea posible y esté directamente soportado por el CONTEXTO RELEVANTE, proporciona insights útiles o sugiere análisis que podrían ser valiosos para la gestión de los proyectos u operaciones del usuario.
🔍 Transparencia y limitaciones: Si el CONTEXTO RELEVANTE no es suficiente para responder completamente la CONSULTA DEL USUARIO, indícalo claramente, explica qué tipo de información adicional sería útil o por qué no puedes responder. No inventes respuestas.
🚀 Orientación y valor agregado: Si la CONSULTA DEL USUARIO es general o el CONTEXTO RELEVANTE no contiene datos específicos para responderla, ofrece orientación general sobre cómo el usuario podría formular mejor su pregunta o cómo podría aprovechar sus datos CSV para obtener la información que busca. ${isCollaboration ? "8. 🤝 Contexto colaborativo: Al responder, si es natural y relevante, puedes mencionar sutilmente que la información proviene del MindOp colaborador '" + mindopName + "', para mantener la transparencia sobre el origen de los datos." : ''}
CASOS ESPECIALES:

Si no hay CONTEXTO RELEVANTE pero la CONSULTA DEL USUARIO es una pregunta general válida (no específica de datos): Responde cordialmente que no tienes datos específicos cargados para esa consulta, pero ofrece orientación general o conceptual si aplica a la gestión de proyectos u operaciones.
Si la CONSULTA DEL USUARIO es muy general (ej. "¿Cómo estoy?"): Proporciona una respuesta útil en el marco de tus funciones (análisis de datos para proyectos/operaciones) y sugiere al usuario que realice preguntas más específicas sobre sus datos cargados.
Si encuentras patrones o información destacada en el CONTEXTO RELEVANTE que respondan directamente a la CONSULTA DEL USUARIO: Compártelos de manera clara y accesible.
RESPUESTA (recuerda ser un MindOp profesional, servicial y basar tu respuesta en el contexto proporcionado):`

    console.log(`🌐 [${reqId}] Enviando prompt a Gemini (${prompt.length} chars)...`);
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const responseText = response.text();
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ [${reqId}] Gemini response completado en ${duration}ms`);
    console.log(`📝 [${reqId}] Response length: ${responseText.length} chars`);
    console.log(`✅ [${reqId}] Respuesta generada exitosamente`);
    
    return responseText;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [${reqId}] Error generando respuesta Gemini (${duration}ms):`, error);
    throw new Error(`Failed to generate response: ${error.message}`)
  }
}

// Load conversation history for context
async function loadConversationHistory(
  supabaseClient: any,
  conversationId: string,
  limit: number = 10,
  requestId?: string
): Promise<ConversationMessage[]> {
  const reqId = requestId || 'unknown';
  const startTime = Date.now();
  
  console.log(`📚 [${reqId}] === CARGANDO HISTORIAL DE CONVERSACIÓN ===`);
  console.log(`💬 [${reqId}] Conversation ID: ${conversationId}`);
  console.log(`🔢 [${reqId}] Limit: ${limit}`);
  
  try {
    const { data: messages, error } = await supabaseClient
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${reqId}] Error loading conversation history (${duration}ms):`, error);
      return [];
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [${reqId}] Historial cargado en ${duration}ms: ${messages?.length || 0} mensajes`);
    
    if (messages && messages.length > 0) {
      console.log(`📊 [${reqId}] Primer mensaje: ${messages[0].content.substring(0, 50)}...`);
      console.log(`📊 [${reqId}] Último mensaje: ${messages[messages.length - 1].content.substring(0, 50)}...`);
    }

    return messages || [];
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [${reqId}] Error in loadConversationHistory (${duration}ms):`, error);
    return [];
  }
}

// Create a new conversation
async function createConversation(
  supabaseClient: any,
  userId: string,
  mindopId: string,
  title?: string,
  requestId?: string
): Promise<string | null> {
  const reqId = requestId || 'unknown';
  const startTime = Date.now();
  
  console.log(`🆕 [${reqId}] === CREANDO NUEVA CONVERSACIÓN ===`);
  console.log(`👤 [${reqId}] User ID: ${userId}`);
  console.log(`🏷️ [${reqId}] MindOp ID: ${mindopId}`);
  console.log(`📝 [${reqId}] Title: ${title || 'Sin título'}`);
  
  try {
    const conversationData = {
      user_id: userId,
      mindop_id: mindopId,
      title: title || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`📤 [${reqId}] Insertando conversación...`);
    
    const { data: conversation, error } = await supabaseClient
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${reqId}] Error creating conversation (${duration}ms):`, error);
      return null;
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [${reqId}] Conversación creada en ${duration}ms: ${conversation.id}`);
    console.log(`📊 [${reqId}] Detalles: ${conversation.title || 'Sin título'}`);

    return conversation.id;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [${reqId}] Error in createConversation (${duration}ms):`, error);
    return null;
  }
}

// Save messages to conversation
async function saveConversationMessages(
  supabaseClient: any,
  conversationId: string,
  userMessage: string,
  assistantResponse: string,
  mindopId: string,
  requestId?: string
): Promise<boolean> {
  const reqId = requestId || 'unknown';
  const startTime = Date.now();
  
  console.log(`💾 [${reqId}] === GUARDANDO MENSAJES DE CONVERSACIÓN ===`);
  console.log(`💬 [${reqId}] Conversation ID: ${conversationId}`);
  console.log(`📝 [${reqId}] User message length: ${userMessage.length} chars`);
  console.log(`🤖 [${reqId}] Assistant response length: ${assistantResponse.length} chars`);
  console.log(`🏷️ [${reqId}] MindOp ID: ${mindopId}`);
  
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

    console.log(`📤 [${reqId}] Insertando ${messages.length} mensajes...`);
    
    const { error: messagesError } = await supabaseClient
      .from('conversation_messages')
      .insert(messages);

    if (messagesError) {
      console.error(`❌ [${reqId}] Error saving conversation messages:`, messagesError);
      return false;
    }

    console.log(`✅ [${reqId}] Mensajes guardados exitosamente`);

    // Update conversation timestamp
    console.log(`🔄 [${reqId}] Actualizando timestamp de conversación...`);
    const { error: updateError } = await supabaseClient
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) {
      console.error(`❌ [${reqId}] Error updating conversation timestamp:`, updateError);
    } else {
      console.log(`✅ [${reqId}] Timestamp actualizado`);
    }

    const duration = Date.now() - startTime;
    console.log(`⏱️ [${reqId}] Guardado de conversación completado en ${duration}ms`);
    
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [${reqId}] Error in saveConversationMessages (${duration}ms):`, error);
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
  userId: string,
  requestId?: string
): Promise<MindopRecord> {
  const reqId = requestId || 'unknown';
  const startTime = Date.now();
  
  console.log(`🔍 [${reqId}] === VERIFICANDO/CREANDO MINDOP ===`);
  console.log(`👤 [${reqId}] User ID: ${userId}`);
  
  // Try to get existing MindOp
  console.log(`🔎 [${reqId}] Buscando MindOp existente...`);
  const { data: existingMindOp, error: findError } = await supabaseClient
    .from('mindops')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (findError) {
    console.log(`⚠️ [${reqId}] Error en búsqueda: ${findError.code} - ${findError.message}`);
    
    if (findError.code === 'PGRST116') {
      // No MindOp found, create one automatically
      console.log(`🔄 [${reqId}] No se encontró MindOp, creando automáticamente...`);
      
      const defaultName = 'Mi MindOp Principal';
      const defaultDescription = 'MindOp creado automáticamente para gestionar tus datos y conversaciones.';
      
      console.log(`📝 [${reqId}] Datos del nuevo MindOp:`);
      console.log(`   - Nombre: ${defaultName}`);
      console.log(`   - Descripción: ${defaultDescription}`);
      
      const createStartTime = Date.now();
      const { data: newMindOp, error: createError } = await supabaseClient
        .from('mindops')
        .insert({
          user_id: userId,
          mindop_name: defaultName,
          mindop_description: defaultDescription
        })
        .select('*')
        .single();
        
      const createDuration = Date.now() - createStartTime;
      
      if (createError) {
        console.error(`❌ [${reqId}] Error creando MindOp automáticamente (${createDuration}ms):`, createError);
        throw new Error(`No se pudo crear MindOp automáticamente: ${createError.message}`);
      }
      
      console.log(`✅ [${reqId}] MindOp creado automáticamente en ${createDuration}ms: ${newMindOp.id}`);
      console.log(`📊 [${reqId}] Detalles del nuevo MindOp: ${newMindOp.mindop_name}`);
      
      const totalDuration = Date.now() - startTime;
      console.log(`⏱️ [${reqId}] Proceso completo de creación: ${totalDuration}ms`);
      
      return newMindOp as MindopRecord;
    } else {
      // Other database error
      console.error(`❌ [${reqId}] Error consultando MindOp:`, findError);
      throw new Error(`Error accediendo a la configuración de MindOp: ${findError.message}`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`✅ [${reqId}] MindOp existente encontrado en ${duration}ms: ${existingMindOp.id}`);
  console.log(`📊 [${reqId}] Detalles: ${existingMindOp.mindop_name}`);
  
  return existingMindOp as MindopRecord;
}

// Process collaboration task
async function processCollaborationTask(
  supabaseClient: any,
  collaborationTaskId: string,
  userId: string,
  requestId?: string
): Promise<Response> {
  const reqId = requestId || 'unknown';
  const startTime = Date.now();
  
  console.log(`🔄 [${reqId}] === PROCESANDO TAREA DE COLABORACIÓN ===`);
  console.log(`🆔 [${reqId}] Task ID: ${collaborationTaskId}`);
  console.log(`👤 [${reqId}] User ID: ${userId}`);
  
  // 1. Leer la tarea de colaboración
  console.log(`📖 [${reqId}] Obteniendo tarea de colaboración...`);
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
    const duration = Date.now() - startTime;
    console.error(`❌ [${reqId}] Error obteniendo tarea de colaboración (${duration}ms):`, taskError?.message);
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

  const task: CollaborationTask = taskData as CollaborationTask;
  console.log(`📋 [${reqId}] Tarea encontrada: ${task.query.substring(0, 100)}...`);
  console.log(`📊 [${reqId}] Estado actual: ${task.status}`);
  console.log(`🏷️ [${reqId}] MindOp solicitante: ${task.requester_mindop?.mindop_name}`);
  console.log(`🎯 [${reqId}] MindOp objetivo: ${task.target_mindop?.mindop_name}`);

  // 2. Validar autorización - el usuario debe ser el propietario del MindOp objetivo
  if (task.target_mindop?.user_id !== userId) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${reqId}] Usuario no autorizado para procesar esta tarea (${duration}ms)`);
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
    const duration = Date.now() - startTime;
    console.error(`❌ [${reqId}] Tarea en estado incorrecto (${duration}ms): ${task.status}`);
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
  console.log(`🔄 [${reqId}] Actualizando estado a 'processing_by_target'...`);
  const { error: updateError1 } = await supabaseClient
    .from('mindop_collaboration_tasks')
    .update({
      status: 'processing_by_target',
      updated_at: new Date().toISOString()
    })
    .eq('id', collaborationTaskId)

  if (updateError1) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${reqId}] Error actualizando estado a processing (${duration}ms):`, updateError1.message);
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

  console.log(`✅ [${reqId}] Estado actualizado a processing_by_target`);

  try {
    // 5. Procesar la consulta usando la lógica existente
    console.log(`🔍 [${reqId}] Generando embedding para la consulta...`);
    const queryEmbedding = await generateEmbedding(task.query, reqId);

    console.log(`🔍 [${reqId}] Buscando chunks relevantes...`);
    const relevantChunks = await searchRelevantChunks(
      supabaseClient,
      queryEmbedding,
      task.target_mindop_id,
      5,
      reqId
    );

    let response: string;
    if (relevantChunks.length === 0) {
      console.log(`⚠️ [${reqId}] No se encontraron chunks relevantes, generando respuesta de fallback...`);
      // Generar respuesta de fallback
      response = await generateGeminiResponse(
        task.query,
        "No se encontraron datos específicos relacionados con esta consulta en la base de datos.",
        task.target_mindop?.mindop_name || 'MindOp',
        true, // Es colaboración
        reqId
      );
    } else {
      console.log(`📊 [${reqId}] Generando respuesta con ${relevantChunks.length} chunks relevantes...`);
      // Construir contexto y generar respuesta
      const contextParts = relevantChunks.map((chunk, index) => 
        `Fuente ${index + 1} (${chunk.source_csv_name}, similitud: ${chunk.similarity.toFixed(3)}):\n${chunk.content}`
      );
      const relevantContext = contextParts.join('\n\n---\n\n');

      response = await generateGeminiResponse(
        task.query,
        relevantContext,
        task.target_mindop?.mindop_name || 'MindOp',
        true, // Es colaboración
        reqId
      );
    }

    console.log(`✅ [${reqId}] Respuesta generada con Gemini (${response.length} chars)`);

    // 6. Actualizar la tarea con la respuesta y estado 'target_processing_complete'
    console.log(`💾 [${reqId}] Guardando respuesta en la tarea...`);
    const { error: updateError2 } = await supabaseClient
      .from('mindop_collaboration_tasks')
      .update({
        response: response,
        status: 'target_processing_complete',
        updated_at: new Date().toISOString()
      })
      .eq('id', collaborationTaskId)

    if (updateError2) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${reqId}] Error actualizando respuesta (${duration}ms):`, updateError2.message);
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

    const duration = Date.now() - startTime;
    console.log(`✅ [${reqId}] Tarea de colaboración procesada exitosamente en ${duration}ms`);

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
        processing_duration_ms: duration,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (processingError) {
    // Si hay error durante el procesamiento, actualizar la tarea a 'failed'
    const duration = Date.now() - startTime;
    console.error(`❌ [${reqId}] Error durante el procesamiento (${duration}ms):`, processingError.message);
    
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
        code: 'PROCESSING_ERROR',
        processing_duration_ms: duration
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

serve(async (req: Request) => {
  const requestId = globalThis.crypto.randomUUID().substring(0, 8);
  const startTime = Date.now();
  
  // 🔧 ENHANCED LOGGING: Request Lifecycle Start
  console.log(`🚀 [${requestId}] === INICIANDO MINDOP SERVICE REQUEST ===`);
  console.log(`📅 [${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 [${requestId}] Method: ${req.method}`);
  console.log(`📍 [${requestId}] URL: ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ [${requestId}] CORS preflight handled - Duration: ${Date.now() - startTime}ms`);
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 🔧 ENHANCED LOGGING: Environment Variables Check
    console.log(`🔧 [${requestId}] === VERIFICACIÓN DE CONFIGURACIÓN ===`)
    console.log(`📊 [${requestId}] Verificando variables de entorno...`)
    
    const envSupabaseUrl = Deno.env.get('SUPABASE_URL')
    const envServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const envOpenaiKey = Deno.env.get('OPENAI_API_KEY')
    const envGeminiKey = Deno.env.get('GEMINI_API_KEY')
    
    console.log(`📊 [${requestId}] Estado de variables:`)
    console.log(`- [${requestId}] SUPABASE_URL: ${envSupabaseUrl ? '✅ Configurada' : '❌ FALTANTE'}`)
    console.log(`- [${requestId}] SUPABASE_SERVICE_ROLE_KEY: ${envServiceKey ? '✅ Configurada' : '❌ FALTANTE'}`)
    console.log(`- [${requestId}] OPENAI_API_KEY: ${envOpenaiKey ? '✅ Configurada' : '❌ FALTANTE'}`)
    console.log(`- [${requestId}] GEMINI_API_KEY: ${envGeminiKey ? '✅ Configurada' : '❌ FALTANTE'}`)
    
    // 🔧 ENHANCED LOGGING: Method Validation
    if (req.method !== 'POST') {
      console.log(`❌ [${requestId}] Método no permitido: ${req.method} - Duration: ${Date.now() - startTime}ms`);
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.', requestId }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 🔧 ENHANCED LOGGING: Authentication Check
    const authHeader = req.headers.get('authorization')
    console.log(`🔑 [${requestId}] Authorization header presente: ${!!authHeader}`)
    if (!authHeader) {
      console.log(`❌ [${requestId}] Missing authorization header - Duration: ${Date.now() - startTime}ms`);
      return new Response(
        JSON.stringify({ error: 'Missing authorization header', requestId }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 🔧 ENHANCED LOGGING: Request Body Parsing
    console.log(`📥 [${requestId}] Parsing request body...`);
    let requestBody;
    try {
      requestBody = await req.json()
      console.log(`✅ [${requestId}] Request body parsed successfully`);
      console.log(`📝 [${requestId}] Request keys: ${Object.keys(requestBody).join(', ')}`);
    } catch (parseError) {
      console.error(`❌ [${requestId}] Error parsing request body:`, parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', requestId }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
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
      return await processCollaborationTask(supabaseAdmin, collaborationTaskId, userId, requestId)
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
        mindop = await ensureUserHasMindOp(supabaseAdmin, userId, requestId);
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
      conversationHistory = await loadConversationHistory(supabaseAdmin, conversationId, 10, requestId);
      console.log(`📋 Historial cargado: ${conversationHistory.length} mensajes`);
    } else {      // Create new conversation if none provided
      console.log('🆕 Creando nueva conversación...');
      const title = userQuery.substring(0, 50) + (userQuery.length > 50 ? '...' : '');
      currentConversationId = await createConversation(supabaseAdmin, userId, mindop.id, title, requestId);
      
      if (!currentConversationId) {
        console.error('❌ Error creando nueva conversación');
        // Continue without conversation management for this request
      } else {
        console.log('✅ Nueva conversación creada:', currentConversationId);
      }
    }    // Procesar tanto consultas locales como de colaboración
    // Generate embedding for user query
    console.log('Generating embedding for user query:', userQuery);
    const queryEmbedding = await generateEmbedding(userQuery, requestId)    // Search for relevant chunks in the vector database
    console.log('Searching for relevant chunks in mindop:', mindop.id);
    const relevantChunks = await searchRelevantChunks(
      supabaseAdmin,
      queryEmbedding,
      mindop.id,
      5, // Limit to top 5 most relevant chunks
      requestId
    );if (relevantChunks.length === 0) {
      // Generate a helpful response even without specific data context
      const contextWithHistory = conversationHistory.length > 0 
        ? buildConversationContext(conversationHistory, "No se encontraron datos específicos relacionados con esta consulta en la base de datos del usuario.")
        : "No se encontraron datos específicos relacionados con esta consulta en la base de datos del usuario.";
          const fallbackResponse = await generateGeminiResponse(
        userQuery,
        contextWithHistory,
        mindop.mindop_name,
        isCollaborationRequest, // Usar flag de colaboración
        requestId
      )
        // Save messages to conversation if we have a conversation ID
      if (currentConversationId) {
        await saveConversationMessages(supabaseAdmin, currentConversationId, userQuery, fallbackResponse, mindop.id, requestId);
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

    console.log(`Found ${relevantChunks.length} relevant chunks, generating Gemini response`)    // Generate response using Gemini
    const geminiResponse = await generateGeminiResponse(
      userQuery,
      fullContext,
      mindop.mindop_name,
      isCollaborationRequest, // Usar flag de colaboración
      requestId
    )
      // Save messages to conversation if we have a conversation ID
    if (currentConversationId) {
      await saveConversationMessages(supabaseAdmin, currentConversationId, userQuery, geminiResponse, mindop.id, requestId);
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
