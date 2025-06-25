import { supabase } from './supabaseClient';
import type { CollaborationTask, CreateCollaborationTaskData } from '@/types/mindops';

export class CollaborationService {
  
  /**
   * Crear una nueva tarea de colaboración
   */
  static async createTask(data: CreateCollaborationTaskData): Promise<CollaborationTask> {
    console.log('[CollaborationService] ➡️ Creando nueva tarea de colaboración:', data);
    
    try {      const { data: task, error } = await supabase
        .from('mindop_collaboration_tasks')
        .insert({
          requester_mindop_id: data.requester_mindop_id,
          target_mindop_id: data.target_mindop_id,
          requester_user_query: data.query,
          status: 'pending_target_processing'
        })
        .select(`
          *,
          requester_mindop:mindops!mindop_collaboration_tasks_requester_mindop_id_fkey(id, mindop_name, user_id),
          target_mindop:mindops!mindop_collaboration_tasks_target_mindop_id_fkey(id, mindop_name, user_id)
        `)
        .single();

      if (error) {
        console.error('[CollaborationService] ❌ Error creando tarea:', error);
        throw error;
      }

      console.log('[CollaborationService] ✅ Tarea creada exitosamente:', task);
      return task;
    } catch (error) {
      console.error('[CollaborationService] ❌ Error inesperado creando tarea:', error);
      throw error;
    }
  }

  /**
   * Obtener tareas donde un MindOp es el solicitante
   */
  static async getTasksByRequester(mindopId: string): Promise<CollaborationTask[]> {
    console.log('[CollaborationService] ➡️ Obteniendo tareas como solicitante para MindOp:', mindopId);
    
    try {      const { data, error } = await supabase
        .from('mindop_collaboration_tasks')
        .select(`
          *,
          requester_mindop:mindops!mindop_collaboration_tasks_requester_mindop_id_fkey(id, mindop_name, user_id),
          target_mindop:mindops!mindop_collaboration_tasks_target_mindop_id_fkey(id, mindop_name, user_id)
        `)
        .eq('requester_mindop_id', mindopId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[CollaborationService] ❌ Error obteniendo tareas como solicitante:', error);
        throw error;
      }

      console.log('[CollaborationService] ✅ Tareas obtenidas como solicitante:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('[CollaborationService] ❌ Error inesperado obteniendo tareas como solicitante:', error);
      throw error;
    }
  }

  /**
   * Obtener tareas donde un MindOp es el objetivo
   */
  static async getTasksByTarget(mindopId: string): Promise<CollaborationTask[]> {
    console.log('[CollaborationService] ➡️ Obteniendo tareas como objetivo para MindOp:', mindopId);
    
    try {      const { data, error } = await supabase
        .from('mindop_collaboration_tasks')
        .select(`
          *,
          requester_mindop:mindops!mindop_collaboration_tasks_requester_mindop_id_fkey(id, mindop_name, user_id),
          target_mindop:mindops!mindop_collaboration_tasks_target_mindop_id_fkey(id, mindop_name, user_id)
        `)
        .eq('target_mindop_id', mindopId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[CollaborationService] ❌ Error obteniendo tareas como objetivo:', error);
        throw error;
      }

      console.log('[CollaborationService] ✅ Tareas obtenidas como objetivo:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('[CollaborationService] ❌ Error inesperado obteniendo tareas como objetivo:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las tareas relacionadas con un MindOp (como solicitante o objetivo)
   */
  static async getAllTasksForMindOp(mindopId: string): Promise<{
    asRequester: CollaborationTask[],
    asTarget: CollaborationTask[]
  }> {
    console.log('[CollaborationService] ➡️ Obteniendo todas las tareas para MindOp:', mindopId);
    
    try {
      const [requesterTasks, targetTasks] = await Promise.all([
        this.getTasksByRequester(mindopId),
        this.getTasksByTarget(mindopId)
      ]);

      return {
        asRequester: requesterTasks,
        asTarget: targetTasks
      };
    } catch (error) {
      console.error('[CollaborationService] ❌ Error obteniendo todas las tareas:', error);
      throw error;
    }
  }
  /**
   * Procesar una tarea de colaboración (llamar al edge function)
   */
  static async processTask(taskId: string): Promise<{ response: string }> {
    console.log('[CollaborationService] ➡️ Procesando tarea:', taskId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión de usuario activa');
      }

      console.log('[CollaborationService] 🔑 Token presente:', !!session.access_token);
      console.log('[CollaborationService] 👤 Usuario:', session.user?.email);

      // ✅ CORRECTO: Usar los parámetros exactos que espera la Edge Function
      const payload = {
        action_type: 'process_collaboration_task',
        collaboration_task_id: taskId
      };

      console.log('[CollaborationService] 📤 Payload enviado:', payload);

      const response = await supabase.functions.invoke('mindop-service', {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });      console.log('[CollaborationService] 📥 Respuesta completa:', {
        data: response.data,
        error: response.error
      });

      if (response.error) {
        console.error('[CollaborationService] ❌ Error detallado en edge function:', {
          error: response.error,
          message: response.error?.message,
          details: response.error?.details,
          hint: response.error?.hint,
          code: response.error?.code
        });
        throw response.error;
      }

      console.log('[CollaborationService] ✅ Tarea procesada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('[CollaborationService] ❌ Error completo procesando tarea:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  /**
   * Realizar consulta de colaboración síncrona
   */
  static async syncCollaboration(
    requesterMindopId: string,
    targetMindopId: string,
    query: string
  ): Promise<{ response: string }> {
    console.log('[CollaborationService] ➡️ Realizando colaboración síncrona:', {
      requesterMindopId,
      targetMindopId,
      query: query.substring(0, 100) + '...'
    });
    
    try {
      // ✅ Validar que el MindOp target existe
      const isValid = await this.validateMindOpAccess(targetMindopId);
      if (!isValid) {
        throw new Error(`MindOp target no encontrado o no accesible: ${targetMindopId}`);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión de usuario activa');
      }

      console.log('[CollaborationService] 🔑 Token presente:', !!session.access_token);
      console.log('[CollaborationService] 👤 Usuario:', session.user?.email);      // ✅ CORRECTO: Enviar todos los campos requeridos para sync_collaboration
      const payload = {
        mode: 'sync_collaboration',
        query: query,
        mindop_id: requesterMindopId,
        target_mindop_id: targetMindopId
      };

      console.log('[CollaborationService] 📤 Payload enviado:', payload);

      const response = await supabase.functions.invoke('mindop-service', {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });      console.log('[CollaborationService] 📥 Respuesta completa:', {
        data: response.data,
        error: response.error
      });

      if (response.error) {
        console.error('[CollaborationService] ❌ Error detallado en colaboración síncrona:', {
          error: response.error,
          message: response.error?.message,
          details: response.error?.details,
          hint: response.error?.hint,
          code: response.error?.code
        });
        throw response.error;
      }

      console.log('[CollaborationService] ✅ Colaboración síncrona completada');
      return response.data;
    } catch (error) {
      console.error('[CollaborationService] ❌ Error completo en colaboración síncrona:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Actualizar el estado de una tarea
   */
  static async updateTaskStatus(
    taskId: string, 
    status: CollaborationTask['status'],
    response?: string
  ): Promise<CollaborationTask> {
    console.log('[CollaborationService] ➡️ Actualizando estado de tarea:', { taskId, status });
    
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };      if (response) {
        updateData.target_mindop_response = response;
      }

      const { data, error } = await supabase
        .from('mindop_collaboration_tasks')
        .update(updateData)
        .eq('id', taskId)
        .select(`
          *,
          requester_mindop:mindops!mindop_collaboration_tasks_requester_mindop_id_fkey(id, mindop_name, user_id),
          target_mindop:mindops!mindop_collaboration_tasks_target_mindop_id_fkey(id, mindop_name, user_id)
        `)
        .single();

      if (error) {
        console.error('[CollaborationService] ❌ Error actualizando estado:', error);
        throw error;
      }

      console.log('[CollaborationService] ✅ Estado actualizado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('[CollaborationService] ❌ Error inesperado actualizando estado:', error);
      throw error;
    }
  }

  /**
   * Eliminar una tarea de colaboración
   */
  static async deleteTask(taskId: string): Promise<void> {
    console.log('[CollaborationService] ➡️ Eliminando tarea:', taskId);
    
    try {      const { error } = await supabase
        .from('mindop_collaboration_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('[CollaborationService] ❌ Error eliminando tarea:', error);
        throw error;
      }

      console.log('[CollaborationService] ✅ Tarea eliminada exitosamente');
    } catch (error) {
      console.error('[CollaborationService] ❌ Error inesperado eliminando tarea:', error);
      throw error;
    }
  }

  /**
   * Verificar que un MindOp existe y es accesible
   */
  static async validateMindOpAccess(mindopId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('mindops')
        .select('id, mindop_name')
        .eq('id', mindopId)
        .single();

      if (error || !data) {
        console.error('[CollaborationService] ❌ MindOp no encontrado:', mindopId);
        return false;
      }

      console.log('[CollaborationService] ✅ MindOp validado:', data.mindop_name);
      return true;
    } catch (error) {
      console.error('[CollaborationService] ❌ Error validando MindOp:', error);
      return false;
    }
  }
}
