import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Verificación de consistencia de storage en desarrollo
const checkStorageConsistency = () => {
  if (typeof window !== 'undefined' && localStorage) {
    const keys = Object.keys(localStorage);
    const authKeys = keys.filter(key => key.includes('auth') || key.includes('supabase'));
    console.log('🔍 [Storage Check] Auth-related keys:', authKeys);
    
    // Verificar que solo usamos 'mindops-auth'
    const unexpectedKeys = authKeys.filter(key => !key.includes('mindops-auth'));
    if (unexpectedKeys.length > 0) {
      console.warn('⚠️ [Storage Check] Unexpected auth keys found:', unexpectedKeys);
    }
  }
};

// Llamar en desarrollo
if (import.meta.env.DEV) {
  checkStorageConsistency();
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // CRÍTICO: Habilitar refresh automático para mantener sesión estable
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'mindops-auth',
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.warn('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.warn('Error writing to localStorage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn('Error removing from localStorage:', error);
        }
      }
    }
  },  // Fix para el error HTTP 406: Añadir headers específicos para garantizar aceptación de JSON
  global: {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'X-Client-Info': 'mindgrate-web-client/1.0.0',
      'Prefer': 'return=representation'
    }
  },
  db: {
    schema: 'public'
  },
  // Configuración adicional para evitar problemas con queries REST
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export default supabase