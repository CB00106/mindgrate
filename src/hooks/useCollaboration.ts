import { useState, useEffect, useCallback } from 'react';
import { CollaborationService } from '@/services/collaborationService';
import { useMindOp } from '@/hooks/useMindOp';
import type { CollaborationTask, CreateCollaborationTaskData } from '@/types/mindops';

interface UseCollaborationState {
  tasks: {
    asRequester: CollaborationTask[];
    asTarget: CollaborationTask[];
  };
  loading: boolean;
  error: string | null;
  initialized: boolean;
  processing: { [taskId: string]: boolean };
}

interface UseCollaborationReturn extends UseCollaborationState {
  createTask: (data: CreateCollaborationTaskData) => Promise<CollaborationTask>;
  processTask: (taskId: string) => Promise<void>;
  syncCollaboration: (targetMindopId: string, query: string) => Promise<{ response: string }>;
  updateTaskStatus: (taskId: string, status: CollaborationTask['status'], response?: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refetch: () => Promise<void>;
  // Getters para facilitar el acceso a los datos
  allTasks: CollaborationTask[];
  pendingTasks: CollaborationTask[];
  completedTasks: CollaborationTask[];
}

export function useCollaboration(): UseCollaborationReturn {
  const { mindop } = useMindOp();
  
  const [state, setState] = useState<UseCollaborationState>({
    tasks: {
      asRequester: [],
      asTarget: []
    },
    loading: false,
    error: null,
    initialized: false,
    processing: {}
  });

  // Función para cargar todas las tareas
  const loadTasks = useCallback(async () => {
    if (!mindop?.id) {
      setState(prev => ({
        ...prev,
        tasks: { asRequester: [], asTarget: [] },
        initialized: true,
        loading: false
      }));
      return;
    }

    console.log('[useCollaboration] ➡️ Cargando tareas para MindOp:', mindop.id);
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const taskData = await CollaborationService.getAllTasksForMindOp(mindop.id);
      
      setState(prev => ({
        ...prev,
        tasks: taskData,
        loading: false,
        error: null,
        initialized: true
      }));

      console.log('[useCollaboration] ✅ Tareas cargadas exitosamente:', taskData);
    } catch (error) {
      console.error('[useCollaboration] ❌ Error cargando tareas:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        initialized: true
      }));
    }
  }, [mindop?.id]);

  // Crear nueva tarea de colaboración
  const createTask = useCallback(async (data: CreateCollaborationTaskData): Promise<CollaborationTask> => {
    if (!mindop?.id) {
      throw new Error('No hay MindOp disponible');
    }

    console.log('[useCollaboration] ➡️ Creando nueva tarea:', data);
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newTask = await CollaborationService.createTask({
        ...data,
        requester_mindop_id: mindop.id
      });

      // Actualizar el estado local agregando la nueva tarea
      setState(prev => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          asRequester: [newTask, ...prev.tasks.asRequester]
        },
        loading: false
      }));

      console.log('[useCollaboration] ✅ Tarea creada exitosamente:', newTask);
      return newTask;
    } catch (error) {
      console.error('[useCollaboration] ❌ Error creando tarea:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error creando tarea'
      }));
      throw error;
    }
  }, [mindop?.id]);

  // Procesar tarea de colaboración
  const processTask = useCallback(async (taskId: string): Promise<void> => {
    console.log('[useCollaboration] ➡️ Procesando tarea:', taskId);
    
    setState(prev => ({
      ...prev,
      processing: { ...prev.processing, [taskId]: true }
    }));

    try {
      await CollaborationService.processTask(taskId);
      
      // Recargar las tareas para obtener el estado actualizado
      await loadTasks();
      
      console.log('[useCollaboration] ✅ Tarea procesada exitosamente');
    } catch (error) {
      console.error('[useCollaboration] ❌ Error procesando tarea:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error procesando tarea'
      }));
      throw error;
    } finally {
      setState(prev => ({
        ...prev,
        processing: { ...prev.processing, [taskId]: false }
      }));
    }
  }, [loadTasks]);

  // Colaboración síncrona
  const syncCollaboration = useCallback(async (
    targetMindopId: string, 
    query: string
  ): Promise<{ response: string }> => {
    if (!mindop?.id) {
      throw new Error('No hay MindOp disponible');
    }

    console.log('[useCollaboration] ➡️ Iniciando colaboración síncrona:', { targetMindopId, query });
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await CollaborationService.syncCollaboration(mindop.id, targetMindopId, query);
      
      setState(prev => ({ ...prev, loading: false }));
      console.log('[useCollaboration] ✅ Colaboración síncrona completada:', result);
      
      return result;
    } catch (error) {
      console.error('[useCollaboration] ❌ Error en colaboración síncrona:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error en colaboración síncrona'
      }));
      throw error;
    }
  }, [mindop?.id]);

  // Actualizar estado de tarea
  const updateTaskStatus = useCallback(async (
    taskId: string, 
    status: CollaborationTask['status'], 
    response?: string
  ): Promise<void> => {
    console.log('[useCollaboration] ➡️ Actualizando estado de tarea:', { taskId, status });

    try {
      const updatedTask = await CollaborationService.updateTaskStatus(taskId, status, response);
      
      // Actualizar el estado local
      setState(prev => ({
        ...prev,
        tasks: {
          asRequester: prev.tasks.asRequester.map(task => 
            task.id === taskId ? updatedTask : task
          ),
          asTarget: prev.tasks.asTarget.map(task => 
            task.id === taskId ? updatedTask : task
          )
        }
      }));

      console.log('[useCollaboration] ✅ Estado de tarea actualizado');
    } catch (error) {
      console.error('[useCollaboration] ❌ Error actualizando estado:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error actualizando estado'
      }));
      throw error;
    }
  }, []);

  // Eliminar tarea
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    console.log('[useCollaboration] ➡️ Eliminando tarea:', taskId);

    try {
      await CollaborationService.deleteTask(taskId);
      
      // Actualizar el estado local removiendo la tarea
      setState(prev => ({
        ...prev,
        tasks: {
          asRequester: prev.tasks.asRequester.filter(task => task.id !== taskId),
          asTarget: prev.tasks.asTarget.filter(task => task.id !== taskId)
        }
      }));

      console.log('[useCollaboration] ✅ Tarea eliminada exitosamente');
    } catch (error) {
      console.error('[useCollaboration] ❌ Error eliminando tarea:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error eliminando tarea'
      }));
      throw error;
    }
  }, []);

  // Refetch - recargar todas las tareas
  const refetch = useCallback(async (): Promise<void> => {
    console.log('[useCollaboration] 🔄 Refetch solicitado');
    await loadTasks();
  }, [loadTasks]);

  // Cargar tareas cuando el MindOp esté disponible
  useEffect(() => {
    if (mindop?.id && !state.initialized) {
      loadTasks();
    }
  }, [mindop?.id, state.initialized, loadTasks]);
  // Getters para facilitar el acceso a los datos
  const allTasks = [...state.tasks.asRequester, ...state.tasks.asTarget];
  const pendingTasks = allTasks.filter(task => 
    task.status === 'pending_target_processing' || 
    task.status === 'processing_by_target'
  );
  const completedTasks = allTasks.filter(task => 
    task.status === 'target_processing_complete' || 
    task.status === 'response_received_by_requester'
  );

  return {
    ...state,
    createTask,
    processTask,
    syncCollaboration,
    updateTaskStatus,
    deleteTask,
    refetch,
    // Getters
    allTasks,
    pendingTasks,
    completedTasks
  };
}
