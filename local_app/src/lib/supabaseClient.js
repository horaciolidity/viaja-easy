import { createClient } from '@supabase/supabase-js';

// Variables de entorno (definidas en tu .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Protección: evita inicialización sin credenciales
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Missing Supabase environment variables');
}

// Crear cliente global
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,      // Guarda la sesión en localStorage
    autoRefreshToken: true,    // Refresca el token automáticamente
    detectSessionInUrl: true,  // Detecta logins via magic link
    flowType: 'pkce',          // Método seguro compatible con navegadores
  },
  global: {
    headers: {
      'X-Client-Info': 'viajafacil-web/1.0.0', // útil para logs y auditoría
    },
  },
});
