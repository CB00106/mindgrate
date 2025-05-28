import { supabase } from './supabaseClient';
import { Mindop, CreateMindopData, UpdateMindopData } from '@/types/mindops';

export class MindopService {
  /**
   * Get user's MindOp configuration
   */
  static async getUserMindOp(userId: string): Promise<Mindop | null> {
    const { data, error } = await supabase
      .from('mindops')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user doesn't have a MindOp yet
        return null;
      }
      throw error;
    }

    return data;
  }
  /**
   * Upsert (insert or update) user's MindOp configuration
   */  static async upsertUserMindOp(
    userId: string, 
    data: CreateMindopData
  ): Promise<Mindop> {
    // First, try to get existing MindOp for this user
    const existingMindOp = await this.getUserMindOp(userId);
    
    if (existingMindOp) {
      // Update existing MindOp
      return await this.updateMindOp(existingMindOp.id, data);
    } else {      // Create new MindOp
      const mindopData = {
        user_id: userId,
        mindop_name: data.mindop_name,
        mindop_description: data.mindop_description || null
      };

      const { data: result, error } = await supabase
        .from('mindops')
        .insert(mindopData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    }
  }

  /**
   * Update existing MindOp
   */  static async updateMindOp(
    id: string, 
    data: UpdateMindopData
  ): Promise<Mindop> {
    const { data: result, error } = await supabase
      .from('mindops')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  }
}

export default MindopService;
