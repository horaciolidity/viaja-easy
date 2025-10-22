import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import { formatCurrencyARS } from '@/utils/mercadoPago';
    import { getOrCreateWallet, addFunds as addFundsService } from '@/services/walletService';
    import { linkMercadoPago as linkMercadoPagoService, unlinkMercadoPago as unlinkMercadoPagoService, setDefaultPaymentMethod as setDefaultPaymentMethodService } from '@/services/paymentMethodService';
    import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

    const PaymentContext = createContext();

    export const usePayment = () => {
      const context = useContext(PaymentContext);
      if (!context) {
        throw new Error('usePayment debe usarse dentro de PaymentContext');
      }
      return context;
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

      const fetchWallet = useCallback(async () => {
        if (!user || !isOnline || !profile) {
          setLoadingWallet(false);
          return;
        }
        setLoadingWallet(true);
        try {
          const data = await getOrCreateWallet(user.id);
          if (data) {
            setWallet(data.wallet);
            setWalletHistory(data.history || []);
            
            const methods = [{ id: 'cash', type: 'cash', name: 'Efectivo' }];
            if (data.wallet) {
                methods.push({ id: 'wallet', type: 'wallet', name: 'Billetera', balance: data.wallet.balance });
            }
            
            const mpLinked = !!profile?.mp_linked_at;
            setIsMercadoPagoLinked(mpLinked);
            if (mpLinked) {
                methods.push({ id: 'mercadopago', type: 'mercadopago', name: 'MercadoPago' });
            }
            setPaymentMethods(methods);
            
            const currentDefault = methods.find(m => m.id === profile.default_payment_method) || methods[0];
            setDefaultPaymentMethod(currentDefault);

          } else {
            setWallet(null);
            setWalletHistory([]);
            setPaymentMethods([]);
            setDefaultPaymentMethod(null);
          }
        } catch (error) {
          if (!NetworkErrorHandler.isAuthError(error)) {
            NetworkErrorHandler.handleError(error, 'búsqueda de billetera');
          }
          setWallet(null);
          setWalletHistory([]);
          setPaymentMethods([]);
          setDefaultPaymentMethod(null);
        } finally {
          setLoadingWallet(false);
        }
      }, [user, isOnline, profile]);

      useEffect(() => {
        if (user && profile) {
          fetchWallet();
        } else {
          setWallet(null);
          setWalletHistory([]);
          setPaymentMethods([]);
          setDefaultPaymentMethod(null);
          setLoadingWallet(false);
        }
      }, [user, profile, fetchWallet]);

      useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
          .channel(`wallet-history-updates-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'wallet_history',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              toast({ title: "Nuevo movimiento", description: "Tu billetera ha sido actualizada." });
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
            (payload) => {
              fetchWallet();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }, [user?.id, fetchWallet]);

      const addFundsToWallet = async (amount, type, reason, referenceId = null) => {
        if (!user || !wallet) {
          toast({ title: "Error", description: "Usuario o billetera no encontrados.", variant: "destructive" });
          return;
        }
        setLoading(true);
        try {
          await addFundsService({userId: user.id, amount, reason, type, referenceId});
          toast({ title: "Recarga Exitosa", description: `Se agregaron ${formatCurrencyARS(amount)} a tu billetera.` });
          await fetchWallet();
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'recarga de fondos');
        } finally {
          setLoading(false);
        }
      };

      const setAsDefault = async (methodId) => {
        if (!user) return;
        setLoading(true);
        try {
          await setDefaultPaymentMethodService(user.id, methodId);
          await refreshProfile(); // Esto recargará el perfil y disparará el fetchWallet
          const method = paymentMethods.find(m => m.id === methodId);
          toast({ title: 'Predeterminado', description: `${method?.name || 'El método'} ahora es tu método de pago principal.` });
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'establecimiento de método de pago predeterminado');
        } finally {
          setLoading(false);
        }
      };

      const linkMercadoPago = async () => {
        setLoading(true);
        try {
          const authUrl = await linkMercadoPagoService();
          window.top.location.href = authUrl;
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'vinculación con MercadoPago');
          setLoading(false);
        }
      };

      const unlinkMercadoPago = async () => {
        setLoading(true);
        try {
          await unlinkMercadoPagoService();
          await refreshProfile();
          toast({ title: 'Cuenta desvinculada', description: 'Tu cuenta de MercadoPago ha sido desvinculada.', variant: 'destructive' });
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'desvinculación de MercadoPago');
        } finally {
          setLoading(false);
        }
      };

      const value = {
        loading: loading || loadingWallet,
        wallet,
        walletHistory,
        loadingWallet,
        addFundsToWallet,
        fetchWalletData: fetchWallet,
        paymentMethods,
        defaultPaymentMethod,
        setAsDefault,
        linkMercadoPago,
        unlinkMercadoPago,
        isMercadoPagoLinked,
      };

      return (
        <PaymentContext.Provider value={value}>
          {children}
        </PaymentContext.Provider>
      );
    };