import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle, Bell, UserPlus, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService, ProcessedNotification } from '@/services/notificationService';

interface ActionState {
  [notificationId: string]: 'idle' | 'loading' | 'success' | 'error';
}

interface ActionError {
  [notificationId: string]: string;
}

const NotificationsPage: React.FC = () => {
  const { userMindOpId } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'follow_requests'>('all');
  const [notifications, setNotifications] = useState<ProcessedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<ActionState>({});
  const [actionErrors, setActionErrors] = useState<ActionError>({});

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (userMindOpId) {
      loadNotifications();
    }
  }, [userMindOpId]);

  const loadNotifications = async () => {
    if (!userMindOpId) {
      setError('No se encontró tu MindOp. Asegúrate de tener un MindOp configurado.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const allNotifications = await notificationService.getAllNotifications(userMindOpId);
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Error al cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.isRead;
      case 'follow_requests':
        return notification.type === 'follow_request';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const followRequestsCount = notifications.filter(n => n.type === 'follow_request' && !n.isRead).length;
  
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleAcceptRequest = async (notificationId: string, followRequestId: string) => {
    setActionStates(prev => ({ ...prev, [notificationId]: 'loading' }));
    setActionErrors(prev => ({ ...prev, [notificationId]: '' }));

    try {
      const result = await notificationService.acceptFollowRequest(followRequestId);
      
      if (result.success) {
        setActionStates(prev => ({ ...prev, [notificationId]: 'success' }));
        
        // Remover la notificación de la lista después de un breve delay
        setTimeout(() => {
          setNotifications(prev =>
            prev.filter(notification => notification.id !== notificationId)
          );
          setActionStates(prev => ({ ...prev, [notificationId]: 'idle' }));
        }, 2000);
      } else {
        setActionStates(prev => ({ ...prev, [notificationId]: 'error' }));
        setActionErrors(prev => ({ 
          ...prev, 
          [notificationId]: result.error || 'Error al aceptar la solicitud' 
        }));
      }
    } catch (error) {
      setActionStates(prev => ({ ...prev, [notificationId]: 'error' }));
      setActionErrors(prev => ({ 
        ...prev, 
        [notificationId]: 'Error interno al procesar la solicitud' 
      }));
    }
  };

  const handleRejectRequest = async (notificationId: string, followRequestId: string) => {
    setActionStates(prev => ({ ...prev, [notificationId]: 'loading' }));
    setActionErrors(prev => ({ ...prev, [notificationId]: '' }));

    try {
      const result = await notificationService.rejectFollowRequest(followRequestId);
      
      if (result.success) {
        setActionStates(prev => ({ ...prev, [notificationId]: 'success' }));
        
        // Remover la notificación de la lista después de un breve delay
        setTimeout(() => {
          setNotifications(prev =>
            prev.filter(notification => notification.id !== notificationId)
          );
          setActionStates(prev => ({ ...prev, [notificationId]: 'idle' }));
        }, 1500);
      } else {
        setActionStates(prev => ({ ...prev, [notificationId]: 'error' }));
        setActionErrors(prev => ({ 
          ...prev, 
          [notificationId]: result.error || 'Error al rechazar la solicitud' 
        }));
      }
    } catch (error) {
      setActionStates(prev => ({ ...prev, [notificationId]: 'error' }));
      setActionErrors(prev => ({ 
        ...prev, 
        [notificationId]: 'Error interno al procesar la solicitud' 
      }));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow_request': return <UserPlus className="w-5 h-5" />;
      case 'collaboration': return '🤝';
      case 'comment': return '💬';
      case 'mention': return '📢';
      case 'system': return '⚙️';
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'follow_request': return 'bg-blue-100 text-blue-800';
      case 'collaboration': return 'bg-green-100 text-green-800';
      case 'comment': return 'bg-purple-100 text-purple-800';
      case 'mention': return 'bg-yellow-100 text-yellow-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (!userMindOpId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <div>
              <h3 className="text-yellow-800 font-medium">MindOp requerido</h3>
              <p className="text-yellow-600 text-sm">
                Necesitas tener un MindOp configurado para ver las notificaciones.{' '}
                <a href="/my-mindop" className="underline">Configura tu MindOp aquí</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notificaciones</h1>
          <p className="text-gray-600">
            Mantente al día con tu actividad y solicitudes
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm font-medium text-black border border-black rounded-md hover:bg-black hover:text-white transition-colors"
            >
              Marcar todo como leído
            </button>
          )}
        </div>
      </div>

      {/* Error de carga */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estado de carga inicial */}
      {loading && notifications.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Cargando notificaciones...</p>
        </div>
      )}

      {/* Contenido principal */}
      {(!loading || notifications.length > 0) && (
        <>
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">No leídas</p>
                  <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
                </div>
                <div className="bg-red-100 rounded-full p-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Solicitudes</p>
                  <p className="text-2xl font-bold text-purple-600">{followRequestsCount}</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { key: 'all', label: 'Todas', count: notifications.length },
                  { key: 'unread', label: 'No leídas', count: unreadCount },
                  { key: 'follow_requests', label: 'Solicitudes', count: followRequestsCount }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.key ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Lista de notificaciones */}
            <div className="divide-y divide-gray-200">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">🔔</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No hay notificaciones
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'follow_requests' 
                      ? 'No tienes solicitudes de seguimiento pendientes'
                      : activeTab === 'unread'
                      ? 'No tienes notificaciones sin leer'
                      : 'No tienes notificaciones aún'
                    }
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => {
                  const actionState = actionStates[notification.id] || 'idle';
                  const actionError = actionErrors[notification.id];

                  return (
                    <div
                      key={notification.id}
                      className={`p-6 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Icono de notificación */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          getNotificationColor(notification.type)
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimestamp(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Marcar como leída
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">{notification.sender}</span>{' '}
                            {notification.message}
                          </p>

                          {/* Error de acción */}
                          {actionError && (
                            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                              {actionError}
                            </div>
                          )}

                          {/* Botones de acción para solicitudes de seguimiento */}
                          {notification.actionRequired && notification.type === 'follow_request' && (
                            <div className="mt-4 flex space-x-3">
                              <button
                                onClick={() => handleAcceptRequest(notification.id, notification.followRequestId!)}
                                disabled={actionState === 'loading'}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                              >
                                {actionState === 'loading' ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : actionState === 'success' ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                <span>
                                  {actionState === 'loading' ? 'Procesando...' : 
                                   actionState === 'success' ? 'Aceptada' : 'Aceptar'}
                                </span>
                              </button>

                              <button
                                onClick={() => handleRejectRequest(notification.id, notification.followRequestId!)}
                                disabled={actionState === 'loading'}
                                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                              >
                                {actionState === 'loading' ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                                <span>
                                  {actionState === 'loading' ? 'Procesando...' : 'Rechazar'}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
