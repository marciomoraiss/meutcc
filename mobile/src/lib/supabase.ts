import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

import { mobileEnv } from '@/config/env';
import { secureSessionStorage } from '@/lib/secure-storage';

export const supabase = createClient(
  mobileEnv.supabaseUrl,
  mobileEnv.supabasePublishableKey,
  {
    auth: {
      storage: secureSessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
