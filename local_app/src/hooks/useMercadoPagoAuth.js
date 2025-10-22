import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useMercadoPagoAuth = () => {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLinked(!!profile?.mp_linked_at);
  }, [profile]);

  const beginLinking = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-auth', {
        body: JSON.stringify({ 
          action: 'get-auth-url'
        }),
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No se pudo obtener la URL de autorización de Mercado Pago.');
      }
    } catch (error) {
      console.error('Error al iniciar la vinculación con Mercado Pago:', error);
      setError(error.message);
      toast({
        title: 'Error de Vinculación',
        description: error.message || 'No se pudo iniciar el proceso de vinculación. Por favor, intentá de nuevo.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const completeLinking = useCallback(async (code, state) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-auth', {
        body: JSON.stringify({
          action: 'exchange-code',
          code,
          state,
        }),
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);
      
      await refreshProfile();
      setLoading(false);
      return { success: true };

    } catch (error) {
      console.error('Error al completar la vinculación con Mercado Pago:', error);
      const errorMessage = error.message || 'Ocurrió un error desconocido.';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, [refreshProfile]);
  
  const unlinkAccount = async () => {
    if (!window.confirm('¿Estás seguro de que querés desvincular tu cuenta de Mercado Pago?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-auth', {
        body: JSON.stringify({ action: 'unlink-account' }),
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      toast({
        title: 'Cuenta Desvinculada',
        description: 'Tu cuenta de Mercado Pago ha sido desvinculada exitosamente.',
      });
      await refreshProfile();
    } catch (error) {
      console.error('Error al desvincular la cuenta:', error);
      const errorMessage = error.message || 'No se pudo desvincular la cuenta. Intentá de nuevo.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, isLinked, error, beginLinking, completeLinking, unlinkAccount };
};