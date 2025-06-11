import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { Mindop, CreateMindopData } from '@/types/mindops';
import MindopService from '@/services/mindopService';

// =================================================
// >> CACHE UTILITIES TEMPORALMENTE DESACTIVADAS PARA PRUEBAS <<
/*
// Cache utilities for localStorage
const MINDOP_CACHE_KEY = 'mindop_cache';
const CACHE_TIMESTAMP_KEY = 'mindop_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedMindop {
  mindop: Mindop | null;
  timestamp: number;
  userId: string;
}
*/

// Solo mantenemos estas constantes activas para clearMindopCache
const MINDOP_CACHE_KEY = 'mindop_cache';
const CACHE_TIMESTAMP_KEY = 'mindop_cache_timestamp';

// =================================================
// >> FUNCIONES DE CACHÉ TEMPORALMENTE DESACTIVADAS PARA PRUEBAS <<
/*
const getCachedMindop = (userId: string): Mindop | null => {
  try {
    const cachedData = localStorage.getItem(MINDOP_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cachedData || !cachedTimestamp) return null;
    
    const cache: CachedMindop = JSON.parse(cachedData);
    const timestamp = parseInt(cachedTimestamp);
    
    // Check if cache is for the same user and not expired
    if (cache.userId === userId && Date.now() - timestamp < CACHE_DURATION) {
      return cache.mindop;
    }
    
    return null;
  } catch (error) {
    console.warn('Error reading mindop cache:', error);
    return null;
  }
};

const setCachedMindop = (mindop: Mindop | null, userId: string): void => {
  try {
    const cacheData: CachedMindop = {
      mindop,
      timestamp: Date.now(),
      userId
    };
    
    localStorage.setItem(MINDOP_CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Error setting mindop cache:', error);
  }
};
*/

const clearMindopCache = (): void => {
  try {
    localStorage.removeItem(MINDOP_CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Error clearing mindop cache:', error);
  }
};
// =================================================

interface UseMindOpReturn {
  mindop: Mindop | null;
  loading: boolean;
  error: string | null;
  saveMindOp: (data: CreateMindopData) => Promise<void>;
  refetch: () => Promise<void>;
  retryCount: number;
  isStale: boolean; // Indicates if showing cached data
}

export const useMindOp = (): UseMindOpReturn => {
  const { user, loading: authLoading, initialized: authInitialized } = useAuth();
  const [mindop, setMindop] = useState<Mindop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isStale, setIsStale] = useState(false); // Track if showing cached data
    // Use ref to track if we've already fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const retryCountRef = useRef(0);
  
  /*
  // =================================================
  // >> LÓGICA DEL CACHÉ TEMPORALMENTE DESACTIVADA PARA PRUEBAS <<
  // Load cached data immediately when user is available
  useEffect(() => {
    if (user?.id && !mindop) {
      const cachedMindop = getCachedMindop(user.id);
      if (cachedMindop) {
        setMindop(cachedMindop);
        setIsStale(true); // Mark as stale data
        setLoading(false); // Show cached data immediately
        console.log('📱 [useMindOp] Loaded cached MindOp, will revalidate in background');
      }
    }
    //
    // If user changed (different ID), clear cache and state for previous user
    if (user?.id && mindop && hasFetchedRef.current) {
      const cachedMindop = getCachedMindop(user.id);
      if (!cachedMindop) {
        // Cache doesn't exist for this user, clear current state
        console.log('🔄 [useMindOp] User changed, clearing previous user data');
        setMindop(null);
        setError(null);
        setIsStale(false);
        hasFetchedRef.current = false; // Force refetch for new user
      }
    }
  }, [user?.id, mindop]);
  // =================================================
  */  const fetchMindOp = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ [useMindOp] Cannot fetch: no user ID available');
      setLoading(false);
      return;
    }
    
    // ⚡ PRUEBA SIN CACHÉ: Siempre mostrar loading
    console.log('🧪 [PRUEBA SIN CACHÉ] Iniciando petición limpia sin caché');
    setLoading(true);
    // No limpies el error aquí, para no causar un parpadeo si falla el re-fetch

    // >> VERIFICACIÓN CRÍTICA ANTES DE LLAMAR AL SERVICIO <<
    console.log('VERIFICACIÓN CRÍTICA ANTES DE LLAMAR AL SERVICIO:', { 
      userId: user?.id, 
      authLoading: authLoading,
      authInitialized: authInitialized,
      testMode: 'SIN_CACHE',
      hasPreviousData: !!mindop
    });

    try {
      console.log('📡 [useMindOp] Fetching MindOp data for user:', user.id);
      const data = await MindopService.getUserMindOp(user.id);
        // Si la petición tuvo éxito, actualizamos todo el estado a "fresco"
      setMindop(data);
      // 🧪 PRUEBA SIN CACHÉ: Desactivar operaciones de caché temporalmente
      // setCachedMindop(data, user.id); // Actualiza el caché con los nuevos datos
      setError(null); // Limpia cualquier error anterior
      setRetryCount(0);
      retryCountRef.current = 0;
      setIsStale(false); // Data is now fresh
      
      console.log('✅ [useMindOp] Datos frescos obtenidos (sin caché en esta prueba).');
    } catch (err: any) {
      console.error('❌ [useMindOp] Falló la petición de fetch:', err);
      
      // *** LA LÓGICA CLAVE ESTÁ AQUÍ ***
      // Si la petición falla, PERO ya teníamos datos en el estado (del caché),
      // NO mostraremos un error al usuario. Simplemente lo reportamos en la consola
      // y dejamos que el usuario siga viendo los datos "stale".
      if (mindop) {
        console.warn('⚠️ [useMindOp] Revalidación en segundo plano fallida, pero se mantienen los datos existentes.');
        // ¡No hacemos nada más! No llamamos a setError().
        // El usuario sigue viendo los datos que ya tenía
      } else {
        // Si llegamos aquí, significa que el fetch inicial (sin caché) falló.
        // En este caso, SÍ es correcto y necesario mostrar el error.
        console.error('💥 [useMindOp] Fetch inicial falló sin datos previos - mostrando error al usuario');
        
        const isHttp406 = err.message?.includes('406') || err.status === 406 || err.code === '406';
        
        if (isHttp406) {
          setError('Error de comunicación con el servidor. Por favor, intenta de nuevo.');
        } else {
          setError(`Error al cargar la configuración: ${err.message || 'Error desconocido'}`);
        }
        
        // Increment retry count para mostrar en la UI
        const newRetryCount = retryCountRef.current + 1;
        retryCountRef.current = newRetryCount;
        setRetryCount(newRetryCount);
      }
    } finally {
      // Al final, siempre quitamos el estado de carga
      setLoading(false);
      setIsStale(false); // Clear stale flag regardless of success/failure
    }
  }, [user?.id, authLoading, authInitialized, mindop]); // Añadimos `mindop` a las dependencias para tener su valor actual en el catch// Función de refetch manual
  const refetch = useCallback(async () => {
    console.log('🔄 [useMindOp] Manual refetch triggered');
    retryCountRef.current = 0;
    setRetryCount(0);
    setIsStale(false); // Clear stale flag since this is a fresh request
    hasFetchedRef.current = false; // Allow refetch
    await fetchMindOp();
  }, [fetchMindOp]);const saveMindOp = useCallback(async (data: CreateMindopData) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }
    
    setLoading(true);
    setError(null);    try {
      const result = await MindopService.upsertUserMindOp(user.id, data);
      setMindop(result);
      
      // 🧪 PRUEBA SIN CACHÉ: Desactivar operaciones de caché temporalmente
      // setCachedMindop(result, user.id);
      setIsStale(false);
      
      console.log('💾 [useMindOp] MindOp saved successfully (sin caché en esta prueba)');
    } catch (err: any) {
      console.error('Error saving MindOp:', err);
      
      if (err.message?.includes('406') || err.status === 406) {
        setError('Error de comunicación al guardar. Intenta de nuevo.');
      } else {
        setError('Error al guardar la configuración del MindOp');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);  // Effect para cargar MindOp cuando la autenticación esté completamente inicializada
  useEffect(() => {
    // 🚨 CRÍTICO: No hacer absolutamente NADA hasta que la autenticación esté completamente inicializada
    if (!authInitialized) {
      console.log('🔄 [useMindOp] Esperando a que el contexto de Auth se inicialice completamente...');
      return;
    }

    // ✅ Una vez inicializado, tomar una decisión clara y definitiva
    console.log('✅ [useMindOp] Auth completamente inicializado. Estado del usuario:', user ? 'authenticated' : 'not authenticated');

    if (user && !hasFetchedRef.current) {
      // ✅ Usuario autenticado y no hemos hecho fetch - proceder a obtener datos
      console.log('🚀 [useMindOp] Usuario autenticado detectado. Iniciando fetch de MindOp...');
      hasFetchedRef.current = true;
      fetchMindOp();
    } else if (!user && hasFetchedRef.current) {
      // ✅ No hay usuario pero teníamos datos previos - limpiar todo
      console.log('🧹 [useMindOp] Usuario deslogueado detectado. Limpiando todos los estados y cache...');
      setMindop(null);
      setError(null);
      setLoading(false);
      setRetryCount(0);
      setIsStale(false);
      retryCountRef.current = 0;
      hasFetchedRef.current = false;
      clearMindopCache();
    } else if (!user && !hasFetchedRef.current) {
      // ✅ No hay usuario y no hemos hecho fetch - asegurar estado limpio
      console.log('🔍 [useMindOp] No hay usuario. Asegurando estado limpio...');
      setMindop(null);
      setError(null);
      setLoading(false);
      setRetryCount(0);
      setIsStale(false);
      retryCountRef.current = 0;
    } else if (user && hasFetchedRef.current) {
      // ✅ Usuario existe y ya hemos hecho fetch - no hacer nada (datos ya cargados)
      console.log('✅ [useMindOp] Usuario autenticado con datos ya cargados. No se requiere acción.');
    }

    // SAFETY NET: Forzar loading a false después de 5 segundos para prevenir carga infinita
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ [useMindOp] SAFETY NET: Aún cargando después de 5 segundos, forzando loading a false');
        setLoading(false);
      }
    }, 5000);

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [user, authInitialized]); // ✅ Depender del usuario Y la señal de inicialización completa

  return {
    mindop,
    loading,
    error,
    saveMindOp,
    refetch,
    retryCount,
    isStale
  };
};