import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [adminSession, setAdminSession] = useState(null);

  /* ============================
     LOGOUT
     ============================ */
  const logout = useCallback(async (options = {}) => {
    const { navigate, showToast = false, message, description } = options;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('Error during logout:', error.message);
    } catch (e) {
      console.warn('Exception during logout:', e.message);
    } finally {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsImpersonating(false);
      setImpersonatedUser(null);
      localStorage.removeItem('adminSession');
      setLoading(false);
      if (showToast) {
        toast({
          title: message || 'Sesión cerrada',
          description: description || 'Has cerrado sesión correctamente.',
        });
      }
      if (navigate) navigate('/login');
    }
  }, []);

  /* ============================
     DETECCIÓN DE ERRORES DE SESIÓN
     ============================ */
  const handleSessionError = useCallback(
    async (error) => {
      if (!error?.message) return false;
      const isSessionError =
        error.message.includes('Session not found') ||
        error.message.includes('Auth session not found!') ||
        error.message.includes('JWT expired') ||
        error.message.includes('invalid JWT');

      if (isSessionError) {
        console.warn('Session error detected, logging out:', error.message);
        await logout({
          showToast: true,
          message: 'Tu sesión ha expirado',
          description: 'Por favor, inicia sesión de nuevo.',
        });
        return true;
      }
      return false;
    },
    [logout]
  );

  /* ============================
     PERFIL DE USUARIO
     ============================ */
  const fetchUserProfile = useCallback(
    async (userId) => {
      if (!userId) {
        setProfile(null);
        setIsAdmin(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (data) {
          setProfile(data);
          setIsAdmin(data.user_type === 'admin' && !isImpersonating);
          if (data.status === 'suspended' || data.accountBlocked) {
            console.warn(`Cuenta bloqueada o suspendida: ${data.status}`);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        const handled = await handleSessionError(error);
        if (!handled) console.error('Error al obtener perfil:', error.message);
        setProfile(null);
        setIsAdmin(false);
      }
    },
    [handleSessionError, isImpersonating]
  );

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchUserProfile(user.id);
  }, [user, fetchUserProfile]);

  /* ============================
     SESIÓN ACTUAL + SUSCRIPCIÓN
     ============================ */
  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      const storedAdminSession = localStorage.getItem('adminSession');
      if (storedAdminSession) {
        setAdminSession(JSON.parse(storedAdminSession));
        setIsImpersonating(true);
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) await handleSessionError(error);

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserProfile(currentUser.id);

        if (storedAdminSession) {
          const adminData = JSON.parse(storedAdminSession);
          if (currentUser.id !== adminData.user.id)
            setImpersonatedUser({ email: currentUser.email });
          else stopImpersonation();
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        if (event !== 'PASSWORD_RECOVERY') await fetchUserProfile(currentUser.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Suscripción realtime al perfil
    let profileSubscription = null;
    if (user?.id) {
      profileSubscription = supabase
        .channel(`profile-updates:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            const newProfile = payload.new;
            setProfile(newProfile);
            setIsAdmin(newProfile.user_type === 'admin' && !isImpersonating);

            if (profile && !profile.verified && newProfile.verified) {
              toast({
                title: '¡Cuenta verificada! ✅',
                description: 'Ya puedes usar todas las funciones.',
                className: 'bg-green-500 text-white',
                duration: 6000,
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (profileSubscription)
        supabase
          .removeChannel(profileSubscription)
          .catch((err) => console.error('Error removing profile channel', err));
    };
  }, [fetchUserProfile, handleSessionError, isImpersonating]);

  /* ============================
     REGISTRO / LOGIN / PERFIL / CONTRASEÑA
     ============================ */
  const register = async (email, password, userData = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: userData },
      });
      if (error) throw error;
      toast({
        title: 'Registro exitoso',
        description: 'Revisa tu email para confirmar tu cuenta.',
      });
      return data;
    } catch (error) {
      console.error('Error al registrar usuario:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUser(data.user);
      await fetchUserProfile(data.user.id);
      return data;
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Contraseña actualizada' });
      return true;
    } catch (error) {
      console.error('Error al actualizar contraseña:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Usuario no autenticado');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error actualizando perfil:', error.message);
      throw error;
    }
  };

  /* ============================
     IMPERSONACIÓN (ADMIN)
     ============================ */
  const startImpersonation = async (userToImpersonate) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('La sesión de administrador no es válida.');

    localStorage.setItem('adminSession', JSON.stringify(session));
    setAdminSession(session);

    // RPC o endpoint seguro que devuelva tokens de usuario impersonado
    const { data, error } = await supabase.rpc('admin_impersonate_user', { p_user_id: userToImpersonate.id });
    if (error) throw error;

    const { access_token, refresh_token } = data;
    const { error: setError } = await supabase.auth.setSession({ access_token, refresh_token });
    if (setError) {
      localStorage.removeItem('adminSession');
      setAdminSession(null);
      throw new Error('No se pudo establecer la sesión de suplantación.');
    }

    setIsImpersonating(true);
    setImpersonatedUser({ email: userToImpersonate.email });
    window.location.href = '/';
  };

  const stopImpersonation = async () => {
    const storedAdminSession = JSON.parse(localStorage.getItem('adminSession'));
    if (!storedAdminSession) return logout();

    const { error } = await supabase.auth.setSession(storedAdminSession);
    localStorage.removeItem('adminSession');
    setIsImpersonating(false);
    setImpersonatedUser(null);
    setAdminSession(null);

    if (error) {
      console.error('Error restaurando sesión de admin:', error.message);
      logout();
    } else {
      window.location.href = '/admin';
    }
  };

  /* ============================
     VALORES DEL CONTEXTO
     ============================ */
  const value = {
    user,
    profile,
    loading,
    isAdmin,
    register,
    login,
    logout,
    updateProfile,
    refreshProfile,
    updatePassword,
    handleSessionError,
    isImpersonating,
    impersonatedUser,
    startImpersonation,
    stopImpersonation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
