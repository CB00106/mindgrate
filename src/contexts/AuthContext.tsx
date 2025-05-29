import React, { createContext, useEffect, useState } from 'react';
import { User, Session, AuthResponse, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';

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
  const [userMindOpId, setUserMindOpId] = useState<string | null>(null);

  // Function to fetch user's MindOp ID
  const fetchUserMindOpId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('mindops')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user MindOp:', error);
        setUserMindOpId(null);
        return;
      }

      setUserMindOpId(data?.id || null);
    } catch (error) {
      console.error('Error fetching user MindOp:', error);
      setUserMindOpId(null);
    }
  };

  // Function to refresh user's MindOp (callable from components)
  const refreshUserMindOp = async () => {
    if (user?.id) {
      await fetchUserMindOpId(user.id);
    }
  };  useEffect(() => {
    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear corrupted session data
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setUserMindOpId(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fetch user's MindOp ID if user is authenticated
          if (session?.user?.id) {
            await fetchUserMindOpId(session.user.id);
          }
        }
      } catch (error) {
        console.error('Unexpected error during session initialization:', error);
        // Clear all auth data in case of unexpected errors
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setUserMindOpId(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session ? 'session exists' : 'no session');
        
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Handle different auth events
          if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
            setUserMindOpId(null);
          } else if (session?.user?.id) {
            await fetchUserMindOpId(session.user.id);
          } else {
            setUserMindOpId(null);
          }
        } catch (error) {
          console.error('Error during auth state change:', error);
          // If there's an error, ensure we're logged out
          setSession(null);
          setUser(null);
          setUserMindOpId(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Clear any existing corrupted session first
      await supabase.auth.signOut();
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (result.error) {
        console.error('Sign in error:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Unexpected sign in error:', error);
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