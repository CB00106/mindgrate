import React, { createContext, useEffect, useState } from 'react';
import { User, Session, AuthResponse, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';
import { handleAuthError } from '@/utils/authRecovery';

interface SignUpOptions {
  data?: Record<string, unknown>;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  userMindOpId: string | null;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, options?: SignUpOptions) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Record<string, unknown>) => Promise<{ error: AuthError | null }>;
  refreshUserMindOp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [userMindOpId, setUserMindOpId] = useState<string | null>(null);  // Function to fetch user's MindOp ID
  const fetchUserMindOpId = async (userId: string) => {
    try {
      console.log('🔄 [AuthContext] Fetching MindOp for user:', userId);
      
      const { data, error } = await supabase
        .from('mindops')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user doesn't have a MindOp yet
          console.log('ℹ️ [AuthContext] User has no MindOp yet');
          setUserMindOpId(null);
        } else {
          console.error('❌ [AuthContext] Error fetching user MindOp:', error);
          setUserMindOpId(null);
        }
        return;
      }

      const mindOpId = data?.id || null;
      console.log('✅ [AuthContext] MindOp ID fetched:', mindOpId);
      setUserMindOpId(mindOpId);
    } catch (error) {
      console.error('❌ [AuthContext] Unexpected error fetching user MindOp:', error);
      setUserMindOpId(null);
    }
  };

  // Function to refresh user's MindOp (callable from components)
  const refreshUserMindOp = async () => {
    if (user?.id) {
      await fetchUserMindOpId(user.id);
    }
  };  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 [AuthContext] Starting auth initialization...');
        
        // 1. Obtener sesión inicial
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('❌ [AuthContext] Error getting initial session:', error);
          setSession(null);
          setUser(null);
          setUserMindOpId(null);
          setInitialized(true);
          setLoading(false);
        } else {
          console.log('🔄 [AuthContext] Got initial session:', !!session);
          
          // 2. Actualizar estado inicial
          setSession(session);
          setUser(session?.user ?? null);
          
          // 3. Obtener MindOp ID si hay usuario
          if (session?.user) {
            console.log('🔄 [AuthContext] Fetching MindOp ID for user:', session.user.id);
            try {
              await fetchUserMindOpId(session.user.id);
              console.log('✅ [AuthContext] MindOp ID fetched successfully');
            } catch (mindOpError) {
              console.error('❌ [AuthContext] Error fetching MindOp ID during initialization:', mindOpError);
              setUserMindOpId(null);
            }
          } else {
            console.log('🔄 [AuthContext] No user in session, setting MindOp ID to null');
            setUserMindOpId(null);
          }
          
          // 4. IMPORTANT: Solo marcar como completado después de TODO el proceso
          setInitialized(true);
          setLoading(false);
          console.log('✅ [AuthContext] Auth initialization completed');
        }
      } catch (error) {
        console.error('❌ [AuthContext] Unexpected error during initialization:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserMindOpId(null);
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();    // 5. Listener de cambios de auth - mejorado para manejar todos los eventos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log(`🔄 [AuthContext] Auth event: ${event}`, { hasSession: !!session, hasUser: !!session?.user });
        
        // Manejar todos los eventos relevantes
        switch (event) {
          case 'INITIAL_SESSION':
            // Solo procesar si NO hemos inicializado desde getSession()
            if (!initialized) {
              console.log('🔄 [AuthContext] Processing INITIAL_SESSION event');
              setSession(session);
              setUser(session?.user ?? null);
              if (session?.user) {
                try {
                  console.log('🔄 [AuthContext] Fetching MindOp ID for INITIAL_SESSION');
                  await fetchUserMindOpId(session.user.id);
                } catch (mindOpError) {
                  console.error('❌ [AuthContext] Error fetching MindOp ID for INITIAL_SESSION:', mindOpError);
                  setUserMindOpId(null);
                }
              } else {
                setUserMindOpId(null);
              }
              setInitialized(true);
              setLoading(false);
              console.log('✅ [AuthContext] INITIAL_SESSION processed');
            } else {
              console.log('🔄 [AuthContext] Skipping INITIAL_SESSION - already initialized');
            }
            break;
            
          case 'SIGNED_IN':
            console.log('🔄 [AuthContext] Processing SIGNED_IN event');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
              try {
                console.log('🔄 [AuthContext] Fetching MindOp ID for SIGNED_IN');
                await fetchUserMindOpId(session.user.id);
              } catch (mindOpError) {
                console.error('❌ [AuthContext] Error fetching MindOp ID for SIGNED_IN:', mindOpError);
                setUserMindOpId(null);
              }
            }
            setLoading(false);
            console.log('✅ [AuthContext] SIGNED_IN processed');
            break;
            
          case 'SIGNED_OUT':
            console.log('🔄 [AuthContext] Processing SIGNED_OUT event');
            setSession(null);
            setUser(null);
            setUserMindOpId(null);
            setLoading(false);
            console.log('✅ [AuthContext] SIGNED_OUT processed');
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 [AuthContext] Processing TOKEN_REFRESHED event');
            // Actualizar sesión silenciosamente con autoRefreshToken: true
            setSession(session);
            setUser(session?.user ?? null);
            // No cambiar loading state para refreshes
            console.log('✅ [AuthContext] TOKEN_REFRESHED processed');
            break;
            
          case 'USER_UPDATED':
            console.log('🔄 [AuthContext] Processing USER_UPDATED event');
            // Actualizar info del usuario
            setSession(session);
            setUser(session?.user ?? null);
            console.log('✅ [AuthContext] USER_UPDATED processed');
            break;
        }
      }
    );

    // Timeout de seguridad para evitar loading infinito
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('🔄 [AuthContext] Auth initialization timeout, forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 segundos

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (result.error) {
        console.error('Sign in error:', result.error);
        await handleAuthError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      await handleAuthError(error);
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Error inesperado durante el inicio de sesión' } as any 
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, options?: SignUpOptions) => {
    try {
      setLoading(true);
      const result = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      return result;
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Error inesperado durante el registro' } as any 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear local state first
      setSession(null);
      setUser(null);
      setUserMindOpId(null);
      
      const result = await supabase.auth.signOut();
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if signOut fails, ensure local state is cleared
      setSession(null);
      setUser(null);
      setUserMindOpId(null);
      return { error: null };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Record<string, unknown>) => {
    setLoading(true);
    const result = await supabase.auth.updateUser({
      data: updates
    });
    setLoading(false);
    return { error: result.error };
  };  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    userMindOpId,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshUserMindOp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};