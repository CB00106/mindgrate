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
  };
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch user's MindOp ID if user is authenticated
      if (session?.user?.id) {
        await fetchUserMindOpId(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user's MindOp ID if user is authenticated
        if (session?.user?.id) {
          await fetchUserMindOpId(session.user.id);
        } else {
          setUserMindOpId(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return result;
  };
  const signUp = async (email: string, password: string, options?: SignUpOptions) => {
    setLoading(true);
    const result = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    setLoading(false);
    return result;
  };  const signOut = async () => {
    setLoading(true);
    const result = await supabase.auth.signOut();
    setLoading(false);
    return result;
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