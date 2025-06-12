import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle, Bell, UserPlus, RefreshCw, Clock, UserMinus, Users, Heart } from 'lucide-react';
import { useMindOp } from '@/hooks/useMindOp';
import { notificationService, ProcessedNotification } from '@/services/notificationService';

interface ActionState {
  [notificationId: string]: 'idle' | 'loading' | 'success' | 'error';
}

interface ActionError {
  [notificationId: string]: string;
}

const NotificationsPage: React.FC = () => {
  const { mindop: userMindOp, initialized: mindOpInitialized } = useMindOp();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'follow_requests' | 'connections'>('all');
  const [notifications, setNotifications] = useState<ProcessedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<ActionState>({});
  const [actionErrors, setActionErrors] = useState<ActionError>({});
  
  // Estados para la gestión de conexiones
  const [connectionsTab, setConnectionsTab] = useState<'following' | 'followers'>('following');
  const [following, setFollowing] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionActionStates, setConnectionActionStates] = useState<ActionState>({});
  const [connectionActionErrors, setConnectionActionErrors] = useState<ActionError>({});

  // Extraer el ID del MindOp del usuario
  const userMindOpId = userMindOp?.id || null;

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    // Wait for mindop to be initialized before loading notifications
    if (!mindOpInitialized) {
      console.log('🔄 [NotificationsPage] Waiting for mindop initialization before loading notifications...');
      return;
    }

    if (userMindOpId) {
      loadNotifications();
    } else {
      // Si no hay MindOp, limpiar loading
      setLoading(false);
    }
  }, [userMindOpId, mindOpInitialized]);

  // Cargar conexiones cuando se cambia al tab de conexiones
  useEffect(() => {
    // Wait for mindop to be initialized before loading connections
    if (!mindOpInitialized) {
      console.log('🔄 [NotificationsPage] Waiting for mindop initialization before loading connections...');
      return;
    }

    if (userMindOpId && activeTab === 'connections') {
      loadConnections();
    }
  }, [userMindOpId, activeTab, mindOpInitialized]);

  const loadNotifications = async () => {
    // Wait for mindop to be initialized
    if (!mindOpInitialized) {
      console.log('🔄 [NotificationsPage] MindOp not initialized, cannot load notifications');
      return;
    }

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

 const loadConnections = async () => {
  // Wait for mindop to be initialized
  if (!mindOpInitialized) {
    console.log('🔄 [NotificationsPage] MindOp not initialized, cannot load connections');
    return;
  }

  if (!userMindOpId) return;

  try {
    setConnectionsLoading(true);
    const [followingData, followersData] = await Promise.all([
      notificationService.getFollowingMindOps(userMindOpId),
      notificationService.getFollowerMindOps(userMindOpId)
    ]);
      // ADAPTACIÓN: Trabajar con los datos actuales que tienen IDs pero no objetos completos
    const validFollowing = (followingData || []).filter(
      connection => connection && (
        // Caso ideal: tiene el objeto completo
        (connection.target_mindop && connection.target_mindop.id) ||
        // Caso actual: solo tiene el ID
        connection.target_mindop_id
      )
    ).map(connection => {
      // Si no tiene el objeto completo, creamos uno básico
      if (!connection.target_mindop && connection.target_mindop_id) {
        return {
          ...connection,
          target_mindop: {
            id: connection.target_mindop_id,
            mindop_name: `MindOp ${connection.target_mindop_id.slice(0, 8)}...`,
            mindop_description: 'Información no disponible'
          }
        };
      }
      return connection;
    });

    const validFollowers = (followersData || []).filter(
      connection => connection && (
        // Caso ideal: tiene el objeto completo
        (connection.requester_mindop && connection.requester_mindop.id) ||
        // Caso actual: solo tiene el ID
        connection.requester_mindop_id
      )
    ).map(connection => {
      // Si no tiene el objeto completo, creamos uno básico
      if (!connection.requester_mindop && connection.requester_mindop_id) {
        return {
          ...connection,
          requester_mindop: {
            id: connection.requester_mindop_id,
            mindop_name: `MindOp ${connection.requester_mindop_id.slice(0, 8)}...`,
            mindop_description: 'Información no disponible'
          }
        };
      }
      return connection;
    });
    
    console.log('📊 [NotificationsPage] Conexiones procesadas:', {
      followingTotal: followingData?.length || 0,
      followingValid: validFollowing.length,
      followersTotal: followersData?.length || 0,
      followersValid: validFollowers.length
    });
    
    setFollowing(validFollowing);
    setFollowers(validFollowers);
  } catch (error) {
    console.error('Error loading connections:', error);
    setError('Error al cargar las conexiones');
    // En caso de error, asegurar que las listas estén vacías
    setFollowing([]);
    setFollowers([]);
  } finally {
    setConnectionsLoading(false);
  }
};

  const filteredNotifications = notifications.filter(notification => {
    if (!notification) return false;
    
    switch (activeTab) {
      case 'unread':
        return !notification.isRead;
      case 'follow_requests':
        return notification.type === 'follow_request';
      default:
        return true;
    }
  });

  // Contadores seguros
  const unreadCount = notifications.filter(n => n && !n.isRead).length;
  const followRequestsCount = notifications.filter(n => n && n.type === 'follow_request' && !n.isRead).length;
  const followingCount = following.filter(f => f && f.target_mindop && f.target_mindop.id).length;
  const followersCount = followers.filter(f => f && f.requester_mindop && f.requester_mindop.id).length;
  
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
    // Wait for mindop to be initialized
    if (!mindOpInitialized) {
      console.log('🔄 [NotificationsPage] MindOp not initialized, cannot accept follow request');
      setActionErrors(prev => ({ 
        ...prev, 
        [notificationId]: 'Inicializando aplicación, intenta de nuevo en un momento' 
      }));
      return;
    }

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
    // Wait for mindop to be initialized
    if (!mindOpInitialized) {
      console.log('🔄 [NotificationsPage] MindOp not initialized, cannot reject follow request');
      setActionErrors(prev => ({ 
        ...prev, 
        [notificationId]: 'Inicializando aplicación, intenta de nuevo en un momento' 
      }));
      return;
    }

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

  const handleUnfollowMindOp = async (targetMindOpId: string) => {
    // Wait for mindop to be initialized
    if (!mindOpInitialized) {
      console.log('🔄 [NotificationsPage] MindOp not initialized, cannot unfollow MindOp');
      const actionKey = `unfollow-${targetMindOpId}`;
      setConnectionActionErrors(prev => ({ 
        ...prev, 
        [actionKey]: 'Inicializando aplicación, intenta de nuevo en un momento' 
      }));
      return;
    }

    if (!userMindOpId) {
      console.warn('⚠️ handleUnfollowMindOp: userMindOpId no disponible');
      return;
    }

    const actionKey = `unfollow-${targetMindOpId}`;
    console.log('🔄 Iniciando handleUnfollowMindOp:', { userMindOpId, targetMindOpId, actionKey });
    
    setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'loading' }));
    setConnectionActionErrors(prev => ({ ...prev, [actionKey]: '' }));

    try {
      const result = await notificationService.unfollowMindOp(userMindOpId, targetMindOpId);
      console.log('📤 Resultado de unfollowMindOp:', result);
      
      if (result.success) {
        console.log('✅ Unfollow exitoso, actualizando UI');
        setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'success' }));
        
        // Remover de la lista de following
        setFollowing(prev => {
          const filtered = prev.filter(f => f.target_mindop.id !== targetMindOpId);
          console.log('📋 Lista following actualizada:', { antes: prev.length, después: filtered.length });
          return filtered;
        });
        
        setTimeout(() => {
          setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'idle' }));
        }, 2000);
      } else {
        console.error('❌ Unfollow falló:', result.error);
        setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'error' }));
        setConnectionActionErrors(prev => ({ 
          ...prev, 
          [actionKey]: result.error || 'Error al dejar de seguir' 
        }));
      }
    } catch (error) {
      console.error('❌ Error inesperado en handleUnfollowMindOp:', error);
      setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'error' }));
      setConnectionActionErrors(prev => ({ 
        ...prev, 
        [actionKey]: 'Error interno al procesar la solicitud' 
      }));
    }
  };

  const handleRemoveFollower = async (followerMindOpId: string) => {
    // Wait for mindop to be initialized
    if (!mindOpInitialized) {
      console.log('🔄 [NotificationsPage] MindOp not initialized, cannot remove follower');
      const actionKey = `remove-${followerMindOpId}`;
      setConnectionActionErrors(prev => ({ 
        ...prev, 
        [actionKey]: 'Inicializando aplicación, intenta de nuevo en un momento' 
      }));
      return;
    }

    if (!userMindOpId) {
      console.warn('⚠️ handleRemoveFollower: userMindOpId no disponible');
      return;
    }

    const actionKey = `remove-${followerMindOpId}`;
    console.log('🔄 Iniciando handleRemoveFollower:', { userMindOpId, followerMindOpId, actionKey });
    
    setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'loading' }));
    setConnectionActionErrors(prev => ({ ...prev, [actionKey]: '' }));

    try {
      const result = await notificationService.removeFollower(userMindOpId, followerMindOpId);
      console.log('📤 Resultado de removeFollower:', result);
      
      if (result.success) {
        console.log('✅ Remove follower exitoso, actualizando UI');
        setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'success' }));
        
        // Remover de la lista de followers
        setFollowers(prev => {
          const filtered = prev.filter(f => f.requester_mindop.id !== followerMindOpId);
          console.log('📋 Lista followers actualizada:', { antes: prev.length, después: filtered.length });
          return filtered;
        });
        
        setTimeout(() => {
          setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'idle' }));
        }, 2000);
      } else {
        console.error('❌ Remove follower falló:', result.error);
        setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'error' }));
        setConnectionActionErrors(prev => ({ 
          ...prev, 
          [actionKey]: result.error || 'Error al remover seguidor' 
        }));
      }
    } catch (error) {
      console.error('❌ Error inesperado en handleRemoveFollower:', error);
      setConnectionActionStates(prev => ({ ...prev, [actionKey]: 'error' }));
      setConnectionActionErrors(prev => ({
        ...prev, 
        [actionKey]: 'Error interno al procesar la solicitud' 
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

  // Mostrar loading mientras se inicializa
  if (!mindOpInitialized) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            <p className="text-gray-600">Inicializando notificaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay MindOp
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
          </div>        </div>
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
                  { key: 'follow_requests', label: 'Solicitudes', count: followRequestsCount },
                  { key: 'connections', label: 'Mis Conexiones', count: followingCount + followersCount }
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
                    {tab.count > 0 && tab.key !== 'connections' && (
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.key ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {tab.key === 'connections' && (followingCount + followersCount) > 0 && (
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.key ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {followingCount + followersCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Lista de notificaciones */}
            {activeTab === 'connections' ? (
              /* Sección de Mis Conexiones */
              <div>
                {/* Sub-navegación para conexiones */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <nav className="flex space-x-6">
                      <button
                        onClick={() => setConnectionsTab('following')}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                          connectionsTab === 'following'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4" />
                          <span>Siguiendo ({followingCount})</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setConnectionsTab('followers')}
                        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                          connectionsTab === 'followers'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Seguidores ({followersCount})</span>
                        </div>
                      </button>
                    </nav>
                    
                    <button
                      onClick={loadConnections}
                      disabled={connectionsLoading}
                      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center space-x-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${connectionsLoading ? 'animate-spin' : ''}`} />
                      <span>Actualizar</span>
                    </button>
                  </div>
                </div>

                {/* Estado de carga de conexiones */}
                {connectionsLoading && (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">Cargando conexiones...</p>
                  </div>
                )}

                {/* Lista de conexiones */}
                {!connectionsLoading && (
                  <div className="divide-y divide-gray-200">
                    {connectionsTab === 'following' && (
                      <>
                        {followingCount === 0 ? (
                          <div className="p-8 text-center">
                            <div className="text-6xl mb-4">💙</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              No sigues a nadie aún
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Busca MindOps interesantes para seguir y comenzar a colaborar
                            </p>
                            <a
                              href="/search"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <Heart className="w-4 h-4 mr-2" />
                              Buscar MindOps
                            </a>
                          </div>
                        ) : (
                          following
                            .filter(connection => connection && connection.target_mindop && connection.target_mindop.id)
                            .map((connection) => {
                              const mindOp = connection.target_mindop;
                              const actionKey = `unfollow-${mindOp.id}`;
                              const actionState = connectionActionStates[actionKey] || 'idle';
                              const actionError = connectionActionErrors[actionKey];

                              return (
                                <div key={connection.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Heart className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900">{mindOp.mindop_name}</h4>
                                        <p className="text-sm text-gray-500">
                                          Siguiendo desde {new Date(connection.created_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 ml-13">
                                      {mindOp.mindop_description || 'Sin descripción disponible'}
                                    </p>
                                    
                                    {actionError && (
                                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded ml-13">
                                        {actionError}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleUnfollowMindOp(mindOp.id)}
                                    disabled={actionState === 'loading'}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center space-x-2 border border-red-200"
                                  >
                                    {actionState === 'loading' ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <UserMinus className="w-4 h-4" />
                                    )}
                                    <span>
                                      {actionState === 'loading' ? 'Procesando...' : 'Dejar de seguir'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </>
                    )}

                    {connectionsTab === 'followers' && (
                      <>
                        {followersCount === 0 ? (
                          <div className="p-8 text-center">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              No tienes seguidores aún
                            </h3>
                            <p className="text-gray-600">
                              Comparte tu MindOp para que otros puedan seguirte y colaborar contigo
                            </p>
                          </div>
                        ) : (
                          followers
                            .filter(connection => connection && connection.requester_mindop && connection.requester_mindop.id)
                            .map((connection) => {
                              const mindOp = connection.requester_mindop;
                              const actionKey = `remove-${mindOp.id}`;
                              const actionState = connectionActionStates[actionKey] || 'idle';
                              const actionError = connectionActionErrors[actionKey];

                              return (
                                <div key={connection.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-green-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900">{mindOp.mindop_name}</h4>
                                        <p className="text-sm text-gray-500">
                                          Te sigue desde {new Date(connection.created_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 ml-13">
                                      {mindOp.mindop_description || 'Sin descripción disponible'}
                                    </p>
                                    
                                    {actionError && (
                                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded ml-13">
                                        {actionError}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleRemoveFollower(mindOp.id)}
                                    disabled={actionState === 'loading'}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center space-x-2 border border-red-200"
                                  >
                                    {actionState === 'loading' ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <UserMinus className="w-4 h-4" />
                                    )}
                                    <span>
                                      {actionState === 'loading' ? 'Procesando...' : 'Remover seguidor'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Sección de notificaciones existente */
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
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPage;