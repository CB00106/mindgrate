import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { Mindop, CreateMindopData } from '@/types/mindops';
import MindopService from '@/services/mindopService';

// Cache utilities for localStorage
const MINDOP_CACHE_KEY = 'mindop_cache';
const CACHE_TIMESTAMP_KEY = 'mindop_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedMindop {
  mindop: Mindop | null;
  timestamp: number;
  userId: string;
}

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

const clearMindopCache = (): void => {
  try {
    localStorage.removeItem(MINDOP_CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Error clearing mindop cache:', error);
  }
};

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
  const { user, loading: authLoading } = useAuth();
  const [mindop, setMindop] = useState<Mindop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isStale, setIsStale] = useState(false); // Track if showing cached data
  
  // Use ref to track if we've already fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);
  const retryCountRef = useRef(0);
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
  }, [user?.id, mindop]);const fetchMindOp = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    // Don't show loading spinner if we have cached data (stale-while-revalidate)
    if (!isStale) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await MindopService.getUserMindOp(user.id);
      setMindop(data);
      setRetryCount(0);
      retryCountRef.current = 0;
      setIsStale(false); // Data is now fresh
      
      // Cache the fresh data
      setCachedMindop(data, user.id);
      
      console.log('✅ [useMindOp] Fresh MindOp data fetched and cached');
    } catch (err: any) {
      console.error('Error fetching MindOp:', err);
      
      const isHttp406 = err.message?.includes('406') || err.status === 406 || err.code === '406';
      
      if (isHttp406) {
        setError('Error de comunicación con el servidor. Por favor, intenta de nuevo.');
      } else {
        setError(`Error al cargar la configuración: ${err.message || 'Error desconocido'}`);
      }
      
      // Increment retry count for UI display
      const newRetryCount = retryCountRef.current + 1;
      retryCountRef.current = newRetryCount;
      setRetryCount(newRetryCount);
    } finally {
      // ALWAYS set loading to false when fetch completes
      setLoading(false);
      setIsStale(false); // Clear stale flag regardless of success/failure
    }
  }, [user?.id, isStale]);  // Función de refetch manual
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
    setError(null);

    try {
      const result = await MindopService.upsertUserMindOp(user.id, data);
      setMindop(result);
      
      // Update cache with fresh saved data
      setCachedMindop(result, user.id);
      setIsStale(false);
      
      console.log('💾 [useMindOp] MindOp saved and cached successfully');
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
  }, [user?.id]);  // Effect para cargar MindOp cuando el usuario está disponible
  useEffect(() => {
    // CRITICAL: Wait for auth to stabilize before making any requests
    if (authLoading) {
      console.log('🔄 [useMindOp] Waiting for auth stabilization...');
      return;
    }

    // Only fetch if we have a user and we haven't fetched yet
    if (user && !hasFetchedRef.current) {
      console.log('✅ [useMindOp] Auth stabilized, fetching MindOp data...');
      hasFetchedRef.current = true;
      fetchMindOp();
    } else if (!user) {
      // CONSERVATIVE: Only reset states when auth is definitely not loading AND we don't have a user
      // This prevents clearing during temporary auth state changes during refresh
      console.log('🧹 [useMindOp] No user and auth stabilized, clearing states');
      setMindop(null);
      setError(null);
      setLoading(false);
      setRetryCount(0);
      setIsStale(false);
      retryCountRef.current = 0;
      hasFetchedRef.current = false;
      clearMindopCache(); // Clear cache when user logs out
    }

    // SAFETY NET: Force loading to false after 10 seconds to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (authLoading) {
        console.warn('⚠️ [useMindOp] SAFETY NET: Auth still loading after 10 seconds, forcing loading to false');
        setLoading(false);
      }
    }, 10000);

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [user, authLoading, fetchMindOp]);return {
    mindop,
    loading,
    error,
    saveMindOp,
    refetch,
    retryCount,
    isStale
  };
};