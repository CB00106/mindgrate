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
        const query = supabase
        .from('mindops')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      // Note: Supabase client doesn't support AbortSignal directly on queries
      // The AbortController is managed at the component level
      const { data, error } = await query;

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
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🔄 [AuthContext] MindOp fetch aborted');
        return;
      }
      console.error('❌ [AuthContext] Unexpected error fetching user MindOp:', error);
      setUserMindOpId(null);
    }
  };

  // Function to refresh user's MindOp (callable from components)
  const refreshUserMindOp = async () => {
    if (user?.id) {
      await fetchUserMindOpId(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let isProcessingAuth = false;
    let mindOpAbortController: AbortController | null = null;

    // SINGLE SOURCE OF TRUTH: Use only onAuthStateChange for all auth state management
    // This eliminates the race condition between getSession() and INITIAL_SESSION event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Prevent concurrent auth processing
        if (isProcessingAuth) {
          console.log(`🔄 [AuthContext] Already processing auth, skipping ${event}`);
          return;
        }
        
        isProcessingAuth = true;

        // Abort any ongoing MindOp fetch
        if (mindOpAbortController) {
          mindOpAbortController.abort();
        }

        console.log(`🔄 [AuthContext] Auth event: ${event}`, { hasSession: !!session, hasUser: !!session?.user });
        
        try {
          // Handle all auth events in a unified way
          switch (event) {
            case 'INITIAL_SESSION':
              console.log('🔄 [AuthContext] Processing INITIAL_SESSION event');
              await handleAuthState(session, 'INITIAL_SESSION');
              break;
              
            case 'SIGNED_IN':
              console.log('🔄 [AuthContext] Processing SIGNED_IN event');
              await handleAuthState(session, 'SIGNED_IN');
              break;
              
            case 'SIGNED_OUT':
              console.log('🔄 [AuthContext] Processing SIGNED_OUT event');
              handleSignOut();
              break;
              
            case 'TOKEN_REFRESHED':
              console.log('🔄 [AuthContext] Processing TOKEN_REFRESHED event');
              // For token refresh, just update session without fetching MindOp again
              if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
              }
              console.log('✅ [AuthContext] TOKEN_REFRESHED processed');
              break;
              
            case 'USER_UPDATED':
              console.log('🔄 [AuthContext] Processing USER_UPDATED event');
              if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
              }
              console.log('✅ [AuthContext] USER_UPDATED processed');
              break;
          }
        } catch (error) {
          console.error(`❌ [AuthContext] Error processing ${event}:`, error);
          if (mounted) {
            setInitialized(true);
            setLoading(false);
          }
        } finally {
          isProcessingAuth = false;
        }
      }
    );

    // Unified auth state handler
    const handleAuthState = async (session: Session | null, eventType: string) => {
      if (!mounted) return;
      
      try {
        // Update basic auth state
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch MindOp ID if user exists
        if (session?.user) {
          console.log(`🔄 [AuthContext] Fetching MindOp ID for ${eventType}`);
          
          // Create new abort controller for this fetch
          mindOpAbortController = new AbortController();
            try {
            await fetchUserMindOpId(session.user.id);
            console.log(`✅ [AuthContext] MindOp ID fetched successfully for ${eventType}`);
          } catch (mindOpError: any) {
            if (mindOpError.name !== 'AbortError') {
              console.error(`❌ [AuthContext] Error fetching MindOp ID for ${eventType}:`, mindOpError);
              setUserMindOpId(null);
            }
          }
        } else {
          console.log(`🔄 [AuthContext] No user in ${eventType}, setting MindOp ID to null`);
          setUserMindOpId(null);
        }
        
        // Mark initialization complete
        setInitialized(true);
        setLoading(false);
        console.log(`✅ [AuthContext] ${eventType} processing completed`);
      } catch (error) {
        console.error(`❌ [AuthContext] Error in handleAuthState for ${eventType}:`, error);
        if (mounted) {
          setUserMindOpId(null);
          setInitialized(true);
          setLoading(false);
        }
      }
    };    // Sign out handler
    const handleSignOut = () => {
      if (!mounted) return;
      
      // Abort any ongoing MindOp fetch
      if (mindOpAbortController) {
        mindOpAbortController.abort();
        mindOpAbortController = null;
      }
      
      setSession(null);
      setUser(null);
      setUserMindOpId(null);
      
      // ✨ SOLUCIÓN 2: Marca la autenticación como inicializada y finaliza la carga
      setInitialized(true);
      setLoading(false);
      
      console.log('✅ [AuthContext] SIGNED_OUT processed');
    };

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading && !initialized) {
        console.warn('🔄 [AuthContext] Auth initialization timeout, forcing loading to false');
        setInitialized(true);
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => {
      mounted = false;
      isProcessingAuth = false;
      
      // Abort any ongoing MindOp fetch
      if (mindOpAbortController) {
        mindOpAbortController.abort();
      }
      
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
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
      // ✨ SOLUCIÓN 1: signOut solo invoca a Supabase
      // No gestiones el estado aquí. Solo llama a Supabase.
      // El listener onAuthStateChange se encargará de actualizar el estado.
      setLoading(true);
      const result = await supabase.auth.signOut();
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      setLoading(false);
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Record<string, unknown>) => {
    setLoading(true);
    const result = await supabase.auth.updateUser({
      data: updates
    });
    setLoading(false);
    return { error: result.error };
  };

  const value: AuthContextType = {
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
