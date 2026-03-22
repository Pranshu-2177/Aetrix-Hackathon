import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export type UserRole = 'patient' | 'asha' | 'admin';

type AuthResult = {
  error?: string;
  needsEmailConfirmation?: boolean;
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, role: UserRole) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  setRole: (role: UserRole) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) {
        return { error: 'Supabase is not configured on this site.' };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    signUp: async (email, password, role) => {
      if (!supabase) {
        return { error: 'Supabase is not configured on this site.' };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });
      if (error) {
        return { error: error.message };
      }
      return { needsEmailConfirmation: !data.session };
    },
    signOut: async () => {
      if (!supabase) {
        return;
      }
      await supabase.auth.signOut();
    },
    setRole: async (role) => {
      if (!supabase) {
        return { error: 'Supabase is not configured on this site.' };
      }
      const { error } = await supabase.auth.updateUser({ data: { role } });
      return error ? { error: error.message } : {};
    },
  }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
