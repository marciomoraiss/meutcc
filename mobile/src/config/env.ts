const required = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
};

export const mobileEnv = {
  get supabaseUrl() { return required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL); },
  get supabasePublishableKey() { return required('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY); },
  get apiUrl() { return required('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL); },
};
