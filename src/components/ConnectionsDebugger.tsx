import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/notificationService';
import { supabase } from '@/services/supabaseClient';
import { AlertCircle, Loader2, Database, Users, X } from 'lucide-react';

interface FollowConnection {
  id: string;
  target_mindop_id: string;
  requester_mindop_id: string;
  status: string;
  created_at: string;
  target_mindop: {
    id: string;
    mindop_name: string;
    user_id: string;
  };
  requester_mindop?: {
    id: string;
    mindop_name: string;
    user_id: string;
  };
}

export const ConnectionsDebugger: React.FC = () => {  const { user } = useAuth();
  const [userMindOpId, setUserMindOpId] = useState<string | null>(null);
  const [following, setFollowing] = useState<FollowConnection[]>([]);
  const [followers, setFollowers] = useState<FollowConnection[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserMindOp();
    }
  }, [user]);

  const fetchUserMindOp = async () => {
    if (!user?.id) return;

    try {
      addLog('Obteniendo MindOp del usuario...');
      const { data, error } = await supabase
        .from('mindops')
        .select('id, mindop_name')
        .eq('user_id', user.id)
        .single();

      if (error) {
        addLog(`Error obteniendo MindOp: ${error.message}`);
        return;
      }

      if (data) {
        setUserMindOpId(data.id);
        addLog(`MindOp encontrado: ${data.mindop_name} (ID: ${data.id})`);
        await loadConnections(data.id);
      }
    } catch (error) {
      addLog(`Error inesperado: ${error}`);
    }
  };

  const loadConnections = async (mindOpId: string) => {
    setLoading(true);
    try {
      addLog('Cargando conexiones...');
      
      // Cargar following
      const followingData = await notificationService.getFollowingMindOps(mindOpId);
      setFollowing(followingData);
      addLog(`Following cargados: ${followingData.length} conexiones`);

      // Cargar followers
      const followersData = await notificationService.getFollowerMindOps(mindOpId);
      setFollowers(followersData);
      addLog(`Followers cargados: ${followersData.length} conexiones`);

    } catch (error) {
      addLog(`Error cargando conexiones: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUnfollow = async (connection: FollowConnection) => {
    if (!userMindOpId) {
      addLog('Error: userMindOpId no disponible');
      return;
    }

    const targetId = connection.target_mindop.id;
    addLog(`\n=== INICIANDO TEST UNFOLLOW ===`);
    addLog(`Usuario MindOp ID: ${userMindOpId}`);
    addLog(`Target MindOp ID: ${targetId}`);
    addLog(`Conexión ID: ${connection.id}`);
    addLog(`Estado actual: ${connection.status}`);

    try {
      // Verificar que existe la conexión antes de eliminar
      addLog('Verificando conexión en base de datos...');
      const { data: existingConnection, error: checkError } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('requester_mindop_id', userMindOpId)
        .eq('target_mindop_id', targetId)
        .eq('status', 'approved');

      if (checkError) {
        addLog(`Error verificando conexión: ${checkError.message}`);
        return;
      }

      if (!existingConnection || existingConnection.length === 0) {
        addLog('❌ No se encontró conexión aprobada en la base de datos');
        return;
      }

      addLog(`✅ Conexión encontrada: ${JSON.stringify(existingConnection[0])}`);

      // Intentar unfollow usando el servicio
      addLog('Ejecutando unfollowMindOp...');
      const result = await notificationService.unfollowMindOp(userMindOpId, targetId);
      
      if (result.success) {
        addLog('✅ unfollowMindOp exitoso');
        
        // Verificar que se eliminó
        const { data: afterDelete, error: afterError } = await supabase
          .from('follow_requests')
          .select('*')
          .eq('requester_mindop_id', userMindOpId)
          .eq('target_mindop_id', targetId)
          .eq('status', 'approved');

        if (afterError) {
          addLog(`Error verificando eliminación: ${afterError.message}`);
        } else {
          addLog(`Registros después de eliminación: ${afterDelete?.length || 0}`);
          if (afterDelete && afterDelete.length === 0) {
            addLog('✅ Conexión eliminada correctamente');
            // Actualizar la lista local
            setFollowing(prev => prev.filter(f => f.target_mindop.id !== targetId));
          } else {
            addLog('❌ La conexión aún existe en la base de datos');
          }
        }
      } else {
        addLog(`❌ unfollowMindOp falló: ${result.error}`);
      }

    } catch (error) {
      addLog(`❌ Error inesperado en test: ${error}`);
    }
    addLog(`=== FIN TEST UNFOLLOW ===\n`);
  };

  const testRemoveFollower = async (connection: FollowConnection) => {
    if (!userMindOpId) {
      addLog('Error: userMindOpId no disponible');
      return;
    }

    const followerId = connection.requester_mindop?.id;
    if (!followerId) {
      addLog('Error: ID del seguidor no disponible');
      return;
    }

    addLog(`\n=== INICIANDO TEST REMOVE FOLLOWER ===`);
    addLog(`Usuario MindOp ID: ${userMindOpId}`);
    addLog(`Follower MindOp ID: ${followerId}`);
    addLog(`Conexión ID: ${connection.id}`);
    addLog(`Estado actual: ${connection.status}`);

    try {
      // Verificar que existe la conexión antes de eliminar
      addLog('Verificando conexión en base de datos...');
      const { data: existingConnection, error: checkError } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('requester_mindop_id', followerId)
        .eq('target_mindop_id', userMindOpId)
        .eq('status', 'approved');

      if (checkError) {
        addLog(`Error verificando conexión: ${checkError.message}`);
        return;
      }

      if (!existingConnection || existingConnection.length === 0) {
        addLog('❌ No se encontró conexión aprobada en la base de datos');
        return;
      }

      addLog(`✅ Conexión encontrada: ${JSON.stringify(existingConnection[0])}`);

      // Intentar remove follower usando el servicio
      addLog('Ejecutando removeFollower...');
      const result = await notificationService.removeFollower(userMindOpId, followerId);
      
      if (result.success) {
        addLog('✅ removeFollower exitoso');
        
        // Verificar que se eliminó
        const { data: afterDelete, error: afterError } = await supabase
          .from('follow_requests')
          .select('*')
          .eq('requester_mindop_id', followerId)
          .eq('target_mindop_id', userMindOpId)
          .eq('status', 'approved');

        if (afterError) {
          addLog(`Error verificando eliminación: ${afterError.message}`);
        } else {
          addLog(`Registros después de eliminación: ${afterDelete?.length || 0}`);
          if (afterDelete && afterDelete.length === 0) {
            addLog('✅ Conexión eliminada correctamente');
            // Actualizar la lista local
            setFollowers(prev => prev.filter(f => f.requester_mindop?.id !== followerId));
          } else {
            addLog('❌ La conexión aún existe en la base de datos');
          }
        }
      } else {
        addLog(`❌ removeFollower falló: ${result.error}`);
      }

    } catch (error) {
      addLog(`❌ Error inesperado en test: ${error}`);
    }
    addLog(`=== FIN TEST REMOVE FOLLOWER ===\n`);
  };

  const manualDelete = async (connection: FollowConnection, isFollowing: boolean) => {
    if (!userMindOpId) return;

    addLog(`\n=== ELIMINACIÓN MANUAL ===`);
    try {
      const { error } = await supabase
        .from('follow_requests')
        .delete()
        .eq('id', connection.id);

      if (error) {
        addLog(`❌ Error en eliminación manual: ${error.message}`);
      } else {
        addLog('✅ Eliminación manual exitosa');
        if (isFollowing) {
          setFollowing(prev => prev.filter(f => f.id !== connection.id));
        } else {
          setFollowers(prev => prev.filter(f => f.id !== connection.id));
        }
      }
    } catch (error) {
      addLog(`❌ Error inesperado en eliminación manual: ${error}`);
    }
    addLog(`=== FIN ELIMINACIÓN MANUAL ===\n`);
  };
  if (!user) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-xl">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 font-medium">Usuario no autenticado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-semibold text-black mb-4 flex items-center">
          <Database className="w-6 h-6 mr-2 text-gray-600" />
          Debugger de Conexiones
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-semibold text-black mb-2">Información del Usuario</h3>
            <p className="text-sm text-gray-600">Email: {user.email}</p>
            <p className="text-sm text-gray-600">ID: {user.id}</p>
            <p className="text-sm text-gray-600">MindOp ID: {userMindOpId || 'Cargando...'}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-semibold text-black mb-2">Estadísticas</h3>
            <p className="text-sm text-gray-600">Siguiendo: {following.length}</p>
            <p className="text-sm text-gray-600">Seguidores: {followers.length}</p>
            <p className="text-sm text-gray-600">Logs: {debugLogs.length}</p>
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => userMindOpId && loadConnections(userMindOpId)}
            disabled={loading || !userMindOpId}
            className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-2 transition-all duration-200 font-medium shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            <span>Recargar Conexiones</span>
          </button>
          
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 flex items-center space-x-2 transition-all duration-200 font-medium shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>Limpiar Logs</span>
          </button>
        </div>
      </div>

      {/* Following Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-black mb-4">Siguiendo ({following.length})</h2>
        {following.length === 0 ? (
          <p className="text-gray-500">No sigues a ningún MindOp</p>
        ) : (
          <div className="space-y-3">
            {following.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h3 className="font-semibold text-black">{connection.target_mindop.mindop_name}</h3>
                  <p className="text-sm text-gray-600">ID: {connection.target_mindop.id}</p>
                  <p className="text-sm text-gray-600">Estado: {connection.status}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => testUnfollow(connection)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded-xl text-sm hover:bg-yellow-700 transition-all duration-200 font-medium"
                  >
                    Test Unfollow
                  </button>
                  <button
                    onClick={() => manualDelete(connection, true)}
                    className="px-3 py-1 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-all duration-200 font-medium"
                  >
                    Eliminar Manual
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Followers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-black mb-4">Seguidores ({followers.length})</h2>
        {followers.length === 0 ? (
          <p className="text-gray-500">No tienes seguidores</p>
        ) : (
          <div className="space-y-3">
            {followers.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h3 className="font-semibold text-black">{connection.requester_mindop?.mindop_name || 'Sin nombre'}</h3>
                  <p className="text-sm text-gray-600">ID: {connection.requester_mindop?.id}</p>
                  <p className="text-sm text-gray-600">Estado: {connection.status}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => testRemoveFollower(connection)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded-xl text-sm hover:bg-yellow-700 transition-all duration-200 font-medium"
                  >
                    Test Remove
                  </button>
                  <button
                    onClick={() => manualDelete(connection, false)}
                    className="px-3 py-1 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-all duration-200 font-medium"
                  >
                    Eliminar Manual
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-black mb-4">Logs de Debug</h2>
        <div className="bg-black text-green-400 p-4 rounded-xl h-64 overflow-y-auto font-mono text-sm border">
          {debugLogs.length === 0 ? (
            <p className="text-gray-500">No hay logs disponibles</p>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsDebugger;
