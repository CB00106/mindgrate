import { supabase } from './supabaseClient';
import type { Mindop, CreateMindopData } from '@/types/mindops';

export class MindopService {

  /**
   * Obtiene la configuración "MindOp" de un usuario.
   * Ahora incluye validación del userId antes de hacer la consulta.
   * @param userId - El ID del usuario a buscar.
   * @returns Una promesa que resuelve al objeto Mindop o a null.
   */
  static async get(userId: string): Promise<Mindop | null> {
    // Validar que el userId sea válido antes de proceder
    if (!userId || userId.trim() === '') {
      console.log(`[Service] ⚠️ UserId inválido o vacío: ${userId}`);
      return null;
    }

    console.log(`[Service] ➡️ Buscando MindOp para el usuario: ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('mindops')
        .select('id, user_id, mindop_name, mindop_description, created_at')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(`[Service] ❌ Error en la consulta de get:`, error);
        throw error;
      }

      console.log(`[Service] ✅ Consulta de get completada. Data:`, data);
      return data;
    } catch (error) {
      console.error(`[Service] ❌ Error inesperado en get:`, error);
      throw error;
    }
  }

  /**
   * Crea o actualiza una configuración "MindOp".
   * Ahora incluye validación del userId.
   * @param data - Los datos a insertar o actualizar. Debe incluir el user_id.
   * @returns Una promesa que resuelve al Mindop creado o actualizado.
   */
  static async save(data: CreateMindopData & { user_id: string }): Promise<Mindop> {
    // Validar que el user_id sea válido
    if (!data.user_id || data.user_id.trim() === '') {
      throw new Error('user_id es requerido y no puede estar vacío');
    }

    console.log(`[Service] ➡️ Guardando (Upsert) MindOp para el usuario: ${data.user_id}`);

    try {
      const { data: upsertedData, error } = await supabase
        .from('mindops')
        .upsert(
          {
            user_id: data.user_id,
            mindop_name: data.mindop_name,
            mindop_description: data.mindop_description,
          },
          {
            onConflict: 'user_id',
          }
        )
        .select()
        .single();

      if (error) {
        console.error(`[Service] ❌ Error en la operación de save (upsert):`, error);
        throw error;
      }

      console.log(`[Service] ✅ Operación de save completada. Data:`, upsertedData);
      return upsertedData;
    } catch (error) {
      console.error(`[Service] ❌ Error inesperado en save:`, error);
      throw error;
    }
  }
}