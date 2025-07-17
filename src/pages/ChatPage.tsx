import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, Users, User, Send, MessageSquare, Plus, Trash2, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';
import { supabase } from '@/services/supabaseClient';
import { useMindOp } from '@/hooks/useMindOp';
import { logger } from '@/utils/logger';

interface ConversationMessage {
  id: number;
  type: 'user' | 'system' | 'data' | 'error' | 'collaboration_response';
  content: string;
  data?: any[];
  timestamp: Date;
  collaboration_task_id?: string;
  collaboration_response_from?: {
    mindop_id: string;
    mindop_name: string;
  };
}

interface ConnectedMindOp {
  id: string;
  mindop_name: string;
  mindop_description?: string;
  user_id: string;
}

interface CollaborationTarget {
  type: 'own' | 'connected';
  id: string;
  name: string;
  description?: string;
}

interface CollaborationTask {
  id: string;
  requester_mindop_id: string;
  target_mindop_id: string;
  query: string;
  status: 'pending' | 'processing_by_target' | 'target_processing_complete' | 'completed' | 'failed';
  response?: string;
  created_at: string;
  updated_at: string;
  target_mindop?: {
    id: string;
    mindop_name: string;
    mindop_description?: string;
  };
}

interface StoredConversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  mindop_id: string;
  message_count?: number;
  preview?: string;
}

// StoredMessage interface - used for type checking database responses
interface StoredMessage {
  id: string;
  conversation_id: string;
  sender_role: 'user' | 'agent';
  content: string;
  created_at: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { mindop: userMindOp, initialized: mindOpInitialized } = useMindOp();
  const userMindOpId = userMindOp?.id || null;
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);  const [requestInProgress, setRequestInProgress] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'local' | 'sync_collaboration' | 'async_task'>('local');
  
  // Estados para colaboración dirigida
  const [connectedMindOps, setConnectedMindOps] = useState<ConnectedMindOp[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<CollaborationTarget | null>(null);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [availableTargets, setAvailableTargets] = useState<CollaborationTarget[]>([]);
  
  // Estados para el polling de respuestas de colaboración
  const [pendingCollaborationTasks, setPendingCollaborationTasks] = useState<Set<string>>(new Set());
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Estado para conversación (se actualiza dinámicamente)
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    // Estado para gestión de conversaciones
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationList, setConversationList] = useState<StoredConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Cerrado por defecto para móvil
    // Ref para auto-scroll
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Hook para detectar el tamaño de pantalla y ajustar sidebar
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      if (isMobile && sidebarOpen) {
        // En móvil, cerrar sidebar por defecto
        setSidebarOpen(false);
      } else if (!isMobile && !sidebarOpen) {
        // En desktop, abrir sidebar por defecto
        setSidebarOpen(true);
      }
    };

    // Ejecutar al montar
    handleResize();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Solo ejecutar una vez al montar

  // Inicializar mensaje de bienvenida solo para nuevas conversaciones
  useEffect(() => {
    if (!currentConversationId && conversation.length === 0) {      const getWelcomeMessage = () => {
        const firstName = user?.user_metadata?.first_name || 'Usuario';
        
        if (activeMode === 'sync_collaboration' && selectedTarget) {
          if (selectedTarget.type === 'connected') {
            return `¡Hola ${firstName}! 👋 

Estás en modo colaboración síncrona con **${selectedTarget.name}**. 

Puedes hacer preguntas sobre los datos de este MindOp conectado. Por ejemplo:
• "¿Qué tendencias muestran tus datos?"
• "Comparte un resumen de tu información"
• "¿Qué patrones interesantes has encontrado?"

El MindOp target procesará tu consulta de forma síncrona y compartirá insights de sus datos contigo.

¿Qué te gustaría saber?`;
          } else {
            return `¡Hola ${firstName}! 👋 

Estás consultando tu propio MindOp en modo colaboración síncrona.

Puedes preguntarme sobre:
• Análisis de tendencias en tus datos
• Búsqueda de información específica
• Resúmenes y estadísticas
• Patrones o insights interesantes

¿En qué puedo ayudarte hoy?`;
          }
        } else {
          return `¡Hola ${firstName}! 👋 

Soy tu asistente inteligente de MindOp. Estoy aquí para ayudarte a explorar y analizar tus datos de manera conversacional.

En modo **local**, trabajarás directamente con tus datos almacenados.

Puedes preguntarme sobre:
• Análisis de tendencias en tus datos
• Búsqueda de información específica
• Resúmenes y estadísticas
• Patrones o insights interesantes

¿En qué puedo ayudarte hoy?`;
        }
      };

      const welcomeMessage: ConversationMessage = {
        id: 1,
        type: 'system',
        content: getWelcomeMessage(),
        timestamp: new Date(),
      };

      setConversation([welcomeMessage]);
    }
  }, [user, activeMode, selectedTarget, currentConversationId]);

  // Efecto para cerrar el selector cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTargetSelector) {
        const target = event.target as Element;
        if (!target.closest('[data-target-selector]')) {
          setShowTargetSelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTargetSelector]);  // Cargar conexiones del usuario al montar el componente
  useEffect(() => {
   // Cambiar la función `initializePageData` dentro del useEffect:
const initializePageData = async () => {
  // Wait for mindop to be initialized
  if (!mindOpInitialized) {
    logger.debug('ChatPage', 'Waiting for mindop initialization...');
    return;
  }

  if (!userMindOpId) {
    logger.debug('ChatPage', 'User has no MindOp yet, skipping data initialization');
    return;
  }

  logger.debug('ChatPage', 'MindOp initialized, loading page data...', { userMindOpId });    try {
      await Promise.all([
        loadUserConnections(),
        initializeCollaborationTargets(),
        loadConversationList()
      ]);
      logger.debug('ChatPage', 'Page data initialized successfully');
    } catch (error) {
      logger.error('ChatPage Error initializing page data:', error);
    }
};

initializePageData();
}, [userMindOpId, mindOpInitialized]); // ✅ Cambiar dependencias

  // Inicializar targets disponibles cuando cambian las conexiones
  useEffect(() => {
    initializeCollaborationTargets();
  }, [connectedMindOps, userMindOpId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  // Efecto para el polling de respuestas de colaboración
  useEffect(() => {
    if (!userMindOpId || pendingCollaborationTasks.size === 0) {
      // Limpiar el intervalo si no hay tareas pendientes
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    // Iniciar polling solo si no hay uno activo
    if (!pollingInterval) {
      logger.collaboration('Iniciando polling para respuestas de colaboración...');
      const interval = setInterval(async () => {
        await checkForCollaborationResponses();
      }, 8000); // Revisar cada 8 segundos

      setPollingInterval(interval);
    }

    // Cleanup al desmontar
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [userMindOpId, pendingCollaborationTasks.size]);

  // Cleanup del polling al desmontar el componente
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const loadUserConnections = async () => {
    if (!userMindOpId) return;

    setLoadingConnections(true);
    try {
      logger.debug('ChatPage', 'Cargando conexiones para MindOp:', userMindOpId);
      
      // Obtener MindOps que el usuario sigue (conexiones aprobadas)
      const followingData = await notificationService.getFollowingMindOps(userMindOpId);
      
      logger.debug('ChatPage', 'Conexiones obtenidas:', followingData);
      
      // Mapear a la estructura que necesitamos
      const connectedMindOps: ConnectedMindOp[] = followingData.map(connection => ({
        id: connection.target_mindop.id,
        mindop_name: connection.target_mindop.mindop_name,
        mindop_description: connection.target_mindop.mindop_description,
        user_id: connection.target_mindop.user_id
      }));

      setConnectedMindOps(connectedMindOps);
      logger.debug('ChatPage', 'Conexiones cargadas:', connectedMindOps.length);
      
    } catch (error) {
      logger.error('Error cargando conexiones:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const initializeCollaborationTargets = async () => {
    if (!userMindOpId) return;

    try {
      // Obtener información del propio MindOp
      const { data: ownMindOp, error } = await supabase
        .from('mindops')
        .select('id, mindop_name, mindop_description')
        .eq('id', userMindOpId)
        .single();

      if (error) {
        logger.error('Error obteniendo propio MindOp:', error);
        return;
      }

      const targets: CollaborationTarget[] = [
        // Propio MindOp
        {
          type: 'own',
          id: ownMindOp.id,
          name: ownMindOp.mindop_name,
          description: ownMindOp.mindop_description
        },
        // MindOps conectados
        ...connectedMindOps.map(mindop => ({
          type: 'connected' as const,
          id: mindop.id,
          name: mindop.mindop_name,
          description: mindop.mindop_description
        }))
      ];

      setAvailableTargets(targets);
      
      // Seleccionar por defecto el propio MindOp si no hay selección
      if (!selectedTarget && targets.length > 0) {
        setSelectedTarget(targets[0]);
      }
    } catch (error) {
      logger.error('Error inicializando targets:', error);
    }
  };

  // Función para verificar respuestas de colaboración pendientes
  const checkForCollaborationResponses = async () => {
    if (!userMindOpId || pendingCollaborationTasks.size === 0) return;

    try {
      logger.collaboration('Verificando respuestas de colaboración...', Array.from(pendingCollaborationTasks));
      
      // Consultar tareas completadas
      const { data: completedTasks, error } = await supabase
        .from('mindop_collaboration_tasks')
        .select(`
          id,
          requester_mindop_id,
          target_mindop_id,
          query,
          status,
          response,
          created_at,
          updated_at,
          target_mindop:target_mindop_id (
            id,
            mindop_name,
            mindop_description
          )
        `)
        .eq('requester_mindop_id', userMindOpId)
        .eq('status', 'target_processing_complete')
        .in('id', Array.from(pendingCollaborationTasks));

      if (error) {
        logger.error('Error verificando respuestas de colaboración:', error);
        return;
      }

      if (!completedTasks || completedTasks.length === 0) {
        logger.debug('ChatPage', 'No hay respuestas nuevas');
        return;
      }

      logger.collaboration(`Encontradas ${completedTasks.length} respuestas nuevas`);
      
      // Procesar cada respuesta
      for (const task of completedTasks) {
        await processCollaborationResponse(task as unknown as CollaborationTask);
      }

    } catch (error) {
      logger.error('❌ Error en checkForCollaborationResponses:', error);
    }
  };

  // Función para procesar una respuesta de colaboración individual
  const processCollaborationResponse = async (task: CollaborationTask) => {
    if (!task.response || !task.target_mindop) {
      logger.warn('⚠️ Tarea sin respuesta o target_mindop:', task.id);
      return;
    }

    logger.log(`📨 Procesando respuesta de ${task.target_mindop.mindop_name}:`, task.response.substring(0, 100) + '...');

    // Crear mensaje de respuesta de colaboración
    const collaborationMessage: ConversationMessage = {
      id: Date.now() + Math.random(),
      type: 'collaboration_response',
      content: task.response,
      timestamp: new Date(task.updated_at),
      collaboration_task_id: task.id,
      collaboration_response_from: {
        mindop_id: task.target_mindop.id,
        mindop_name: task.target_mindop.mindop_name
      }
    };

    // Agregar mensaje a la conversación
    setConversation(prev => [...prev, collaborationMessage]);

    // Remover de tareas pendientes
    setPendingCollaborationTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(task.id);
      return newSet;
    });

    // Actualizar estado de la tarea a 'completed'
    try {
      const { error: updateError } = await supabase
        .from('mindop_collaboration_tasks')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (updateError) {
        logger.error('❌ Error actualizando estado de tarea a completed:', updateError);
      } else {
        logger.log('✅ Tarea marcada como completada:', task.id);
      }
    } catch (error) {
      logger.error('❌ Error inesperado actualizando estado de tarea:', error);
    }
  };  const callMindOpService = async (query: string, requestId?: string): Promise<any> => {
    const reqId = requestId || `call_${Date.now()}`;
    logger.request(reqId, 'Getting session...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    logger.request(reqId, 'Sesión activa:', !!session);
    logger.request(reqId, 'Token disponible:', !!session?.access_token);
    
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }    // Preparar el payload con conversation_id, target_mindop_id, mindop_id y mode
    const payload: { 
      query: string; 
      mindop_id?: string;
      target_mindop_id?: string; 
      conversation_id?: string;
      mode: 'local' | 'sync_collaboration' | 'async_task';
    } = { 
      query,
      mode: activeMode
    };
    
    // Agregar conversation_id si existe una conversación activa
    if (currentConversationId) {
      payload.conversation_id = currentConversationId;
      logger.request(reqId, 'Conversación activa:', currentConversationId);
    } else {
      logger.request(reqId, 'Nueva conversación');
    }
      // Para modo local, agregar mindop_id del usuario
    if (activeMode === 'local') {
      if (!userMindOpId) {
        throw new Error('No se encontró el MindOp del usuario para modo local');
      }
      payload.mindop_id = userMindOpId;
      logger.log(`🏠 [${reqId}] Modo local activado, mindop_id:`, userMindOpId);
    }
      // Para modo sync_collaboration, agregar tanto mindop_id como target_mindop_id
    if (activeMode === 'sync_collaboration') {
      if (!userMindOpId) {
        throw new Error('No se encontró el MindOp del usuario para modo sync_collaboration');
      }
      payload.mindop_id = userMindOpId;
      
      if (selectedTarget && selectedTarget.type === 'connected') {
        payload.target_mindop_id = selectedTarget.id;
        logger.log(`🤝 [${reqId}] Modo sync_collaboration activado, mindop_id:`, userMindOpId, 'target:', selectedTarget.name, selectedTarget.id);
      } else {
        throw new Error('Se requiere seleccionar un MindOp conectado para colaboración síncrona');
      }
    }

    logger.log(`📞 [${reqId}] Llamando a mindop-service con payload:`, payload);
    
    // Configurar timeout de 60 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.error(`⏰ [${reqId}] Request timeout después de 60 segundos`);
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
      logger.log(`📊 [${reqId}] Response status:`, response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        logger.error(`❌ [${reqId}] Error response:`, errorData);
        const message = errorData.error || `Error ${response.status}`;
        const stack = errorData.stack ? `\nStack trace: ${errorData.stack}` : '';
        throw new Error(message + stack);
      }

      const result = await response.json();
      logger.log(`✅ [${reqId}] Success response:`, result);
      
      return result;    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(`⏰ [${reqId}] Request fue abortado por timeout`);
        throw new Error('La consulta tardó demasiado tiempo. Por favor, intenta nuevamente.');
      }
      
      logger.error(`💥 [${reqId}] Error en fetch:`, error);
      throw error;
    }
  };  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    // Generar Request ID único para tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.log(`🚀 [${requestId}] Iniciando request: "${inputText.substring(0, 50)}..."`);
    logger.log(`📊 [${requestId}] Estado actual - currentConversationId:`, currentConversationId);
    
    // Protección contra múltiples requests simultáneos
    if (requestInProgress) {
      logger.warn(`⚠️ [${requestId}] Request ya en progreso: ${requestInProgress}. Ignorando nueva request.`);
      return;
    }

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
    setRequestInProgress(requestId);

    try {
      logger.log(`⏳ [${requestId}] Calling MindOp service...`);
      const startTime = Date.now();
      
      const response = await callMindOpService(originalQuery, requestId);
      
      const duration = Date.now() - startTime;
      logger.log(`✅ [${requestId}] Response received in ${duration}ms`);      if (response.success && response.response) {        // ✅ CRÍTICO: Determinar el ID de conversación final
        let finalConversationId: string;
        
        // ✅ NUEVO: Verificar si se debe forzar una nueva conversación
        const forceNewConversation = sessionStorage.getItem('forceNewConversation') === 'true';
          if (!currentConversationId || forceNewConversation) {
          logger.log(`🆕 [${requestId}] Nueva conversación requerida (currentId: ${currentConversationId}, force: ${forceNewConversation})`);
          finalConversationId = await ensureConversationExists(undefined, true); // Forzar nueva conversación
          
          // Limpiar el flag después de usar
          if (forceNewConversation) {
            sessionStorage.removeItem('forceNewConversation');
            logger.log(`🧹 [${requestId}] Flag forceNewConversation limpiado`);
          }
        } else if (response.conversation_id && response.conversation_id === currentConversationId) {
          // El backend devolvió el mismo conversation_id que tenemos activo
          finalConversationId = response.conversation_id;
          logger.log(`🔄 [${requestId}] Backend confirmó conversation_id actual:`, finalConversationId);
        } else if (currentConversationId) {
          // Tenemos una conversación activa, usarla
          finalConversationId = currentConversationId;
          logger.log(`📋 [${requestId}] Usando conversación activa:`, finalConversationId);        } else {
          // Fallback: crear nueva conversación
          logger.log(`🆕 [${requestId}] Fallback - creando nueva conversación...`);
          finalConversationId = await ensureConversationExists(undefined, false);
        }

        logger.log(`💾 [${requestId}] Guardando mensajes en conversación:`, finalConversationId);

        // Guardar mensaje del usuario en la BD
        try {
          await saveMessageToDatabase(
            finalConversationId, 
            originalQuery, 
            'user',
            userMindOpId! // Usuario siempre usa su propio MindOp ID
          );
          logger.log(`💾 [${requestId}] Mensaje de usuario guardado en BD`);
        } catch (error) {
          logger.error(`❌ [${requestId}] Error guardando mensaje de usuario:`, error);
        }

        // Guardar mensaje del sistema en la BD
        try {
          // Determinar el MindOp ID del agente según el modo
          let agentMindOpId: string;
          
          if (activeMode === 'local') {
            // En modo local, el agente es el propio MindOp del usuario
            agentMindOpId = userMindOpId!;
          } else if (activeMode === 'sync_collaboration' && selectedTarget?.type === 'connected') {
            // En modo colaboración con MindOp conectado, el agente es el target
            agentMindOpId = selectedTarget.id;
          } else {
            // En otros casos (colaboración con propio MindOp), usar el propio ID
            agentMindOpId = userMindOpId!;
          }
          
          await saveMessageToDatabase(
            finalConversationId, 
            response.response, 
            'agent',
            agentMindOpId
          );
          logger.log(`💾 [${requestId}] Mensaje de sistema guardado en BD con agentMindOpId: ${agentMindOpId}`);
        } catch (error) {
          logger.error(`❌ [${requestId}] Error guardando mensaje de sistema:`, error);
        }

        const systemMessage: ConversationMessage = {
          id: Date.now() + 1,
          type: 'system',
          content: response.response,
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, systemMessage]);
        
        // ✅ CRÍTICO: Actualizar el currentConversationId si es diferente
        if (finalConversationId !== currentConversationId) {
          logger.log(`🔄 [${requestId}] Actualizando currentConversationId de ${currentConversationId} a ${finalConversationId}`);
          setCurrentConversationId(finalConversationId);
          // Refresh conversation list to show the new conversation
          loadConversationList();
        }

        // Log conversation history usage
        if (response.history_messages_used > 0) {
          logger.log(`💬 [${requestId}] Se utilizaron ${response.history_messages_used} mensajes del historial`);
        }

        // Si es una respuesta de colaboración y contiene collaboration_task_id, agregarlo a tareas pendientes
        if (response.collaboration_task_id) {
          logger.log(`📝 [${requestId}] Nueva tarea de colaboración: ${response.collaboration_task_id}`);
          setPendingCollaborationTasks(prev => new Set([...prev, response.collaboration_task_id]));
          
          // Mostrar mensaje informativo sobre el estado de la colaboración
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
        logger.error(`❌ [${requestId}] Response error:`, response.error);
        const errorMessage: ConversationMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: response.error || 'No se pudieron obtener datos',
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      logger.error(`💥 [${requestId}] Caught error:`, error);
      const errorMessage: ConversationMessage = {
        id: Date.now() + 1,
        type: 'error',
        // Mostrar mensaje completo (incluye stack)
        content: error instanceof Error ? error.message : 'Error al consultar tu MindOp',
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      logger.log(`🏁 [${requestId}] Request completed, clearing states`);
      setIsLoading(false);
      setRequestInProgress(null);
    }
  };

  const renderMessage = (msg: ConversationMessage) => {
    const getMessageStyles = () => {
      switch (msg.type) {
        case 'user':
          return 'bg-gray-900 text-white ml-auto max-w-xs lg:max-w-md rounded-2xl shadow-sm';
        case 'system':
          return 'bg-white text-gray-900 border border-gray-200 max-w-xs lg:max-w-lg rounded-2xl shadow-sm';
        case 'collaboration_response':
          return 'bg-blue-50 text-blue-900 border border-blue-200 max-w-xs lg:max-w-lg rounded-2xl shadow-sm';
        case 'data':
          return 'bg-white text-gray-900 border border-gray-200 max-w-full rounded-2xl shadow-sm';
        case 'error':
          return 'bg-red-50 text-red-900 border border-red-200 max-w-xs lg:max-w-md rounded-2xl shadow-sm';
        default:
          return 'bg-white text-gray-900 border border-gray-200 max-w-xs lg:max-w-md rounded-2xl shadow-sm';
      }
    };

    return (
      <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`px-5 py-3 ${getMessageStyles()}`}>
          {/* Header especial para respuestas de colaboración */}
          {msg.type === 'collaboration_response' && msg.collaboration_response_from && (
            <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-blue-200">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-800">
                Respuesta de {msg.collaboration_response_from.mindop_name}
              </span>
            </div>
          )}
          
          <p className="text-sm leading-relaxed mb-1 whitespace-pre-wrap">{msg.content}</p>
          
          {/* Render data table if present */}
          {msg.data && msg.data.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-200 rounded">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(msg.data[0]).map((key) => (
                      <th key={key} className="px-2 py-1 text-left border border-gray-200 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {msg.data.slice(0, 10).map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="px-2 py-1 border border-gray-200 text-xs">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {msg.data.length > 10 && (
                <p className="text-xs text-gray-500 mt-2">
                  Mostrando 10 de {msg.data.length} registros
                </p>
              )}
            </div>
          )}
          
          <p className="text-xs mt-3 opacity-60 text-right">
            {msg.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };
  // === CONVERSATION MANAGEMENT FUNCTIONS ===
  // Función para guardar un mensaje en la base de datos
  const saveMessageToDatabase = async (
    conversationId: string, 
    content: string, 
    senderRole: 'user' | 'agent',
    senderMindopId: string // Ahora es requerido, no opcional
  ) => {
    try {
      if (!senderMindopId) {
        throw new Error(`sender_mindop_id es requerido para sender_role: ${senderRole}`);
      }

      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_role: senderRole,
          sender_mindop_id: senderMindopId,
          content: content
        });

      if (error) {
        logger.error('❌ Error guardando mensaje:', error);
        throw error;
      }

      logger.log('✅ Mensaje guardado en BD:', { 
        conversationId, 
        senderRole, 
        senderMindopId, 
        content: content.substring(0, 50) + '...' 
      });
    } catch (error) {
      logger.error('❌ Error inesperado guardando mensaje:', error);
      throw error;
    }
  };  // Función para crear o actualizar una conversación
  const ensureConversationExists = async (conversationId?: string, forceNew: boolean = false): Promise<string> => {
    if (!user || !userMindOpId) {
      throw new Error('Usuario o MindOp no disponible');
    }

    // ✅ CRÍTICO: Si conversationId es null/undefined O se fuerza nueva conversación, SIEMPRE crear nueva
    if (!conversationId || forceNew) {
      logger.log('🆕 Creando nueva conversación (conversationId:', conversationId, ', forceNew:', forceNew, ')');
      
      // Crear nueva conversación
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          mindop_id: userMindOpId,
          title: null, // Se generará automáticamente basado en el primer mensaje
        })
        .select('id')
        .single();

      if (createError || !newConv) {
        logger.error('❌ Error creando conversación:', createError);
        throw createError || new Error('No se pudo crear la conversación');
      }

      logger.log('✅ Nueva conversación creada:', newConv.id);
      return newConv.id;
    }

    // Si tenemos un ID de conversación, verificar que existe
    const { data: existingConv, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (!error && existingConv) {
      logger.log('✅ Conversación existente encontrada:', conversationId);
      // Actualizar timestamp de la conversación
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      return conversationId;
    }

    // Si llegamos aquí, el conversationId no existe, crear nueva
    logger.log('🆕 Conversación no encontrada, creando nueva...');
    
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        mindop_id: userMindOpId,
        title: null,
      })
      .select('id')
      .single();

    if (createError || !newConv) {
      logger.error('❌ Error creando conversación:', createError);
      throw createError || new Error('No se pudo crear la conversación');
    }

    logger.log('✅ Nueva conversación creada (fallback):', newConv.id);
    return newConv.id;
  };

  // Función para cargar la lista de conversaciones
  const loadConversationList = async () => {
    if (!user || !userMindOpId) return;

    setLoadingConversations(true);
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          mindop_id
        `)
        .eq('user_id', user.id)
        .eq('mindop_id', userMindOpId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('❌ Error cargando conversaciones:', error);
        return;
      }

      // Obtener preview de mensajes para cada conversación
      const conversationsWithPreview = await Promise.all(
        conversations.map(async (conv) => {
          const { data: messages } = await supabase
            .from('conversation_messages')
            .select('content, sender_role')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true })
            .limit(2);

          let preview = '';
          let title = conv.title;
          
          if (messages && messages.length > 0) {
            const firstUserMessage = messages.find(m => m.sender_role === 'user');
            if (firstUserMessage) {
              preview = firstUserMessage.content.substring(0, 50) + 
                       (firstUserMessage.content.length > 50 ? '...' : '');
              
              // Si no hay título, usar el primer mensaje como título
              if (!title) {
                title = firstUserMessage.content.substring(0, 30) + 
                       (firstUserMessage.content.length > 30 ? '...' : '');
              }
            }
          }

          return {
            ...conv,
            title: title || 'Nueva conversación',
            preview,
            message_count: messages?.length || 0
          };
        })
      );

      setConversationList(conversationsWithPreview);
    } catch (error) {
      logger.error('❌ Error cargando conversaciones:', error);
    } finally {
      setLoadingConversations(false);
    }
  };
  // Función para cargar una conversación específica
  const loadConversation = async (conversationId: string) => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      const { data: messages, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }) as { data: StoredMessage[] | null, error: any };

      if (error) {
        logger.error('❌ Error cargando mensajes:', error);
        return;
      }

      if (!messages) {
        logger.warn('⚠️ No se encontraron mensajes para la conversación');
        setConversation([]);
        setCurrentConversationId(conversationId);
        return;
      }

      // Convertir mensajes de BD a formato de la UI
      const conversationMessages: ConversationMessage[] = messages.map((msg, index) => ({
        id: index + 1,
        type: msg.sender_role === 'user' ? 'user' : 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));

      setConversation(conversationMessages);
      setCurrentConversationId(conversationId);
      
      logger.log('✅ Conversación cargada desde BD:', conversationId, 'Mensajes:', conversationMessages.length);
    } catch (error) {
      logger.error('❌ Error cargando conversación:', error);
    } finally {
      setIsLoading(false);
    }
  };
  // Función para eliminar una conversación
  const deleteConversation = async (conversationId: string) => {
    try {
      // Primero eliminar todos los mensajes de la conversación
      const { error: messagesError } = await supabase
        .from('conversation_messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        logger.error('❌ Error eliminando mensajes:', messagesError);
        return;
      }

      // Luego eliminar la conversación
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user?.id);

      if (conversationError) {
        logger.error('❌ Error eliminando conversación:', conversationError);
        return;
      }

      // Actualizar lista local
      setConversationList(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Si era la conversación activa, iniciar nueva
      if (currentConversationId === conversationId) {
        startNewConversation();
      }

      logger.log('✅ Conversación y mensajes eliminados de BD');
    } catch (error) {
      logger.error('❌ Error eliminando conversación:', error);
    }
  };
  
  // Función para iniciar una nueva conversación
  const startNewConversation = () => {
    logger.log('🆕 Iniciando nueva conversación...');
    
    // ✅ CRÍTICO: Limpiar completamente el estado de conversación
    setCurrentConversationId(null);
    setConversation([]);
    
    // ✅ NUEVO: Agregar un flag para forzar nueva conversación
    // Esto asegura que el próximo mensaje SIEMPRE cree una nueva conversación
    sessionStorage.setItem('forceNewConversation', 'true');
    
    // Regenerar mensaje de bienvenida (solo para UI, no se guarda en BD)
    const firstName = user?.user_metadata?.first_name || 'Usuario';
    const getWelcomeMessage = () => {
      if (activeMode === 'sync_collaboration' && selectedTarget) {
        if (selectedTarget.type === 'connected') {
          return `¡Hola ${firstName}! 👋 

Estás en modo colaboración síncrona con **${selectedTarget.name}**. 

Puedes hacer preguntas sobre los datos de este MindOp conectado. Por ejemplo:
• "¿Qué tendencias muestran tus datos?"
• "Comparte un resumen de tu información"
• "¿Qué patrones interesantes has encontrado?"

El MindOp target procesará tu consulta de forma síncrona y compartirá insights de sus datos contigo.

¿Qué te gustaría saber?`;
        } else {
          return `¡Hola ${firstName}! 👋 

Estás consultando tu propio MindOp en modo colaboración síncrona.

Puedes preguntarme sobre:
• Análisis de tendencias en tus datos
• Búsqueda de información específica
• Resúmenes y estadísticas
• Patrones o insights interesantes

¿En qué puedo ayudarte hoy?`;
        }
      } else {
        return `¡Hola ${firstName}! 👋 

Soy tu asistente inteligente de MindOp. Estoy aquí para ayudarte a explorar y analizar tus datos de manera conversacional.

En modo **local**, trabajarás directamente con tus datos almacenados.

Puedes preguntarme sobre:
• Análisis de tendencias en tus datos
• Búsqueda de información específica
• Resúmenes y estadísticas
• Patrones o insights interesantes

¿En qué puedo ayudarte hoy?`;
      }
    };

    const welcomeMessage: ConversationMessage = {
      id: Date.now(),
      type: 'system',
      content: getWelcomeMessage(),
      timestamp: new Date(),
    };

    // Nota: El mensaje de bienvenida es solo para la UI, no se guarda en BD
    setConversation([welcomeMessage]);
    
    logger.log('✅ Nueva conversación iniciada, currentConversationId:', null);
    logger.log('🚩 Flag forceNewConversation establecido en sessionStorage');
  };
  // === END CONVERSATION MANAGEMENT FUNCTIONS ===
  
  // Verificar si MindOp está inicializado antes de renderizar
  if (!mindOpInitialized) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          <p className="text-gray-600">Inicializando chat...</p>
        </div>
      </div>
    );
  }

  return (<div className="h-full flex bg-gray-50 overflow-hidden relative">
      {/* Sidebar de Conversaciones */}
      <div className={`${
        sidebarOpen ? 'w-80' : 'w-0'
      } md:relative absolute top-0 left-0 h-full z-50 transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden md:shadow-none shadow-xl`}>
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Conversaciones
            </h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : 'rotate-90'}`} />
            </button>
          </div>
          
          {/* Botón Nueva Conversación */}
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Conversación
          </button>
        </div>

        {/* Lista de Conversaciones */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loadingConversations ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Cargando...</span>
            </div>
          ) : conversationList.length > 0 ? (
            <div className="space-y-1 p-2">
              {conversationList.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conv.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {conv.title}
                      </h3>
                      {conv.preview && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {conv.preview}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {conv.message_count} msgs
                        </span>
                      </div>
                    </div>
                    
                    {/* Botón eliminar (visible en hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Eliminar esta conversación?')) {
                          deleteConversation(conv.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-100 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay conversaciones</p>
              <p className="text-xs mt-1">Inicia una nueva conversación</p>
            </div>
          )}        </div>
      </div>

      {/* Overlay para móvil cuando sidebar está abierto */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Área Principal de Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header con toggle de sidebar e indicador de colaboración */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="flex items-center space-x-2">
                {currentConversationId ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Conversación activa</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700">Nueva conversación</span>
                  </>
                )}
              </div>
            </div>

            {/* Indicador de Tareas de Colaboración Pendientes en header */}
            {pendingCollaborationTasks.size > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">
                  {pendingCollaborationTasks.size} colaboración{pendingCollaborationTasks.size !== 1 ? 'es' : ''} pendiente{pendingCollaborationTasks.size !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <button
              onClick={startNewConversation}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Conversación</span>
            </button>
          </div>
        </div>

        {/* Área de Visualización de Conversación */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              {conversation.map((msg) => renderMessage(msg))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 text-gray-600 px-4 py-3 rounded-2xl shadow-sm max-w-xs flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analizando tus datos...</span>
                  </div>
                </div>
              )}
              
              {/* Elemento para auto-scroll */}
              <div ref={conversationEndRef} />
            </div>
          </div>
        </div>

        {/* Barra de Entrada Fija */}
        <div className="border-t border-gray-200 bg-white px-4 py-4 flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSendMessage} className="space-y-3">
              {/* Selector de Colaboración Integrado */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">                  {/* Botón Mi MindOp */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('local');
                      setShowTargetSelector(false);
                      const ownTarget = availableTargets.find(t => t.type === 'own');
                      if (ownTarget) {
                        setSelectedTarget(ownTarget);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                      activeMode === 'local'
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Mi MindOp</span>
                  </button>

                  {/* Botón Colaborar con Selector Integrado */}
                  <div className="relative" data-target-selector>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMode('sync_collaboration');
                        if (availableTargets.length > 1) {
                          setShowTargetSelector(!showTargetSelector);
                        } else {
                          setShowTargetSelector(false);
                          if (!selectedTarget && availableTargets.length > 0) {
                            setSelectedTarget(availableTargets[0]);
                          }
                        }
                      }}
                      disabled={loadingConnections}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                        activeMode === 'sync_collaboration'
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                      }`}
                    >
                      {loadingConnections ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Users className="w-3.5 h-3.5" />
                      )}
                      <span>Colaborar</span>
                      {activeMode === 'sync_collaboration' && availableTargets.length > 1 && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {/* Dropdown para selección de target */}
                    {showTargetSelector && activeMode === 'sync_collaboration' && availableTargets.length > 1 && (
                      <div className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {availableTargets.map((target) => (
                          <button
                            key={target.id}
                            type="button"
                            onClick={() => {
                              setSelectedTarget(target);
                              setShowTargetSelector(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                              selectedTarget?.id === target.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {target.type === 'connected' ? (
                                <Users className="w-4 h-4 text-blue-600" />
                              ) : (
                                <User className="w-4 h-4 text-gray-600" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {target.name}
                                </div>
                                {target.description && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {target.description}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">
                                  {target.type === 'own' ? 'Tu MindOp' : 'Conectado'}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Indicador de Target Actual */}
                {activeMode === 'sync_collaboration' && selectedTarget && (
                  <div className="flex items-center space-x-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full">
                    {selectedTarget.type === 'connected' ? (
                      <Users className="w-3 h-3 text-blue-600" />
                    ) : (
                      <User className="w-3 h-3 text-blue-600" />
                    )}
                    <span className="text-xs text-blue-900 font-medium max-w-24 truncate">
                      {selectedTarget.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Campo de Texto y Botón de Envío */}
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}                    placeholder={
                      activeMode === 'sync_collaboration' && selectedTarget?.type === 'connected'
                        ? `Colaborar con ${selectedTarget.name}...`
                        : "Escribe tu consulta aquí..."
                    }
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none text-sm placeholder-gray-500"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="flex items-center justify-center w-14 h-14 bg-white text-black border-2 border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-black" />
                  ) : (
                    <Send className="w-6 h-6 text-black" />
                  )}
                </button>
              </div>

              {/* Indicador de Conexiones Disponibles */}
              {!loadingConnections && connectedMindOps.length > 0 && activeMode === 'sync_collaboration' && (
                <div className="flex items-center justify-center pt-1">
                  <div className="flex items-center px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
                    <span className="text-xs text-emerald-700 font-medium">
                      {connectedMindOps.length} MindOp{connectedMindOps.length !== 1 ? 's' : ''} conectado{connectedMindOps.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Debug: Indicador de Polling (solo en desarrollo) */}
              {import.meta.env.DEV && pendingCollaborationTasks.size > 0 && (
                <div className="flex items-center justify-center pt-1">
                  <div className="flex items-center px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></div>
                    <span className="text-xs text-yellow-700 font-medium">
                      Polling activo: {Array.from(pendingCollaborationTasks).length} tarea{pendingCollaborationTasks.size !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </form>
          </div>        </div>
      </div>
    </div>
  );
};

export default ChatPage;
