import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { NetworkErrorHandler } from '@/utils/errorHandler';
import { toast } from '@/components/ui/use-toast';
import { getProfile, updateProfile as updateProfileService } from '@/services/profileService';
import { signUp as registerUser, signIn as loginUser, updateUserPassword as updatePasswordService } from '@/services/authService';
import { getImpersonationSession } from '@/services/adminService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
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

  const logout = useCallback(async (options = {}) => {
    const { navigate, showToast = false, message, description } = options;
    setLoading(true);
    try {
        const { error } = await supabase.auth.signOut();
        if (error && !NetworkErrorHandler.isIgnoredAuthError(error)) {
          console.warn("Error during logout, but will proceed:", error.message);
        }
    } catch (e) {
      console.warn("Exception during logout, but will proceed:", e.message);
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
            title: message || "Sesión Cerrada",
            description: description || "Has cerrado sesión correctamente.",
          });
        }
        if(navigate) {
            navigate('/login');
        }
    }
  }, []);

  const handleSessionError = useCallback(async (error) => {
      const isSessionError = error.message.includes('Session not found') || 
                             error.message.includes('Auth session not found!') ||
                             error.message.includes('JWT expired') ||
                             error.message.includes('invalid JWT');
      if (isSessionError) {
          console.warn('Session error detected, logging out:', error.message);
          await logout({ 
              showToast: true, 
              message: "Tu sesión ha expirado", 
              description: "Por favor, inicia sesión de nuevo."
          });
          return true;
      }
      return false;
  }, [logout]);


  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
        setProfile(null);
        setIsAdmin(false);
        return;
    };
    try {
      const userProfile = await getProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
        setIsAdmin(userProfile.user_type === 'admin' && !isImpersonating);
        if (userProfile.status === 'suspended' || userProfile.accountBlocked) {
            console.warn(`User account is suspended or blocked. Status: ${userProfile.status}, Blocked: ${userProfile.accountBlocked}`);
        }
      } else {
         setProfile(null);
         setIsAdmin(false);
      }
    } catch (error) {
      const sessionErrorHandled = await handleSessionError(error);
      if (!sessionErrorHandled) {
          NetworkErrorHandler.handleError(error, 'obtención de perfil de usuario');
      }
      setProfile(null);
      setIsAdmin(false);
    }
  }, [handleSessionError, isImpersonating]);
  
  const refreshProfile = useCallback(async () => {
    if(user?.id) {
        await fetchUserProfile(user.id);
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    const checkUserSession = async () => {
        setLoading(true);
        const storedAdminSession = localStorage.getItem('adminSession');
        if (storedAdminSession) {
          setAdminSession(JSON.parse(storedAdminSession));
          setIsImpersonating(true);
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error("Error getting session:", error.message);
            await handleSessionError(error);
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
            await fetchUserProfile(currentUser.id);
            if (storedAdminSession) {
              const adminSessionData = JSON.parse(storedAdminSession);
              if (currentUser.id !== adminSessionData.user.id) {
                setImpersonatedUser({ email: currentUser.email });
              } else {
                stopImpersonation();
              }
            }
        } else {
            setProfile(null);
            setIsAdmin(false);
        }
        setLoading(false);
    };

    checkUserSession();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
            if (event === 'PASSWORD_RECOVERY') {
            } else {
                await fetchUserProfile(currentUser.id);
            }
        } else {
            setProfile(null);
            setIsAdmin(false);
        }
        setLoading(false);
      }
    );

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
            const oldProfile = profile;
            const newProfile = payload.new;
            setProfile(newProfile);
            setIsAdmin(newProfile.user_type === 'admin' && !isImpersonating);

            if (oldProfile && oldProfile.verified !== newProfile.verified && newProfile.verified) {
              toast({
                title: "¡Cuenta Verificada! ✅",
                description: "Tu cuenta ha sido verificada. ¡Ya puedes usar todas las funciones!",
                className: "bg-green-500 text-white",
                duration: 6000,
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      authSubscription.unsubscribe();
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription).catch(err => console.error("Error removing profile channel", err));
      }
    };
  }, [fetchUserProfile, handleSessionError, isImpersonating]);
  
  const register = async (email, password, userData, invitationToken = null) => {
    setLoading(true);
    try {
      const { user } = await registerUser(email, password, userData, invitationToken);
      if (user) {
        toast({
          title: "Registro Exitoso",
          description: "Revisa tu email para confirmar tu cuenta.",
        });
        return { user };
      }
    } catch (error) {
      NetworkErrorHandler.handleError(error.originalError || error, 'registro');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      setUser(data.user);
      await fetchUserProfile(data.user.id);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const updatePassword = async (newPassword) => {
    setLoading(true);
    try {
      await updatePasswordService(newPassword);
      return true;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error("Usuario no autenticado");
    try {
      const updatedProfile = await updateProfileService(user.id, updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      throw error;
    }
  };

  const startImpersonation = async (userToImpersonate) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("La sesión de administrador no es válida.");

    localStorage.setItem('adminSession', JSON.stringify(session));
    setAdminSession(session);

    const newSessionData = await getImpersonationSession(userToImpersonate.id);
    
    const { error } = await supabase.auth.setSession({
      access_token: newSessionData.access_token,
      refresh_token: newSessionData.refresh_token,
    });

    if (error) {
      localStorage.removeItem('adminSession');
      setAdminSession(null);
      throw new Error("No se pudo establecer la sesión de suplantación.");
    }
    
    setIsImpersonating(true);
    setImpersonatedUser({ email: userToImpersonate.email });
    window.location.href = '/';
  };

  const stopImpersonation = async () => {
    const storedAdminSession = JSON.parse(localStorage.getItem('adminSession'));
    if (!storedAdminSession) {
      logout();
      return;
    }
    
    const { error } = await supabase.auth.setSession(storedAdminSession);
    localStorage.removeItem('adminSession');
    setIsImpersonating(false);
    setImpersonatedUser(null);
    setAdminSession(null);

    if (error) {
      console.error("Error restoring admin session, logging out.", error);
      logout();
    } else {
      window.location.href = '/admin';
    }
  };

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};