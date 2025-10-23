import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import {
  getOrCreateWallet,
  addFunds as addFundsService,
} from '@/services/walletService';
import {
  linkMercadoPago as linkMercadoPagoService,
  unlinkMercadoPago as unlinkMercadoPagoService,
  setDefaultPaymentMethod as setDefaultPaymentMethodService,
} from '@/services/paymentMethodService';

const PaymentContext = createContext(null);

export const usePayment = () => {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayment debe usarse dentro de PaymentProvider');
  return ctx;
};

export const PaymentProvider = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [wallet, setWallet] = useState(null);
  const [walletHistory, setWalletHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);
  const [isMercadoPagoLinked, setIsMercadoPagoLinked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(true);

  /* ----------------------- 🧩 Reset de estados ----------------------- */
  const resetWalletState = useCallback(() => {
    setWallet(null);
    setWalletHistory([]);
    setPaymentMethods([]);
    setDefaultPaymentMethod(null);
    setIsMercadoPagoLinked(false);
    setLoadingWallet(false);
  }, []);

  /* ----------------------- 💰 Obtener billetera ----------------------- */
  const fetchWallet = useCallback(async () => {
    if (!user || !isOnline || !profile) {
      resetWalletState();
      return;
    }

    setLoadingWallet(true);
    try {
      const data = await getOrCreateWallet(user.id);
      if (!data) {
        resetWalletState();
        return;
      }

      setWallet(data.wallet);
      setWalletHistory(data.history || []);

      // Métodos disponibles
      const methods = [{ id: 'cash', type: 'cash', name: 'Efectivo' }];

      if (data.wallet) {
        methods.push({
          id: 'wallet',
          type: 'wallet',
          name: 'Billetera',
          balance: data.wallet.balance,
        });
      }

      const mpLinked = !!profile?.mp_linked_at;
      setIsMercadoPagoLinked(mpLinked);
      if (mpLinked) {
        methods.push({ id: 'mercadopago', type: 'mercadopago', name: 'MercadoPago' });
      }

      setPaymentMethods(methods);

      const currentDefault =
        methods.find((m) => m.id === profile.default_payment_method) || methods[0];
      setDefaultPaymentMethod(currentDefault);
    } catch (err) {
      console.error('Error cargando billetera:', err);
      toast({
        title: 'Error',
        description: 'No se pudo cargar tu billetera.',
        variant: 'destructive',
      });
      resetWalletState();
    } finally {
      setLoadingWallet(false);
    }
  }, [user, profile, isOnline, resetWalletState]);

  useEffect(() => {
    if (user && profile) fetchWallet();
    else resetWalletState();
  }, [user, profile, fetchWallet, resetWalletState]);

  /* ----------------------- 🔁 Suscripción realtime ----------------------- */
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`wallet-updates:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_history',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          toast({
            title: 'Nuevo movimiento',
            description: 'Tu billetera ha sido actualizada.',
          });
          fetchWallet();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchWallet()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchWallet]);

  /* ----------------------- ➕ Recargar fondos ----------------------- */
  const addFundsToWallet = async (amount, type, reason, referenceId = null) => {
    if (!user || !wallet) {
      toast({
        title: 'Error',
        description: 'Usuario o billetera no encontrados.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await addFundsService({ userId: user.id, amount, reason, type, referenceId });
      toast({
        title: 'Recarga exitosa',
        description: `Se agregaron ${formatCurrencyARS(amount)} a tu billetera.`,
      });
      await fetchWallet();
    } catch (err) {
      console.error('Error al recargar billetera:', err);
      toast({
        title: 'Error',
        description: 'No se pudo realizar la recarga.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------- ⭐ Establecer método predeterminado ----------------------- */
  const setAsDefault = async (methodId) => {
    if (!user) return;
    setLoading(true);
    try {
      await setDefaultPaymentMethodService(user.id, methodId);
      await refreshProfile();
      const method = paymentMethods.find((m) => m.id === methodId);
      toast({
        title: 'Método actualizado',
        description: `${method?.name || 'El método'} ahora es tu opción principal.`,
      });
    } catch (err) {
      console.error('Error estableciendo método predeterminado:', err);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el método de pago.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------- 🔗 Vincular / Desvincular MP ----------------------- */
  const linkMercadoPago = async () => {
    setLoading(true);
    try {
      const authUrl = await linkMercadoPagoService();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error vinculando MercadoPago:', err);
      toast({
        title: 'Error',
        description: 'No se pudo vincular con MercadoPago.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const unlinkMercadoPago = async () => {
    setLoading(true);
    try {
      await unlinkMercadoPagoService();
      await refreshProfile();
      toast({
        title: 'Cuenta desvinculada',
        description: 'Tu cuenta de MercadoPago fue desvinculada.',
        variant: 'default',
      });
    } catch (err) {
      console.error('Error desvinculando MercadoPago:', err);
      toast({
        title: 'Error',
        description: 'No se pudo desvincular tu cuenta de MercadoPago.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------- 🧩 Contexto expuesto ----------------------- */
  const value = {
    loading: loading || loadingWallet,
    wallet,
    walletHistory,
    paymentMethods,
    defaultPaymentMethod,
    isMercadoPagoLinked,
    addFundsToWallet,
    fetchWalletData: fetchWallet,
    setAsDefault,
    linkMercadoPago,
    unlinkMercadoPago,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};
