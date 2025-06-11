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
  // Temporary placeholder for userMindOpId to fix build error
  const userMindOpId = null;

  useEffect(() => {
    let mounted = true;
    let isProcessingAuth = false;

    // SINGLE SOURCE OF TRUTH: Use only onAuthStateChange for all auth state management
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Prevent concurrent auth processing
        if (isProcessingAuth) {
          console.log(`🔄 [AuthContext] Already processing auth, skipping ${event}`);
          return;
        }
        
        isProcessingAuth = true;

        console.log(`🔄 [AuthContext] Auth event: ${event}`, { 
          hasSession: !!session, 
          hasUser: !!session?.user 
        });
        
        try {
          // Handle all auth events in a unified way
          switch (event) {
            case 'INITIAL_SESSION':
              console.log('🔄 [AuthContext] Processing INITIAL_SESSION event');
              handleAuthState(session, 'INITIAL_SESSION');
              break;
              
            case 'SIGNED_IN':
              console.log('🔄 [AuthContext] Processing SIGNED_IN event');
              handleAuthState(session, 'SIGNED_IN');
              break;
              
            case 'SIGNED_OUT':
              console.log('🔄 [AuthContext] Processing SIGNED_OUT event');
              handleSignOut();
              break;
              
            case 'TOKEN_REFRESHED':
              console.log('🔄 [AuthContext] Processing TOKEN_REFRESHED event');
              // For token refresh, just update session without additional processing
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
    const handleAuthState = (session: Session | null, eventType: string) => {
      if (!mounted) return;
      
      try {
        // Update basic auth state
        setSession(session);
        setUser(session?.user ?? null);
        
        // Mark initialization complete
        setInitialized(true);
        setLoading(false);
        
        console.log(`✅ [AuthContext] ${eventType} processing completed`, {
          hasUser: !!session?.user,
          userId: session?.user?.id
        });
      } catch (error) {
        console.error(`❌ [AuthContext] Error in handleAuthState for ${eventType}:`, error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    // Sign out handler
    const handleSignOut = () => {
      if (!mounted) return;
      
      setSession(null);
      setUser(null);
      setInitialized(true);
      setLoading(false);
      
      console.log('✅ [AuthContext] SIGNED_OUT processed');
    };

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading && !initialized) {
        console.warn('⚠️ [AuthContext] Auth initialization timeout, forcing loading to false');
        setInitialized(true);
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => {
      mounted = false;
      isProcessingAuth = false;
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
        console.error('❌ [AuthContext] Sign in error:', result.error);
        await handleAuthError(result.error);
      } else {
        console.log('✅ [AuthContext] Sign in successful');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [AuthContext] Unexpected sign in error:', error);
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
      
      if (result.error) {
        console.error('❌ [AuthContext] Sign up error:', result.error);
      } else {
        console.log('✅ [AuthContext] Sign up successful');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [AuthContext] Unexpected sign up error:', error);
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
      console.log('🔄 [AuthContext] Starting sign out process');
      
      const result = await supabase.auth.signOut();
      
      if (result.error) {
        console.error('❌ [AuthContext] Sign out error:', result.error);
      } else {
        console.log('✅ [AuthContext] Sign out successful');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [AuthContext] Unexpected sign out error:', error);
      setLoading(false);
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Record<string, unknown>) => {
    try {
      setLoading(true);
      console.log('🔄 [AuthContext] Updating user profile');
      
      const result = await supabase.auth.updateUser({
        data: updates
      });
      
      if (result.error) {
        console.error('❌ [AuthContext] Update profile error:', result.error);
      } else {
        console.log('✅ [AuthContext] Profile updated successfully');
      }
      
      return { error: result.error };
    } catch (error) {
      console.error('❌ [AuthContext] Unexpected update profile error:', error);
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};