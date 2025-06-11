import { useState, useEffect, useRef } from 'react';
import { MindopService } from '@/services/mindopService';
import { useAuth } from '@/hooks/useAuth';
import type { Mindop, CreateMindopData } from '@/types/mindops';

interface UseMindOpState {
  mindop: Mindop | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  retryCount: number;
  isStale: boolean;
}

export function useMindOp() {
  const { user, loading: authLoading, initialized: authInitialized } = useAuth();  const [state, setState] = useState<UseMindOpState>({
    mindop: null,
    loading: false,
    error: null,
    initialized: false,
    retryCount: 0,
    isStale: false,
  });
  
  // Ref para evitar múltiples cargas del mismo usuario
  const lastUserIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Función para cargar el MindOp
  const loadMindOp = async (userId: string) => {
    console.log(`[useMindOp] ➡️ Iniciando carga para usuario: ${userId}`);
    setState(prev => ({ ...prev, loading: true, error: null }));
      try {
      const data = await MindopService.get(userId);
      setState({
        mindop: data,
        loading: false,
        error: null,
        initialized: true,
        retryCount: 0,
        isStale: false,
      });
      console.log(`[useMindOp] ✅ MindOp cargado exitosamente:`, data);
    } catch (error) {
      console.error('[useMindOp] ❌ Error cargando MindOp:', error);
      setState({
        mindop: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        initialized: true,
        retryCount: 0,
        isStale: false,
      });
    }
  };

  // Función para guardar el MindOp
  const saveMindOp = async (data: CreateMindopData) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    console.log(`[useMindOp] ➡️ Guardando MindOp para usuario: ${user.id}`);
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const savedData = await MindopService.save({
        ...data,
        user_id: user.id,
      });
      
      setState(prev => ({
        ...prev,
        mindop: savedData,
        loading: false,
        error: null,
      }));
      
      console.log(`[useMindOp] ✅ MindOp guardado exitosamente:`, savedData);
      return savedData;
    } catch (error) {
      console.error('[useMindOp] ❌ Error guardando MindOp:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Efecto para cargar el MindOp cuando el usuario esté disponible
  useEffect(() => {
    console.log(`[useMindOp] 🔄 useEffect - authInitialized: ${authInitialized}, user: ${user?.id}, authLoading: ${authLoading}`);
    
    // Solo proceder si la autenticación está inicializada
    if (!authInitialized) {
      console.log(`[useMindOp] ⏳ Esperando inicialización de auth`);
      return;
    }    // Si no hay usuario, limpiar estado
    if (!user) {
      console.log(`[useMindOp] 👤 No hay usuario, limpiando estado`);
      setState({
        mindop: null,
        loading: false,
        error: null,
        initialized: true,
        retryCount: 0,
        isStale: false,
      });
      lastUserIdRef.current = null;
      hasLoadedRef.current = false;
      return;
    }

    // Si es el mismo usuario y ya cargamos, no hacer nada
    if (lastUserIdRef.current === user.id && hasLoadedRef.current) {
      console.log(`[useMindOp] ♻️ MindOp ya cargado para usuario: ${user.id}`);
      return;
    }

    // Si cambió el usuario, resetear el flag de carga
    if (lastUserIdRef.current !== user.id) {
      console.log(`[useMindOp] 🔄 Usuario cambió de ${lastUserIdRef.current} a ${user.id}`);
      hasLoadedRef.current = false;
      lastUserIdRef.current = user.id;
    }

    // Cargar el MindOp solo si no hemos cargado para este usuario
    if (!hasLoadedRef.current) {
      console.log(`[useMindOp] 🚀 Cargando MindOp para usuario: ${user.id}`);
      hasLoadedRef.current = true;
      loadMindOp(user.id);
    }
  }, [user?.id, authInitialized]);

  // Función de refetch que resetea el flag
  const refetch = () => {
    if (!user?.id) {
      return Promise.resolve();
    }
    
    console.log(`[useMindOp] 🔄 Refetch solicitado para usuario: ${user.id}`);
    hasLoadedRef.current = false;
    return loadMindOp(user.id);
  };

  return {
    ...state,
    // El loading general incluye auth loading solo si auth no está inicializado
    loading: (!authInitialized && authLoading) || state.loading,
    // Solo está inicializado si auth está inicializado Y mindop está inicializado
    initialized: authInitialized && state.initialized,
    saveMindOp,
    refetch,
  };
}