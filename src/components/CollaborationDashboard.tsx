import React, { useState } from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useMindOp } from '@/hooks/useMindOp';
import { useAuth } from '@/hooks/useAuth';
import type { CollaborationTask } from '@/types/mindops';
import { logger } from '@/utils/logger';

interface CollaborationDashboardProps {
  className?: string;
}

export const CollaborationDashboard: React.FC<CollaborationDashboardProps> = ({ className }) => {
  const { user, loading: authLoading } = useAuth();
  const { mindop } = useMindOp();
  const {
    tasks,
    loading,
    error,
    createTask,
    processTask,
    syncCollaboration,
    processing,
    allTasks,
    pendingTasks,
    completedTasks,
    refetch
  } = useCollaboration();

  const [newTaskForm, setNewTaskForm] = useState({
    targetMindopId: '',
    query: '',
    showForm: false
  });

  const [syncForm, setSyncForm] = useState({
    targetMindopId: '',
    query: '',
    showForm: false,
    response: null as string | null
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.targetMindopId || !newTaskForm.query) return;

    try {
      await createTask({
        requester_mindop_id: mindop?.id || '',
        target_mindop_id: newTaskForm.targetMindopId,
        query: newTaskForm.query
      });
      
      setNewTaskForm({ targetMindopId: '', query: '', showForm: false });
    } catch (error) {
      logger.error('Error creating task:', error);
    }
  };

  const handleSyncCollaboration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncForm.targetMindopId || !syncForm.query) return;

    try {
      const result = await syncCollaboration(syncForm.targetMindopId, syncForm.query);
      setSyncForm(prev => ({ ...prev, response: result.response }));
    } catch (error) {
      logger.error('Error in sync collaboration:', error);
    }
  };

  const handleProcessTask = async (taskId: string) => {
    try {
      await processTask(taskId);
    } catch (error) {
      logger.error('Error processing task:', error);
    }
  };
  const getStatusColor = (status: CollaborationTask['status']) => {
    switch (status) {
      case 'pending_target_processing': return 'text-yellow-600 bg-yellow-100';
      case 'processing_by_target': return 'text-blue-600 bg-blue-100';
      case 'target_processing_complete': return 'text-green-600 bg-green-100';
      case 'response_received_by_requester': return 'text-green-600 bg-green-100';
      case 'target_processing_failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }  };

  // Loading state durante la autenticación
  if (authLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando...</div>
        </div>
      </div>
    );
  }

  // Verificar autenticación
  if (!user) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Requerido</h3>
          <p className="text-gray-600 mb-4">Necesitas iniciar sesión para acceder al sistema de colaboración.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Verificar MindOp
  if (!mindop) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">MindOp Requerido</h3>
          <p className="text-gray-600 mb-4">Necesitas tener un MindOp configurado para usar la colaboración.</p>
          <button 
            onClick={() => window.location.href = '/my-mindop'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Configurar MindOp
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Colaboración</h2>
            <p className="text-gray-600">Gestiona tareas de colaboración entre MindOps</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Usuario: {user.email}</div>
            <div className="text-sm font-medium text-gray-700">MindOp: {mindop.mindop_name}</div>
            <div className="text-xs text-gray-400">ID: {mindop.id.substring(0, 8)}...</div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{allTasks.length}</div>
          <div className="text-sm text-gray-600">Total de tareas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          <div className="text-sm text-gray-600">Completadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{tasks.asTarget.length}</div>
          <div className="text-sm text-gray-600">Como objetivo</div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setNewTaskForm(prev => ({ ...prev, showForm: !prev.showForm }))}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Nueva Tarea Asíncrona
        </button>
        <button
          onClick={() => setSyncForm(prev => ({ ...prev, showForm: !prev.showForm }))}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Colaboración Síncrona
        </button>
        <button
          onClick={refetch}
          disabled={loading}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Formulario para nueva tarea */}
      {newTaskForm.showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Nueva Tarea de Colaboración</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID del MindOp objetivo
              </label>
              <input
                type="text"
                value={newTaskForm.targetMindopId}
                onChange={(e) => setNewTaskForm(prev => ({ ...prev, targetMindopId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="UUID del MindOp objetivo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consulta
              </label>
              <textarea
                value={newTaskForm.query}
                onChange={(e) => setNewTaskForm(prev => ({ ...prev, query: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="¿Qué quieres preguntar al MindOp objetivo?"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Crear Tarea
              </button>
              <button
                type="button"
                onClick={() => setNewTaskForm(prev => ({ ...prev, showForm: false }))}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario para colaboración síncrona */}
      {syncForm.showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Colaboración Síncrona</h3>
          <form onSubmit={handleSyncCollaboration} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID del MindOp objetivo
              </label>
              <input
                type="text"
                value={syncForm.targetMindopId}
                onChange={(e) => setSyncForm(prev => ({ ...prev, targetMindopId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="UUID del MindOp objetivo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consulta
              </label>
              <textarea
                value={syncForm.query}
                onChange={(e) => setSyncForm(prev => ({ ...prev, query: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="¿Qué quieres preguntar al MindOp objetivo?"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Colaborar
              </button>
              <button
                type="button"
                onClick={() => setSyncForm(prev => ({ ...prev, showForm: false, response: null }))}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
          
          {syncForm.response && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Respuesta:</h4>
              <p className="text-green-700">{syncForm.response}</p>
            </div>
          )}
        </div>
      )}

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Lista de tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tareas como solicitante */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Mis solicitudes ({tasks.asRequester.length})</h3>
          </div>
          <div className="p-4 space-y-4">
            {tasks.asRequester.length === 0 ? (
              <div className="text-center text-gray-500">No tienes solicitudes pendientes</div>
            ) : (
              tasks.asRequester.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        Para: {task.target_mindop?.mindop_name || task.target_mindop_id}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{task.requester_user_query}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  
                  {task.target_mindop_response && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Respuesta:</div>
                      <div className="text-sm text-gray-600">{task.target_mindop_response}</div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Creado: {new Date(task.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tareas como objetivo */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Solicitudes recibidas ({tasks.asTarget.length})</h3>
          </div>
          <div className="p-4 space-y-4">
            {tasks.asTarget.length === 0 ? (
              <div className="text-center text-gray-500">No tienes solicitudes recibidas</div>
            ) : (
              tasks.asTarget.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        De: {task.requester_mindop?.mindop_name || task.requester_mindop_id}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{task.requester_user_query}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  
                  {task.status === 'pending_target_processing' && (
                    <button
                      onClick={() => handleProcessTask(task.id)}
                      disabled={processing[task.id]}
                      className="mt-3 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {processing[task.id] ? 'Procesando...' : 'Procesar'}
                    </button>
                  )}
                  
                  {task.target_mindop_response && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Respuesta:</div>
                      <div className="text-sm text-gray-600">{task.target_mindop_response}</div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Creado: {new Date(task.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
