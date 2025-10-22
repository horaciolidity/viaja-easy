import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const globalForSupabase = globalThis;

const supabase =
  globalForSupabase.supabase ||
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: 'supabase.auth.token',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

if (import.meta.env.DEV) {
  globalForSupabase.supabase = supabase;
}

export { supabase };