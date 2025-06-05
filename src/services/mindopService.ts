import { supabase } from './supabaseClient';
import { Mindop, CreateMindopData, UpdateMindopData } from '@/types/mindops';

// Función auxiliar para manejo de errores HTTP 406
const handleSupabaseError = (error: any, queryId: string) => {
  if (error.code === 'PGRST116') {
    // No rows returned - no error, just no data
    return { isNoData: true };
  }
  
  // Detectar error HTTP 406 específicamente
  if (error.message?.includes('406') || error.status === 406 || error.code === '406') {
    console.warn(`⚠️ [${queryId}] HTTP 406 detected, attempting recovery`);
    return { isHttp406: true };
  }
  
  return { isError: true, error };
};

// Función auxiliar para timeout de operaciones
const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  queryId: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.error(`⏱️ [${queryId}] Operation timeout after ${timeoutMs}ms`);
        reject(new Error(`Operation timeout after ${timeoutMs}ms`));
      }, timeoutMs)
    ),
  ]);
};

// Función auxiliar para retry con backoff exponencial
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500,
  queryId: string
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [${queryId}] Attempt ${attempt}/${maxRetries}`);
      // Add 10 second timeout per attempt
      const result = await withTimeout(operation(), 10000, queryId);
      console.log(`✅ [${queryId}] Operation completed successfully on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.warn(`⚠️ [${queryId}] Attempt ${attempt} failed:`, error);
      
      const errorCheck = handleSupabaseError(error, queryId);
      
      if (errorCheck.isNoData) {
        console.log(`ℹ️ [${queryId}] No data found, returning null`);
        return null as T;
      }
      
      if (errorCheck.isHttp406 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ [${queryId}] HTTP 406 retry ${attempt}/${maxRetries}, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (attempt === maxRetries) {
        console.error(`❌ [${queryId}] Final attempt failed after ${maxRetries} retries:`, error);
        throw error;
      }
      
      // Para otros errores, no reintentar
      if (!errorCheck.isHttp406) {
        console.error(`❌ [${queryId}] Non-retryable error:`, error);
        throw error;
      }
    }  }
  
  throw new Error(`[${queryId}] All retry attempts exhausted`);
};

export class MindopService {
  /**
   * Get user's MindOp configuration with robust HTTP 406 handling
   */
  static async getUserMindOp(userId: string): Promise<Mindop | null> {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`🔍 [${queryId}] MindopService fetching MindOp for user: ${userId}`);
    
    const operation = async () => {
      try {
        // Estrategia 1: Array query primero (más confiable)
        console.log(`🔄 [${queryId}] Trying array approach first...`);
        console.log(`🔄 [${queryId}] About to execute Supabase query...`);
        
        const { data: arrayData, error: arrayError } = await supabase
          .from('mindops')
          .select('id, user_id, mindop_name, mindop_description, created_at')
          .eq('user_id', userId)
          .limit(1);

        console.log(`🔄 [${queryId}] Supabase query executed, processing results...`);
        console.log(`🔄 [${queryId}] Array data:`, arrayData);
        console.log(`🔄 [${queryId}] Array error:`, arrayError);

        if (arrayError) {
          console.warn(`⚠️ [${queryId}] Array approach failed:`, arrayError);
          throw arrayError;
        }

        if (arrayData && arrayData.length > 0) {
          const result = arrayData[0];
          console.log(`✅ [${queryId}] MindOp found with array approach:`, {
            id: result.id,
            name: result.mindop_name,
            createdAt: result.created_at
          });
          return result;
        }

        console.log(`ℹ️ [${queryId}] No MindOp found for user (array approach)`);
        return null;

      } catch (firstError) {
        console.warn(`⚠️ [${queryId}] Array approach failed, trying maybeSingle:`, firstError);
        
        // Estrategia 2: Fallback a maybeSingle
        try {
          console.log(`🔄 [${queryId}] Trying maybeSingle approach...`);
          
          const { data, error } = await supabase
            .from('mindops')
            .select('id, user_id, mindop_name, mindop_description, created_at')
            .eq('user_id', userId)
            .maybeSingle();

          console.log(`🔄 [${queryId}] maybeSingle executed:`, { data, error });

          if (error) {
            console.error(`❌ [${queryId}] maybeSingle also failed:`, error);
            throw error;
          }

          if (!data) {
            console.log(`ℹ️ [${queryId}] No MindOp found for user (maybeSingle)`);
            return null;
          }

          console.log(`✅ [${queryId}] MindOp found with maybeSingle:`, {
            id: data.id,
            name: data.mindop_name,
            createdAt: data.created_at
          });
          return data;

        } catch (secondError) {
          console.error(`❌ [${queryId}] Both strategies failed:`, { firstError, secondError });
          throw secondError;
        }
      }
    };

    return await retryWithBackoff(operation, 3, 1000, queryId);
  }

  /**
   * Upsert (insert or update) user's MindOp configuration
   */  
  static async upsertUserMindOp(
    userId: string, 
    data: CreateMindopData
  ): Promise<Mindop> {
    const upsertId = `upsert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`💾 [${upsertId}] MindopService upserting MindOp for user: ${userId}`, data);
    
    // First, try to get existing MindOp for this user
    const existingMindOp = await this.getUserMindOp(userId);
    
    if (existingMindOp) {
      // Update existing MindOp
      console.log(`🔄 [${upsertId}] Updating existing MindOp: ${existingMindOp.id}`);
      return await this.updateMindOp(existingMindOp.id, data);
    } else {      
      // Create new MindOp
      console.log(`➕ [${upsertId}] Creating new MindOp`);
      
      const operation = async () => {
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
          console.error(`❌ [${upsertId}] Error creating MindOp:`, error);
          throw error;
        }

        console.log(`✅ [${upsertId}] MindOp created successfully:`, {
          id: result.id,
          name: result.mindop_name
        });
        return result;
      };

      return await retryWithBackoff(operation, 3, 500, upsertId);
    }
  }

  /**
   * Update existing MindOp
   */  
  static async updateMindOp(
    id: string, 
    data: UpdateMindopData
  ): Promise<Mindop> {
    const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`🔄 [${updateId}] MindopService updating MindOp: ${id}`, data);
    
    const operation = async () => {
      const { data: result, error } = await supabase
        .from('mindops')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`❌ [${updateId}] Error updating MindOp:`, error);
        throw error;
      }

      console.log(`✅ [${updateId}] MindOp updated successfully:`, {
        id: result.id,
        name: result.mindop_name
      });
      return result;
    };

    return await retryWithBackoff(operation, 3, 500, updateId);
  }
}

export default MindopService;
