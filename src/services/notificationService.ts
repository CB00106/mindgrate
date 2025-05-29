import { supabase } from './supabaseClient';
import { FollowRequest } from '@/types/mindops';

export interface NotificationWithDetails extends FollowRequest {
  requester_mindop: {
    mindop_name: string;
    user_id: string;
    profiles?: {
      full_name?: string;
      email?: string;
    };
  };
  target_mindop: {
    mindop_name: string;
    user_id: string;
  };
}

export interface ProcessedNotification {
  id: string;
  type: 'follow_request' | 'collaboration' | 'comment' | 'mention' | 'system';
  title: string;
  message: string;
  sender?: string;
  senderEmail?: string;
  isRead: boolean;
  createdAt: Date;
  actionRequired?: boolean;
  status?: string;
  followRequestId?: string;
}

class NotificationService {
  /**
   * Obtiene las solicitudes de seguimiento para el usuario actual
   */  async getFollowRequestNotifications(userMindOpId: string): Promise<ProcessedNotification[]> {
    try {
      // Usar la consulta optimizada con joins correctos basada en la estructura real
      const { data, error } = await supabase
        .from('follow_requests')
        .select(`
          *,
          requester_mindop:mindops!follow_requests_requester_mindop_id_fkey (
            id,
            mindop_name,
            user_id
          ),
          target_mindop:mindops!follow_requests_target_mindop_id_fkey (
            id,
            mindop_name,
            user_id
          )
        `)
        .eq('target_mindop_id', userMindOpId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching follow requests:', error);
        // Fallback a consulta simple si falla el join
        return this.getFollowRequestNotificationsSimple(userMindOpId);
      }

      return this.processFollowRequestsWithJoins(data || []);
    } catch (error) {
      console.error('Error in getFollowRequestNotifications:', error);
      // Fallback a consulta simple
      return this.getFollowRequestNotificationsSimple(userMindOpId);
    }
  }

  /**
   * Método de fallback con consultas separadas
   */
  private async getFollowRequestNotificationsSimple(userMindOpId: string): Promise<ProcessedNotification[]> {
    try {
      // Consulta simplificada para obtener las solicitudes básicas
      const { data: followRequests, error } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('target_mindop_id', userMindOpId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching follow requests (simple):', error);
        return [];
      }

      if (!followRequests || followRequests.length === 0) {
        return [];
      }

      // Obtener información de los MindOps relacionados por separado
      const requesterIds = followRequests.map(req => req.requester_mindop_id);
      const targetIds = followRequests.map(req => req.target_mindop_id);
      
      const { data: mindops, error: mindopError } = await supabase
        .from('mindops')
        .select('id, mindop_name, user_id')
        .in('id', [...requesterIds, ...targetIds]);

      if (mindopError) {
        console.error('Error fetching mindops:', mindopError);
        // Continuar con datos básicos aunque falle la consulta de mindops
      }

      return this.processFollowRequestsWithMindops(followRequests, mindops || []);
    } catch (error) {
      console.error('Error in getFollowRequestNotificationsSimple:', error);
      return [];
    }
  }
  /**
   * Procesa las solicitudes de seguimiento con datos obtenidos via joins
   */
  private processFollowRequestsWithJoins(followRequests: any[]): ProcessedNotification[] {
    return followRequests.map(request => {
      const requesterName = request.requester_mindop?.mindop_name || 'Usuario desconocido';
      const targetName = request.target_mindop?.mindop_name || 'MindOp';

      return {
        id: `follow_request_${request.id}`,
        type: 'follow_request' as const,
        title: 'Solicitud de seguimiento',
        message: `quiere seguir tu MindOp "${targetName}" y colaborar contigo`,
        sender: requesterName,
        senderEmail: undefined,
        isRead: false,
        createdAt: new Date(request.created_at),
        actionRequired: request.status === 'pending',
        status: request.status,
        followRequestId: request.id,
      };
    });
  }
  /**
   * Procesa las solicitudes de seguimiento con datos de MindOps relacionados
   */
  private processFollowRequestsWithMindops(followRequests: any[], mindops: any[]): ProcessedNotification[] {
    return followRequests.map(request => {
      const requesterMindop = mindops.find(m => m.id === request.requester_mindop_id);
      const targetMindop = mindops.find(m => m.id === request.target_mindop_id);
      
      const requesterName = requesterMindop?.mindop_name || 'Usuario desconocido';
      const targetName = targetMindop?.mindop_name || 'MindOp';

      return {
        id: `follow_request_${request.id}`,
        type: 'follow_request' as const,
        title: 'Solicitud de seguimiento',
        message: `quiere seguir tu MindOp "${targetName}" y colaborar contigo`,
        sender: requesterName,
        senderEmail: undefined, // Se puede obtener en una consulta adicional si es necesario
        isRead: false,
        createdAt: new Date(request.created_at),
        actionRequired: request.status === 'pending',
        status: request.status,
        followRequestId: request.id,
      };
    });
  }
  /**
   * Acepta una solicitud de seguimiento
   */
  async acceptFollowRequest(followRequestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('follow_requests')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', followRequestId);

      if (error) {
        console.error('Error accepting follow request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in acceptFollowRequest:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Rechaza una solicitud de seguimiento
   */
  async rejectFollowRequest(followRequestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('follow_requests')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', followRequestId);

      if (error) {
        console.error('Error rejecting follow request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in rejectFollowRequest:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Elimina una solicitud de seguimiento (después de ser procesada)
   */
  async deleteFollowRequest(followRequestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('follow_requests')
        .delete()
        .eq('id', followRequestId);

      if (error) {
        console.error('Error deleting follow request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteFollowRequest:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtiene todas las notificaciones para el usuario actual
   */
  async getAllNotifications(userMindOpId: string): Promise<ProcessedNotification[]> {
    const followRequests = await this.getFollowRequestNotifications(userMindOpId);
    
    // Aquí se pueden agregar otros tipos de notificaciones en el futuro
    // const comments = await this.getCommentNotifications(userMindOpId);
    // const mentions = await this.getMentionNotifications(userMindOpId);
    
    return [...followRequests].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Obtiene el conteo de notificaciones pendientes para el usuario
   */
  async getPendingCount(userMindOpId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('follow_requests')
        .select('*', { count: 'exact' })
        .eq('target_mindop_id', userMindOpId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error getting pending count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getPendingCount:', error);
      return 0;
    }
  }

  /**
   * Obtiene los MindOps que el usuario actual está siguiendo
   */
  async getFollowingMindOps(userMindOpId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('follow_requests')
        .select(`
          id,
          target_mindop_id,
          created_at,
          target_mindop:mindops!follow_requests_target_mindop_id_fkey (
            id,
            mindop_name,
            mindop_description,
            user_id
          )
        `)
        .eq('requester_mindop_id', userMindOpId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching following mindops:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFollowingMindOps:', error);
      return [];
    }
  }

  /**
   * Obtiene los MindOps que siguen al usuario actual
   */
  async getFollowerMindOps(userMindOpId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('follow_requests')
        .select(`
          id,
          requester_mindop_id,
          created_at,
          requester_mindop:mindops!follow_requests_requester_mindop_id_fkey (
            id,
            mindop_name,
            mindop_description,
            user_id
          )
        `)
        .eq('target_mindop_id', userMindOpId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching follower mindops:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFollowerMindOps:', error);
      return [];
    }
  }
  /**
   * Revoca un seguimiento (dejar de seguir a un MindOp)
   */
  async unfollowMindOp(userMindOpId: string, targetMindOpId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Iniciando unfollowMindOp:', { userMindOpId, targetMindOpId });
      
      // Verificar que existe la conexión antes de eliminar
      const { data: existingConnections, error: checkError } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('requester_mindop_id', userMindOpId)
        .eq('target_mindop_id', targetMindOpId)
        .eq('status', 'approved');

      if (checkError) {
        console.error('❌ Error verificando conexión existente:', checkError);
        return { success: false, error: checkError.message };
      }

      console.log('📋 Conexiones encontradas:', existingConnections);

      if (!existingConnections || existingConnections.length === 0) {
        console.warn('⚠️ No se encontró conexión aprobada para eliminar');
        return { success: false, error: 'No se encontró una conexión activa para dejar de seguir' };
      }

      // Realizar la eliminación
      const { data: deleteResult, error } = await supabase
        .from('follow_requests')
        .delete()
        .eq('requester_mindop_id', userMindOpId)
        .eq('target_mindop_id', targetMindOpId)
        .eq('status', 'approved')
        .select();

      if (error) {
        console.error('❌ Error eliminando conexión:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Conexión eliminada exitosamente:', deleteResult);
      return { success: true };
    } catch (error) {
      console.error('❌ Error inesperado en unfollowMindOp:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
  /**
   * Remueve un seguidor (revocar el seguimiento de un MindOp hacia el usuario)
   */
  async removeFollower(userMindOpId: string, followerMindOpId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Iniciando removeFollower:', { userMindOpId, followerMindOpId });
      
      // Verificar que existe la conexión antes de eliminar
      const { data: existingConnections, error: checkError } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('requester_mindop_id', followerMindOpId)
        .eq('target_mindop_id', userMindOpId)
        .eq('status', 'approved');

      if (checkError) {
        console.error('❌ Error verificando conexión existente:', checkError);
        return { success: false, error: checkError.message };
      }

      console.log('📋 Conexiones encontradas:', existingConnections);

      if (!existingConnections || existingConnections.length === 0) {
        console.warn('⚠️ No se encontró conexión aprobada para eliminar');
        return { success: false, error: 'No se encontró una conexión activa del seguidor' };
      }

      // Realizar la eliminación
      const { data: deleteResult, error } = await supabase
        .from('follow_requests')
        .delete()
        .eq('requester_mindop_id', followerMindOpId)
        .eq('target_mindop_id', userMindOpId)
        .eq('status', 'approved')
        .select();

      if (error) {
        console.error('❌ Error eliminando conexión:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Seguidor removido exitosamente:', deleteResult);
      return { success: true };
    } catch (error) {
      console.error('❌ Error inesperado en removeFollower:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}

export const notificationService = new NotificationService();
