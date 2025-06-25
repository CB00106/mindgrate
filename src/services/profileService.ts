import { supabase } from './supabaseClient';
import { CollaborationService } from './collaborationService';
import { notificationService } from './notificationService';
import type { Mindop } from '@/types/mindops';

export interface ProfileStats {
  mindOps: number;
  followers: number;
  following: number;
  collaborations: number;
  totalDocuments: number;
  totalChunks: number;
}

export interface RecentActivity {
  id: string;
  type: 'mindop_created' | 'collaboration' | 'document_upload' | 'follow_request';
  title: string;
  description: string;
  createdAt: Date;
  metadata?: any;
}

export interface ChartData {
  date: string;
  mindOps: number;
  collaborations: number;
  followers: number;
  documents: number;
}

export class ProfileService {
  /**
   * Get comprehensive profile statistics for a user
   */
  static async getProfileStats(userId: string, userMindOpId: string): Promise<ProfileStats> {
    try {
      const [
        mindOpsData,
        followersData,
        followingData,
        collaborationsData,
        documentsData
      ] = await Promise.all([
        this.getMindOpsCount(userId),
        notificationService.getFollowerMindOps(userMindOpId),
        notificationService.getFollowingMindOps(userMindOpId),
        this.getCollaborationsCount(userMindOpId),
        this.getDocumentsStats(userMindOpId)
      ]);

      return {
        mindOps: mindOpsData,
        followers: followersData.length,
        following: followingData.length,
        collaborations: collaborationsData,
        totalDocuments: documentsData.documentCount,
        totalChunks: documentsData.chunkCount
      };
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      return {
        mindOps: 0,
        followers: 0,
        following: 0,
        collaborations: 0,
        totalDocuments: 0,
        totalChunks: 0
      };
    }
  }

  /**
   * Get user's MindOps count
   */
  private static async getMindOpsCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('mindops')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error counting MindOps:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get user's collaborations count
   */
  private static async getCollaborationsCount(mindOpId: string): Promise<number> {
    try {
      const { asRequester, asTarget } = await CollaborationService.getAllTasksForMindOp(mindOpId);
      return asRequester.length + asTarget.length;
    } catch (error) {
      console.error('Error counting collaborations:', error);
      return 0;
    }
  }

  /**
   * Get document and chunk statistics
   */
  private static async getDocumentsStats(mindOpId: string): Promise<{ documentCount: number; chunkCount: number }> {
    try {
      // Get document chunks count for this MindOp
      const { count: chunkCount, error: chunkError } = await supabase
        .from('mindop_document_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('mindop_id', mindOpId);

      if (chunkError) {
        console.error('Error counting chunks:', chunkError);
        return { documentCount: 0, chunkCount: 0 };
      }

      // Get unique document count (by source_csv_name)
      const { data: uniqueDocuments, error: docError } = await supabase
        .from('mindop_document_chunks')
        .select('source_csv_name')
        .eq('mindop_id', mindOpId);

      if (docError) {
        console.error('Error counting documents:', docError);
        return { documentCount: 0, chunkCount: chunkCount || 0 };
      }

      const uniqueDocCount = new Set(
        uniqueDocuments?.map(doc => doc.source_csv_name).filter(Boolean)
      ).size;

      return {
        documentCount: uniqueDocCount,
        chunkCount: chunkCount || 0
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      return { documentCount: 0, chunkCount: 0 };
    }
  }

  /**
   * Get recent MindOps for the user
   */
  static async getRecentMindOps(userId: string): Promise<Mindop[]> {
    try {
      const { data, error } = await supabase
        .from('mindops')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent MindOps:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting recent MindOps:', error);
      return [];
    }
  }

  /**
   * Get recent activity for the user
   */
  static async getRecentActivity(userId: string, userMindOpId: string): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Get recent MindOps created
      const recentMindOps = await this.getRecentMindOps(userId);
      recentMindOps.forEach(mindop => {
        activities.push({
          id: `mindop_${mindop.id}`,
          type: 'mindop_created',
          title: 'MindOp Creado',
          description: `Creaste el MindOp "${mindop.mindop_name}"`,
          createdAt: new Date(mindop.created_at),
          metadata: { mindopId: mindop.id }
        });
      });

      // Get recent collaborations
      try {
        const { asRequester, asTarget } = await CollaborationService.getAllTasksForMindOp(userMindOpId);
        
        [...asRequester, ...asTarget]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
          .forEach(task => {
            activities.push({
              id: `collab_${task.id}`,
              type: 'collaboration',
              title: 'Colaboración',
              description: `Tarea de colaboración con ${task.target_mindop?.mindop_name || 'otro MindOp'}`,
              createdAt: new Date(task.created_at),
              metadata: { taskId: task.id }
            });
          });
      } catch (collaborationError) {
        console.error('Error fetching collaboration activity:', collaborationError);
      }      // Get recent follow requests
      try {
        const followers = await notificationService.getFollowerMindOps(userMindOpId);
        followers.slice(0, 2).forEach((follower: any) => {
          activities.push({
            id: `follow_${follower.id}`,
            type: 'follow_request',
            title: 'Nuevo Seguidor',
            description: `${follower.requester_mindop?.mindop_name || 'Un MindOp'} comenzó a seguirte`,
            createdAt: new Date(follower.created_at),
            metadata: { followerId: follower.id }
          });
        });
      } catch (followError) {
        console.error('Error fetching follow activity:', followError);
      }

      // Sort all activities by date and return the most recent
      return activities
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Get chart data for the last 30 days
   */
  static async getChartData(userId: string, userMindOpId: string): Promise<ChartData[]> {
    try {
      const days = 30;
      const chartData: ChartData[] = [];

      // Generate date range for the last 30 days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        chartData.push({
          date: dateStr,
          mindOps: 0,
          collaborations: 0,
          followers: 0,
          documents: 0
        });
      }

      // Get MindOps created by date
      const { data: mindOpsData, error: mindOpsError } = await supabase
        .from('mindops')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', chartData[0].date);

      if (!mindOpsError && mindOpsData) {
        mindOpsData.forEach(mindop => {
          const date = mindop.created_at.split('T')[0];
          const dayData = chartData.find(d => d.date === date);
          if (dayData) {
            dayData.mindOps++;
          }
        });
      }

      // Get collaboration tasks by date
      try {
        const { asRequester, asTarget } = await CollaborationService.getAllTasksForMindOp(userMindOpId);
        [...asRequester, ...asTarget].forEach(task => {
          const date = task.created_at.split('T')[0];
          const dayData = chartData.find(d => d.date === date);
          if (dayData) {
            dayData.collaborations++;
          }
        });
      } catch (collaborationError) {
        console.error('Error fetching collaboration chart data:', collaborationError);
      }

      // Get document uploads by date
      const { data: documentsData, error: documentsError } = await supabase
        .from('mindop_document_chunks')
        .select('created_at')
        .eq('mindop_id', userMindOpId)
        .gte('created_at', chartData[0].date);

      if (!documentsError && documentsData) {
        // Group by date and source to count unique documents per day
        const documentsByDate = new Map<string, Set<string>>();
        
        documentsData.forEach(chunk => {
          const date = chunk.created_at.split('T')[0];
          if (!documentsByDate.has(date)) {
            documentsByDate.set(date, new Set());
          }
          // Count unique documents by source_csv_name or chunk ID
          documentsByDate.get(date)!.add(chunk.created_at); // Use timestamp as unique identifier
        });

        documentsByDate.forEach((sources, date) => {
          const dayData = chartData.find(d => d.date === date);
          if (dayData) {
            dayData.documents += Math.ceil(sources.size / 10); // Approximate documents from chunks
          }
        });
      }

      return chartData;

    } catch (error) {
      console.error('Error getting chart data:', error);
      return [];
    }
  }
}
