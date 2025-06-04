import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { Mindop, CreateMindopData } from '@/types/mindops';
import MindopService from '@/services/mindopService';

interface UseMindOpReturn {
  mindop: Mindop | null;
  loading: boolean;
  error: string | null;
  saveMindOp: (data: CreateMindopData) => Promise<void>;
  refetch: () => Promise<void>;
  retryCount: number;
}

export const useMindOp = (): UseMindOpReturn => {
  const { user, loading: authLoading } = useAuth();
  const [mindop, setMindop] = useState<Mindop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use ref to track if we've already fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const retryCountRef = useRef(0);

  const fetchMindOp = useCallback(async (isRetry = false) => {
    if (!user?.id) {
      console.log('🔍 [useMindOp] No user ID available, skipping fetch');
      setLoading(false);
      return;
    }

    const fetchId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`🔍 [${fetchId}] Starting MindOp fetch for user: ${user.id}${isRetry ? ' (RETRY)' : ''}`);
    
    setLoading(true);
    setError(null);

    try {
      const data = await MindopService.getUserMindOp(user.id);
      console.log(`✅ [${fetchId}] MindOp fetch result:`, data ? 'Found MindOp' : 'No MindOp found');
      setMindop(data);
      setRetryCount(0);
      retryCountRef.current = 0;
    } catch (err: any) {
      console.error(`❌ [${fetchId}] Error fetching MindOp:`, err);
      
      const isHttp406 = err.message?.includes('406') || err.status === 406 || err.code === '406';
      
      if (isHttp406) {
        console.warn(`⚠️ [${fetchId}] HTTP 406 error detected in useMindOp`);
        setError('Error de comunicación (HTTP 406). Reintentando automáticamente...');
        
        // Use ref for retry count to avoid dependency issues
        if (retryCountRef.current < 3) {
          const newRetryCount = retryCountRef.current + 1;
          retryCountRef.current = newRetryCount;
          setRetryCount(newRetryCount);
          console.log(`🔄 [${fetchId}] Auto-retry ${newRetryCount}/3 for HTTP 406`);
          
          const delay = 500 * Math.pow(2, newRetryCount - 1);
          setTimeout(() => {
            fetchMindOp(true);
          }, delay);
        } else {
          setError('Error HTTP 406 persistente. Intenta recargar la página o contacta soporte.');
        }
      } else {
        setError(`Error al cargar la configuración del MindOp: ${err.message || 'Error desconocido'}`);
      }
    } finally {
      setLoading(false);
      console.log(`🏁 [${fetchId}] MindOp fetch completed`);
    }
  }, [user?.id]);

  // Función de refetch manual
  const refetch = useCallback(async () => {
    console.log('🔄 [useMindOp] Manual refetch triggered');
    retryCountRef.current = 0;
    setRetryCount(0);
    hasFetchedRef.current = false; // Allow refetch
    await fetchMindOp();
  }, [fetchMindOp]);

  const saveMindOp = useCallback(async (data: CreateMindopData) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    console.log(`💾 [${saveId}] Saving MindOp from useMindOp hook`);
    
    setLoading(true);
    setError(null);

    try {
      const result = await MindopService.upsertUserMindOp(user.id, data);
      console.log(`✅ [${saveId}] MindOp saved successfully`);
      setMindop(result);
    } catch (err: any) {
      console.error(`❌ [${saveId}] Error saving MindOp:`, err);
      
      if (err.message?.includes('406') || err.status === 406) {
        setError('Error de comunicación al guardar. Intenta de nuevo.');
      } else {
        setError('Error al guardar la configuración del MindOp');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Effect para cargar MindOp cuando el usuario está disponible
  useEffect(() => {
    // Only fetch if we have a user, auth is not loading, and we haven't fetched yet
    if (!authLoading && user && !hasFetchedRef.current) {
      console.log('👤 [useMindOp] User available, fetching MindOp for the first time');
      hasFetchedRef.current = true;
      fetchMindOp();
    } else if (!authLoading && !user) {
      console.log('❌ [useMindOp] No user available, clearing MindOp state');
      setMindop(null);
      setError(null);
      setRetryCount(0);
      retryCountRef.current = 0;
      hasFetchedRef.current = false;
    }
  }, [user, authLoading]); // Removed fetchMindOp from dependencies

  // Debug effect to log state changes
  useEffect(() => {
    console.log('🔍 [useMindOp] State update:', {
      loading,
      hasUser: !!user,
      hasMindop: !!mindop,
      error,
      retryCount,
      timestamp: new Date().toISOString()
    });
  }, [loading, user, mindop, error, retryCount]);

  return {
    mindop,
    loading,
    error,
    saveMindOp,
    refetch,
    retryCount
  };
};