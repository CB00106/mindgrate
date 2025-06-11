import { createClient } from '@supabase/supabase-js'

// Paso 1: Volver a leer las credenciales desde las variables de entorno.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Paso 2: Verificar que las variables de entorno existan.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Paso 3: Crear el cliente de Supabase usando las variables.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export default supabase