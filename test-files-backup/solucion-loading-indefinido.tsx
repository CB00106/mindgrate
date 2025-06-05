/**
 * PROPUESTA DE SOLUCIÓN: Frontend Anti-Race Condition
 * 
 * Implementar protecciones contra race conditions y mejorar el manejo del estado de loading
 */

// 1. MEJORA EN handleSendMessage con Request ID tracking
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!inputText.trim() || isLoading) return;

  // Generar Request ID único para tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 [${requestId}] Iniciando request: "${inputText.substring(0, 50)}..."`);

  const userMessage: ConversationMessage = {
    id: Date.now(),
    type: 'user',
    content: inputText,
    timestamp: new Date(),
  };

  setConversation(prev => [...prev, userMessage]);
  const originalQuery = inputText;
  setInputText('');
  setIsLoading(true);

  try {
    console.log(`⏳ [${requestId}] Calling MindOp service...`);
    const startTime = Date.now();
    
    const response = await callMindOpService(originalQuery, requestId);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Response received in ${duration}ms`);
    
    if (response.success && response.response) {
      const systemMessage: ConversationMessage = {
        id: Date.now() + 1,
        type: 'system',
        content: response.response,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, systemMessage]);
      
      // Update conversation ID if backend created a new conversation
      if (response.conversation_id && response.conversation_id !== currentConversationId) {
        console.log(`🆕 [${requestId}] Nueva conversación creada: ${response.conversation_id}`);
        setCurrentConversationId(response.conversation_id);
        // Refresh conversation list to show the new conversation
        loadConversationList();
      }

      // Log conversation history usage
      if (response.history_messages_used > 0) {
        console.log(`💬 [${requestId}] Se utilizaron ${response.history_messages_used} mensajes del historial`);
      }

      // Handle collaboration response
      if (response.collaboration_task_id) {
        console.log(`📝 [${requestId}] Nueva tarea de colaboración: ${response.collaboration_task_id}`);
        setPendingCollaborationTasks(prev => new Set([...prev, response.collaboration_task_id]));
        
        const collaborationStatusMessage: ConversationMessage = {
          id: Date.now() + 2,
          type: 'system',
          content: `🤝 **Solicitud de colaboración enviada**\n\nTu consulta ha sido enviada al MindOp colaborador. Te notificaremos cuando tengamos una respuesta.\n\n_Verificando respuestas cada 8 segundos..._`,
          timestamp: new Date(),
          collaboration_task_id: response.collaboration_task_id
        };
        setConversation(prev => [...prev, collaborationStatusMessage]);
      }
    } else {
      console.error(`❌ [${requestId}] Response error:`, response.error);
      const errorMessage: ConversationMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: response.error || 'No se pudieron obtener datos',
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, errorMessage]);
    }
  } catch (error) {
    console.error(`💥 [${requestId}] Caught error:`, error);
    const errorMessage: ConversationMessage = {
      id: Date.now() + 1,
      type: 'error',
      content: error instanceof Error ? error.message : 'Error al consultar tu MindOp',
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, errorMessage]);
  } finally {
    console.log(`🏁 [${requestId}] Request completed, setting loading to false`);
    setIsLoading(false);
  }
};

// 2. MEJORA EN callMindOpService con timeout y retry
const callMindOpService = async (query: string, requestId?: string): Promise<any> => {
  const reqId = requestId || `call_${Date.now()}`;
  console.log(`🔐 [${reqId}] Getting session...`);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log(`🔐 [${reqId}] Sesión activa:`, !!session);
  console.log(`🔑 [${reqId}] Token disponible:`, !!session?.access_token);
  
  if (!session?.access_token) {
    throw new Error('No hay sesión activa');
  }

  // Preparar el payload con conversation_id y target_mindop_id
  const payload: { 
    query: string; 
    target_mindop_id?: string; 
    conversation_id?: string;
  } = { query };
  
  // Agregar conversation_id si existe una conversación activa
  if (currentConversationId) {
    payload.conversation_id = currentConversationId;
    console.log(`💬 [${reqId}] Conversación activa:`, currentConversationId);
  } else {
    console.log(`🆕 [${reqId}] Nueva conversación`);
  }
  
  if (activeMode === 'collaborate' && selectedTarget && selectedTarget.type === 'connected') {
    payload.target_mindop_id = selectedTarget.id;
    console.log(`🤝 [${reqId}] Modo colaboración activado, target:`, selectedTarget.name, selectedTarget.id);
  }

  console.log(`📞 [${reqId}] Llamando a mindop-service con payload:`, payload);
  
  // Configurar timeout de 60 segundos (más tiempo que los 30s actuales)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`⏰ [${reqId}] Request timeout después de 60 segundos`);
    controller.abort();
  }, 60000);
  
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mindop-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`📊 [${reqId}] Response status:`, response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error(`❌ [${reqId}] Error response:`, errorData);
      const message = errorData.error || `Error ${response.status}`;
      const stack = errorData.stack ? `\nStack trace: ${errorData.stack}` : '';
      throw new Error(message + stack);
    }

    const result = await response.json();
    console.log(`✅ [${reqId}] Success response:`, result);
    
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`⏰ [${reqId}] Request fue abortado por timeout`);
      throw new Error('La consulta tardó demasiado tiempo. Por favor, intenta nuevamente.');
    }
    
    console.error(`💥 [${reqId}] Error en fetch:`, error);
    throw error;
  }
};

// 3. PROTECCIÓN ADICIONAL: Prevenir múltiples requests simultáneos
const [requestInProgress, setRequestInProgress] = useState<string | null>(null);

// En handleSendMessage, al inicio:
if (requestInProgress) {
  console.warn(`⚠️ Request ya en progreso: ${requestInProgress}. Ignorando nueva request.`);
  return;
}

setRequestInProgress(requestId);

// En el finally block:
finally {
  console.log(`🏁 [${requestId}] Request completed, clearing in-progress flag`);
  setIsLoading(false);
  setRequestInProgress(null);
}
