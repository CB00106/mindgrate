import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, Users, User, PlaneTakeoff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';
import { supabase } from '@/services/supabaseClient';

interface ConversationMessage {
  id: number;
  type: 'user' | 'system' | 'data' | 'error';
  content: string;
  data?: any[];
  timestamp: Date;
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

const ChatPage: React.FC = () => {
  const { user, userMindOpId } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'mindop' | 'collaborate'>('mindop');
  
  // Estados para colaboración dirigida
  const [connectedMindOps, setConnectedMindOps] = useState<ConnectedMindOp[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<CollaborationTarget | null>(null);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [availableTargets, setAvailableTargets] = useState<CollaborationTarget[]>([]);
  
  // Estado para conversación (se actualiza dinámicamente)
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  
  // Ref para auto-scroll
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Inicializar mensaje de bienvenida
  useEffect(() => {
    const getWelcomeMessage = () => {
      const firstName = user?.user_metadata?.first_name || 'Usuario';
      
      if (activeMode === 'collaborate' && selectedTarget) {
        if (selectedTarget.type === 'connected') {
          return `¡Hola ${firstName}! 👋 

Estás en modo colaboración con **${selectedTarget.name}**. 

Puedes hacer preguntas sobre los datos de este MindOp conectado. Por ejemplo:
• "¿Qué tendencias muestran tus datos?"
• "Comparte un resumen de tu información"
• "¿Qué patrones interesantes has encontrado?"

El MindOp target procesará tu consulta y compartirá insights de sus datos contigo.

¿Qué te gustaría saber?`;
        } else {
          return `¡Hola ${firstName}! 👋 

Estás consultando tu propio MindOp en modo colaboración.

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
  }, [user, activeMode, selectedTarget]);

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
  }, [showTargetSelector]);

  // Cargar conexiones del usuario al montar el componente
  useEffect(() => {
    if (userMindOpId) {
      loadUserConnections();
      initializeCollaborationTargets();
    }
  }, [userMindOpId]);
  // Inicializar targets disponibles cuando cambian las conexiones
  useEffect(() => {
    initializeCollaborationTargets();
  }, [connectedMindOps, userMindOpId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  const loadUserConnections = async () => {
    if (!userMindOpId) return;

    setLoadingConnections(true);
    try {
      console.log('🔄 Cargando conexiones para MindOp:', userMindOpId);
      
      // Obtener MindOps que el usuario sigue (conexiones aprobadas)
      const followingData = await notificationService.getFollowingMindOps(userMindOpId);
      
      console.log('📋 Conexiones obtenidas:', followingData);
      
      // Mapear a la estructura que necesitamos
      const connectedMindOps: ConnectedMindOp[] = followingData.map(connection => ({
        id: connection.target_mindop.id,
        mindop_name: connection.target_mindop.mindop_name,
        mindop_description: connection.target_mindop.mindop_description,
        user_id: connection.target_mindop.user_id
      }));

      setConnectedMindOps(connectedMindOps);
      console.log('✅ Conexiones cargadas:', connectedMindOps.length);
      
    } catch (error) {
      console.error('❌ Error cargando conexiones:', error);
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
        console.error('Error obteniendo propio MindOp:', error);
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
      console.error('Error inicializando targets:', error);
    }
  };  const callMindOpService = async (query: string): Promise<any> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('🔐 Sesión activa:', !!session);
    console.log('🔑 Token disponible:', !!session?.access_token);
    
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    // Preparar el payload con target_mindop_id para colaboración
    const payload: { query: string; target_mindop_id?: string } = { query };
    
    if (activeMode === 'collaborate' && selectedTarget && selectedTarget.type === 'connected') {
      payload.target_mindop_id = selectedTarget.id;
      console.log('🤝 Modo colaboración activado, target:', selectedTarget.name, selectedTarget.id);
    }

    console.log('📞 Llamando a mindop-service con payload:', payload);
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mindop-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📊 Response status:', response.status)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('❌ Error response:', errorData);
      // Arrojar error con detalle de stack si existe
      const message = errorData.error || `Error ${response.status}`;
      const stack = errorData.stack ? `\nStack trace: ${errorData.stack}` : '';
      throw new Error(message + stack);
    }

    const result = await response.json();
    console.log('✅ Success response:', result);
    
    return result;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: ConversationMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);    try {
      const response = await callMindOpService(inputText);
      
      if (response.success && response.response) {
        const systemMessage: ConversationMessage = {
          id: Date.now() + 1,
          type: 'system',
          content: response.response,
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, systemMessage]);
      } else {
        const errorMessage: ConversationMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: response.error || 'No se pudieron obtener datos',
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('🔴 Caught error in handleSendMessage:', error);
      const errorMessage: ConversationMessage = {
        id: Date.now() + 1,
        type: 'error',
        // Mostrar mensaje completo (incluye stack)
        content: error instanceof Error ? error.message : 'Error al consultar tu MindOp',
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };  const renderMessage = (msg: ConversationMessage) => {
    const getMessageStyles = () => {
      switch (msg.type) {
        case 'user':
          return 'bg-gray-900 text-white ml-auto max-w-xs lg:max-w-md rounded-2xl shadow-sm';
        case 'system':
          return 'bg-white text-gray-900 border border-gray-200 max-w-xs lg:max-w-lg rounded-2xl shadow-sm';
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
  };  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Área de Visualización de Conversación */}
      <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">            {conversation.map((msg) => renderMessage(msg))}
            
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
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSendMessage} className="space-y-3">
            {/* Selector de Colaboración Integrado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Botón Mi MindOp */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('mindop');
                    setShowTargetSelector(false);
                    const ownTarget = availableTargets.find(t => t.type === 'own');
                    if (ownTarget) {
                      setSelectedTarget(ownTarget);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                    activeMode === 'mindop'
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
                      setActiveMode('collaborate');
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
                      activeMode === 'collaborate'
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
                    {activeMode === 'collaborate' && availableTargets.length > 1 && (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {/* Dropdown para selección de target */}
                  {showTargetSelector && activeMode === 'collaborate' && availableTargets.length > 1 && (
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
              {activeMode === 'collaborate' && selectedTarget && (
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
                  }}
                  placeholder={
                    activeMode === 'collaborate' && selectedTarget?.type === 'connected'
                      ? `Colaborar con ${selectedTarget.name}...`
                      : "Escribe tu consulta aquí..."
                  }
                  rows={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none text-sm placeholder-gray-500"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="flex items-center justify-center w-10 h-10 bg-gray-900 text-white rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlaneTakeoff className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Indicador de Conexiones Disponibles */}
            {!loadingConnections && connectedMindOps.length > 0 && activeMode === 'collaborate' && (
              <div className="flex items-center justify-center pt-1">
                <div className="flex items-center px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
                  <span className="text-xs text-emerald-700 font-medium">
                    {connectedMindOps.length} MindOp{connectedMindOps.length !== 1 ? 's' : ''} conectado{connectedMindOps.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </form>        </div>
      </div>
    </div>
  );
};

export default ChatPage;
