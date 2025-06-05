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
  const [userMindOpId, setUserMindOpId] = useState<string | null>(null);  // Function to fetch user's MindOp ID
  const fetchUserMindOpId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('mindops')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user doesn't have a MindOp yet
          setUserMindOpId(null);
        } else {
          console.error('Error fetching user MindOp:', error);
          setUserMindOpId(null);
        }
        return;
      }

      setUserMindOpId(data?.id || null);
    } catch (error) {
      console.error('Unexpected error fetching user MindOp:', error);
      setUserMindOpId(null);
    }
  };

  // Function to refresh user's MindOp (callable from components)
  const refreshUserMindOp = async () => {
    if (user?.id) {
      await fetchUserMindOpId(user.id);
    }
  };  useEffect(() => {
    // Get initial session - optimized for autoRefreshToken: false
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Only clear user if there's an actual error, not during loading
          setSession(null);
          setUser(null);
          setUserMindOpId(null);
        } else {
          // Con autoRefreshToken: false, confiamos en la sesión guardada
          setSession(session);
          
          // CRITICAL: Only update user if we actually have a different state
          if (session?.user) {
            setUser(session.user);
            
            // Fetch user's MindOp ID if user is authenticated
            try {
              await fetchUserMindOpId(session.user.id);
            } catch (mindOpError) {
              console.error('Error fetching MindOp ID during initialization:', mindOpError);
              setUserMindOpId(null);
            }
          } else if (!session) {
            // Only clear user when we're certain there's no session
            setUser(null);
            setUserMindOpId(null);
          }
          // If session is null but we had a user, keep the user during verification
        }
      } catch (error) {
        console.error('Unexpected error during session initialization:', error);
        // Only clear states on actual errors, not during normal loading
        setSession(null);
        setUser(null);
        setUserMindOpId(null);
      } finally {
        // CRITICAL: Always set loading to false after initial check
        setLoading(false);
      }
    };    // Setup auth state change listener - optimized for fewer events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔄 [AuthContext] Auth event: ${event}`);
        
        // Con autoRefreshToken: false, solo escuchamos eventos importantes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          try {
            setSession(session);
            
            // Handle different auth events with conservative user state management
            if (event === 'SIGNED_OUT') {
              setUser(null);
              setUserMindOpId(null);
            } else if (event === 'SIGNED_IN' && session?.user) {
              // Definitely signed in - update user
              setUser(session.user);
              try {
                await fetchUserMindOpId(session.user.id);
              } catch (mindOpError) {
                console.error(`Error fetching MindOp ID for event ${event}:`, mindOpError);
                setUserMindOpId(null);
              }
            } else if (event === 'INITIAL_SESSION') {
              // Be conservative with INITIAL_SESSION - only update if we have clear state
              if (session?.user) {
                setUser(session.user);
                try {
                  await fetchUserMindOpId(session.user.id);
                } catch (mindOpError) {
                  console.error(`Error fetching MindOp ID for event ${event}:`, mindOpError);
                  setUserMindOpId(null);
                }
              } else if (!session) {
                // Only clear user if we're certain there's no session
                setUser(null);
                setUserMindOpId(null);
              }
              // If session exists but no user, keep existing user state during verification
            }
          } catch (error) {
            console.error('Error during auth state change processing:', error);
            // Only clear states on actual errors, not during normal processing
            if (event === 'SIGNED_OUT') {
              setSession(null);
              setUser(null);
              setUserMindOpId(null);
            }
          } finally {
            // CRITICAL FIX: Always ensure loading is false after any auth event
            setLoading(false);
          }
        }
        // Ignoramos TOKEN_REFRESHED ya que autoRefreshToken está deshabilitado
      }
    );

    // Start the initial session fetch
    getInitialSession();

    // SAFETY NET: Force loading to false after 10 seconds to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 10000);

    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);  const signIn = async (email: string, password: string) => {
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
  };
  const value: AuthContextType = {
    user,
    session,
    loading,
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