import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabaseClient';

interface ConversationMessage {
  id: number;
  type: 'user' | 'system' | 'data' | 'error';
  content: string;
  data?: any[];
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'mindop' | 'collaborate'>('mindop');  const [conversation, setConversation] = useState<ConversationMessage[]>([
    {
      id: 1,
      type: 'system',
      content: `¡Hola ${user?.user_metadata?.first_name || 'Usuario'}! 👋 

Soy tu asistente inteligente de MindOp. Estoy aquí para ayudarte a explorar y analizar tus datos de manera conversacional.

Puedes preguntarme sobre:
• Análisis de tendencias en tus datos
• Búsqueda de información específica
• Resúmenes y estadísticas
• Patrones o insights interesantes

¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
    },
  ]);
  const callMindOpService = async (query: string): Promise<any> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('🔐 Sesión activa:', !!session);
    console.log('🔑 Token disponible:', !!session?.access_token);
    
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }

    console.log('📞 Llamando a mindop-service con query:', query);
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mindop-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ query }),
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
  };
  const renderMessage = (msg: ConversationMessage) => {
    const getMessageStyles = () => {
      switch (msg.type) {
        case 'user':
          return 'bg-black text-white ml-auto max-w-xs lg:max-w-md';
        case 'system':
          return 'bg-blue-50 text-blue-900 border border-blue-200 max-w-xs lg:max-w-md';
        case 'data':
          return 'bg-green-50 text-green-900 border border-green-200 max-w-full';
        case 'error':
          return 'bg-red-50 text-red-900 border border-red-200 max-w-xs lg:max-w-md';
        default:
          return 'bg-white text-gray-900 border border-gray-200 max-w-xs lg:max-w-md';
      }
    };

    return (
      <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`px-4 py-3 rounded-lg ${getMessageStyles()}`}>
          <p className="text-sm mb-1">{msg.content}</p>
          
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
          
          <p className="text-xs mt-2 opacity-70">
            {msg.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">MindOp Chat</h1>
        <p className="text-gray-600">Consulta tus datos con inteligencia artificial</p>
      </div>

      {/* Main Conversation Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 min-h-[400px] p-6">
            <div className="text-center text-gray-500 text-sm mb-6 pb-4 border-b border-gray-100">
              Conversation Here
            </div>
            
            <div className="space-y-4">
              {conversation.map((msg) => renderMessage(msg))}
                {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg max-w-xs flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analizando tus datos...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Text Input Bar */}
          <form onSubmit={handleSendMessage} className="mb-4">
            <div className="flex items-center space-x-3">              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu pregunta aquí... ej: '¿Cuáles son las principales tendencias?' o 'Muéstrame un resumen de los datos'"
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>

          {/* Mode Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveMode('mindop')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeMode === 'mindop'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My MindOP
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              Collaborate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
