import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------- 🔐 Manejo de sesión ---------------------- */
  const handleSession = useCallback((session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  /* ---------------------- 🧭 Inicialización ---------------------- */
  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      handleSession(data?.session ?? null);
    };
    initAuth();

    // Escucha cambios en la sesión (login, logout, refresh, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, [handleSession]);

  /* ---------------------- ✉️ Registro ---------------------- */
  const signUp = useCallback(
    async (email, password, options = {}) => {
      const { error } = await supabase.auth.signUp({ email, password, options });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error al registrarte',
          description: error.message || 'Ocurrió un problema durante el registro.',
        });
      } else {
        toast({
          title: 'Registro exitoso',
          description: 'Revisa tu correo electrónico para confirmar tu cuenta.',
        });
      }
      return { error };
    },
    [toast]
  );

  /* ---------------------- 🔑 Inicio de sesión ---------------------- */
  const signIn = useCallback(
    async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error al iniciar sesión',
          description: error.message || 'Verifica tus credenciales e intenta nuevamente.',
        });
      }
      return { error };
    },
    [toast]
  );

  /* ---------------------- 🚪 Cerrar sesión ---------------------- */
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error al cerrar sesión',
        description: error.message || 'Intenta nuevamente más tarde.',
      });
    }
    return { error };
  }, [toast]);

  /* ---------------------- 📦 Valor del contexto ---------------------- */
  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
    }),
    [user, session, loading, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ---------------------- 🧩 Hook de acceso ---------------------- */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
