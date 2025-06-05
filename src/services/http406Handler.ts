// Utility para manejo específico de HTTP 406 en Supabase
// Este helper proporciona funciones adicionales para evitar errores 406

import { supabase } from './supabaseClient';

export class Http406Handler {
  /**
   * Realiza una query GET con headers específicos para evitar HTTP 406
   */
  static async safeSelect(
    tableName: string, 
    selectFields: string = '*', 
    filters: Record<string, any> = {}
  ) {
    console.log(`🔐 [Http406Handler] Safe select from ${tableName}`, { selectFields, filters });
    
    try {
      // Construir query base
      let query = supabase.from(tableName).select(selectFields);
      
      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'eq') {
          Object.entries(value).forEach(([field, fieldValue]) => {
            query = query.eq(field, fieldValue);
          });
        } else if (key === 'limit') {
          query = query.limit(value);
        }
      });
      
      // Ejecutar query
      const { data, error } = await query;
      
      if (error) {
        console.error(`❌ [Http406Handler] Error in safe select:`, error);
        throw error;
      }
      
      console.log(`✅ [Http406Handler] Safe select successful, got ${Array.isArray(data) ? data.length : 1} result(s)`);
      return { data, error: null };
      
    } catch (error) {
      console.error(`❌ [Http406Handler] Safe select failed:`, error);
      return { data: null, error };
    }
  }
    /**
   * Obtiene un single record con manejo mejorado de HTTP 406
   */
  static async safeSingle(
    tableName: string, 
    selectFields: string = '*', 
    filters: Record<string, any> = {}
  ): Promise<{ data: any | null; error: any | null }> {
    console.log(`🔐 [Http406Handler] Safe single from ${tableName}`, { selectFields, filters });
    
    try {
      // Primero intentar con array approach
      const arrayResult = await this.safeSelect(tableName, selectFields, { ...filters, limit: 1 });
      
      if (arrayResult.error) {
        throw arrayResult.error;
      }
      
      if (!arrayResult.data || arrayResult.data.length === 0) {
        console.log(`ℹ️ [Http406Handler] No data found for safe single`);
        return { data: null, error: null };
      }
      
      const singleResult = arrayResult.data[0];
      console.log(`✅ [Http406Handler] Safe single successful:`, { result: singleResult });
      return { data: singleResult, error: null };
      
    } catch (error) {
      console.error(`❌ [Http406Handler] Safe single failed:`, error);
      
      // Fallback: intentar con maybeSingle
      try {
        console.log(`🔄 [Http406Handler] Fallback to maybeSingle...`);
        
        let query = supabase.from(tableName).select(selectFields);
        
        Object.entries(filters).forEach(([key, value]) => {
          if (key === 'eq') {
            Object.entries(value).forEach(([field, fieldValue]) => {
              query = query.eq(field, fieldValue);
            });
          }
        });
        
        const { data, error } = await query.maybeSingle();
        
        if (error) {
          throw error;
        }
        
        console.log(`✅ [Http406Handler] Fallback successful`);
        return { data, error: null };
        
      } catch (fallbackError) {
        console.error(`❌ [Http406Handler] Fallback also failed:`, fallbackError);
        return { data: null, error: fallbackError };
      }
    }
  }
  
  /**
   * Detecta si un error es HTTP 406
   */
  static isHttp406Error(error: any): boolean {
    return (
      error?.status === 406 ||
      error?.code === '406' ||
      error?.message?.includes('406') ||
      error?.message?.includes('Not Acceptable')
    );
  }
  
  /**
   * Retry con backoff específico para HTTP 406
   */
  static async retryOnHttp406<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 500
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [Http406Handler] Retry attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        if (this.isHttp406Error(error) && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ [Http406Handler] HTTP 406 detected, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded for HTTP 406 handler');
  }
}

export default Http406Handler;
