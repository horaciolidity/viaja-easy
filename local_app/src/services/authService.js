import { supabase } from '@/lib/customSupabaseClient';

    export const signUp = async (userData) => {
      const { email, password, ...metaData } = userData;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metaData,
        },
      });
      if (error) throw error;
      return data;
    };

    export const signIn = async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    };

    export const signOut = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    };

    export const requestPasswordReset = async (email) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return data;
    };

    export const updateUserPassword = async (newPassword) => {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    };

    export const resendVerification = async (email) => {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      return data;
    };

    export const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    };

    export const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    };

    export const onAuthStateChange = (callback) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      return subscription;
    };

    export const signInWithGoogle = async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    };

    export const signInWithFacebook = async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    };

    export const verifyOtp = async (email, token) => {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;
      return data;
    };

    export const inviteUsersInBulk = async (emails, role, inviterId) => {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { emails, role, inviterId },
      });

      if (error) {
        const errorContext = error.context || {};
        const jsonError = typeof errorContext.json === 'function' ? await errorContext.json().catch(() => null) : errorContext.json;
        const details = jsonError?.details || { successful: [], failed: emails.map(e => ({ email: e, reason: jsonError?.message || error.message })) };
        
        const customError = new Error(jsonError?.message || error.message);
        customError.details = details;
        throw customError;
      }

      return data;
    };