import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

export const authRedirectUrl = Linking.createURL('auth/callback');

export async function sendMagicLink(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { emailRedirectTo: authRedirectUrl, shouldCreateUser: true },
  });
  if (error) throw error;
}

function authParams(url: string) {
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const hash = url.includes('#') ? url.split('#')[1] : '';
  return new URLSearchParams([query, hash].filter(Boolean).join('&'));
}

export async function createSessionFromUrl(url: string) {
  const params = authParams(url);
  const errorDescription = params.get('error_description');
  if (errorDescription) throw new Error(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));

  const code = params.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) throw error;
  return data.session;
}
