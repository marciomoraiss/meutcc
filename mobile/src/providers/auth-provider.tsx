import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { createSessionFromUrl, sendMagicLink } from '@/services/auth';
import { meutccRequest } from '@/services/meutcc-api';
import { supabase } from '@/lib/supabase';
import type { MeutccPayload } from '@/types/mvp';

type AuthContextValue = {
  session: Session | null;
  data: MeutccPayload | null;
  booting: boolean;
  refreshing: boolean;
  callbackError: string | null;
  dataError: string | null;
  requestMagicLink: (email: string) => Promise<void>;
  refresh: () => Promise<MeutccPayload | null>;
  joinCohort: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<MeutccPayload | null>(null);
  const [booting, setBooting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const handledUrls = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    if (!session?.access_token) return null;
    setRefreshing(true);
    setDataError(null);
    try {
      const payload = await meutccRequest<MeutccPayload>('/api/mvp', session.access_token);
      setData(payload);
      return payload;
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Não foi possível carregar seus dados.');
      return null;
    } finally {
      setRefreshing(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: result }) => {
      if (!mounted) return;
      setSession(result.session);
      setBooting(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setData(null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (session) void refresh();
  }, [session, refresh]);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || handledUrls.current.has(url)) return;
      handledUrls.current.add(url);
      setCallbackError(null);
      try { await createSessionFromUrl(url); }
      catch (error) { setCallbackError(error instanceof Error ? error.message : 'Não foi possível concluir o acesso.'); }
    };
    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => { void handleUrl(url); });
    return () => subscription.remove();
  }, []);

  const joinCohort = useCallback(async (code: string) => {
    if (!session?.access_token) throw new Error('Sessão expirada. Entre novamente.');
    setRefreshing(true);
    try {
      const payload = await meutccRequest<MeutccPayload>('/api/mvp', session.access_token, {
        method: 'POST', body: { action: 'join', code: code.trim() },
      });
      setData(payload);
      setDataError(null);
    } finally { setRefreshing(false); }
  }, [session?.access_token]);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);
  const value = useMemo(() => ({
    session, data, booting, refreshing, callbackError, dataError,
    requestMagicLink: sendMagicLink, refresh, joinCohort, signOut,
  }), [session, data, booting, refreshing, callbackError, dataError, refresh, joinCohort, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
