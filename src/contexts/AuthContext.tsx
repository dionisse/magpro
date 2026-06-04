import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, AdminModule } from '../lib/database.types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  allowedModules: AdminModule[] | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  canAccess: (module: AdminModule) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allowedModules, setAllowedModules] = useState<AdminModule[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => { await loadProfile(session.user.id); })();
      } else {
        setProfile(null);
        setAllowedModules(null);
        setLoading(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*, sections(id, name, color, section_permissions(module))')
      .eq('id', userId)
      .maybeSingle();

    type ProfileWithSection = Profile & {
      sections?: { section_permissions: { module: string }[] } | null;
    };
    const prof = data as ProfileWithSection | null;
    setProfile(prof);

    if (!prof) {
      setAllowedModules([]);
    } else if (prof.role === 'admin') {
      setAllowedModules(null); // null = unrestricted
    } else if (prof.section_id && prof.sections?.section_permissions) {
      setAllowedModules(prof.sections.section_permissions.map((p) => p.module as AdminModule));
    } else {
      setAllowedModules([]);
    }

    setLoading(false);
  }

  function canAccess(module: AdminModule): boolean {
    if (allowedModules === null) return true;
    return allowedModules.includes(module);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, fullName: string, phone: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName, phone, role: 'customer' });
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setAllowedModules(null);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, allowedModules, loading, signIn, signUp, signOut, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
