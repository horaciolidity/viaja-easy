// src/pages/MercadoPagoCallbackPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMercadoPagoAuth } from '@/hooks/useMercadoPagoAuth';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';

const isApprovedStatus = (s) =>
  ['approved', 'accredited', 'succeeded', 'authorized'].includes(String(s || '').toLowerCase());
const norm = (s) => String(s || '').toLowerCase();
const isDeliveryRef = (r) => (r || '').startsWith('DEL-');
const isRideRef = (r) =>
  (r || '').startsWith('RIDE-') || (r || '').startsWith('ride_') || (r || '').startsWith('ride_mixpay_');
const isRechargeRef = (r) => norm(r).startsWith('recharge-');

const MercadoPagoCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ran = useRef(false);        // evita doble ejecución del effect en StrictMode
  const navigated = useRef(false);  // evita dobles navegaciones en callbacks async

  const { user, profile } = useAuth();
  const { completeLinking } = useMercadoPagoAuth();
  const { fetchWalletData } = usePayment();

  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Procesando la operación...');

  const safeNavigate = (path) => {
    if (navigated.current) return;
    navigated.current = true;
    navigate(path);
  };

  useEffect(() => {
    if (ran.current) return; // evita doble ejecución por StrictMode
    ran.current = true;

    const params = new URLSearchParams(location.search);

    const code = params.get('code');
    const state = params.get('state');

    // Mercado Pago puede usar distintos nombres
    const paymentStatus = params.get('status') || params.get('collection_status') || 'null';
    const externalRef = params.get('external_reference');
    const paymentId = params.get('payment_id') || params.get('collection_id');

    if (code && state) {
      setMessage('Procesando la vinculación de tu cuenta...');
      handleAuthCallback(code, state);
      return;
    }

    if (externalRef) {
      setMessage('Procesando el resultado del pago...');
      handlePaymentCallback(paymentStatus, externalRef, paymentId);
      return;
    }

    setStatus('error');
    setMessage('Faltan parámetros en la URL para procesar la solicitud.');
    toast({ title: 'Error', description: 'URL de callback inválida.', variant: 'destructive' });
    setTimeout(() => safeNavigate(`/${profile?.user_type || 'passenger'}`), 3000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleAuthCallback = async (code, state) => {
    if (!user) {
      setStatus('error');
      setMessage('Debes iniciar sesión para vincular tu cuenta.');
      return;
    }
    if (user.id !== state) {
      setStatus('error');
      setMessage('Error de seguridad. El estado no coincide. No se puede continuar.');
      toast({
        title: 'Error de Seguridad',
        description: 'La solicitud de vinculación no es válida.',
        variant: 'destructive',
      });
      return;
    }

    const result = await completeLinking(code, state);

    if (result.success) {
      setStatus('success');
      setMessage('¡Cuenta vinculada con éxito! Serás redirigido en un momento.');
      toast({ title: '¡Todo listo!', description: 'Tu cuenta de Mercado Pago se vinculó correctamente.' });
    } else {
      setStatus('error');
      setMessage(result.error || 'No se pudo completar la vinculación. Por favor, intentá de nuevo.');
      toast({ title: 'Error de Vinculación', description: result.error, variant: 'destructive' });
    }
    setTimeout(() => safeNavigate(`/${profile?.user_type || 'passenger'}/payment-methods`), 2500);
  };

  const handlePaymentCallback = async (paymentStatusRaw, externalRef, paymentId) => {
    const statusNorm = norm(paymentStatusRaw);

    try {
      // Envíos — finalize en callback
      if (isDeliveryRef(externalRef)) {
        const { data, error } = await supabase.rpc('finalize_mixed_payment_delivery', {
          p_reference_id: externalRef,
          p_payment_id: paymentId,
          p_mp_status: statusNorm,
        });

        if (error) throw new Error(error.message);

        if (data?.success) {
          setStatus('success');
          setMessage('¡Pago aprobado! Envío creado, buscando conductor…');
          const id = data.delivery_id;
          toast({ title: 'Pago aprobado', description: '¡Envío creado!' });
          safeNavigate(`/tracking/package/${id}`);
          return;
        }

        // cancelado/rechazado/null
        setStatus('error');
        setMessage('Pago cancelado o no completado. No se realizó el cobro.');
        toast({ title: 'Pago cancelado', description: 'No se realizó el cobro.' });
        safeNavigate(`/${profile?.user_type || 'passenger'}`);
        return;
      }

      // Viajes — usa finalize si existe; si no, fallback legacy
      if (isRideRef(externalRef)) {
        try {
          const { data, error } = await supabase.rpc('finalize_mixed_payment_ride', {
            p_reference_id: externalRef,
            p_payment_id: paymentId,
            p_mp_status: statusNorm,
          });
          if (error) throw error;
          if (data?.success) {
            setStatus('success');
            setMessage('¡Pago aprobado! Viaje creado, buscando conductor…');
            const id = data.ride_id || data?.ride?.id;
            toast({ title: 'Pago aprobado', description: '¡Viaje creado!' });
            safeNavigate(`/tracking/${id}`);
            return;
          }
        } catch {
          // seguimos al fallback
        }

        // Fallback legacy create_ride_from_mp_payment para referencias antiguas
        if (isApprovedStatus(statusNorm)) {
          const { data: rideCreationResult, error: rideCreationError } = await supabase.rpc(
            'create_ride_from_mp_payment',
            { p_external_reference: externalRef }
          );

          if (rideCreationError || !rideCreationResult?.success) {
            setStatus('error');
            setMessage(rideCreationError?.message || rideCreationResult?.message || 'Error al crear el viaje.');
            toast({ title: 'Error', description: 'No se pudo crear el viaje con el pago.', variant: 'destructive' });
          } else {
            setStatus('success');
            const ride = rideCreationResult.ride;
            setMessage('¡Viaje creado! Redirigiendo…');
            safeNavigate(`/tracking/${ride.id}`);
          }
          return;
        }

        // cancelado/rechazado/null
        setStatus('error');
        setMessage('Pago cancelado o no completado. No se realizó el cobro.');
        toast({ title: 'Pago cancelado', description: 'No se realizó el cobro.' });
        safeNavigate(`/${profile?.user_type || 'passenger'}`);
        return;
      }

      // Recargas — intenta finalize; si falla, fallback a update directa
      if (isRechargeRef(externalRef)) {
        if (isApprovedStatus(statusNorm)) {
          let finalized = false;
          try {
            const { data, error } = await supabase.rpc('finalize_wallet_recharge', {
              p_reference_id: externalRef,
              p_payment_id: paymentId,
              p_mp_status: statusNorm,
            });
            if (error) throw error;
            finalized = !!data?.success;
          } catch {
            finalized = false;
          }

          if (!finalized) {
            await supabase
              .from('mp_payments')
              .update({ status: 'approved', payment_id: paymentId, payment_status: 'succeeded' })
              .eq('external_reference', externalRef);
          }

          await fetchWalletData();
          setStatus('success');
          setMessage('¡Recarga acreditada en tu billetera!');
          toast({ title: '¡Recarga exitosa!', description: 'El saldo se acreditó correctamente.' });
          safeNavigate('/passenger/wallet');
          return;
        }

        // recarga cancelada
        setStatus('error');
        setMessage('Recarga cancelada o no completada.');
        toast({ title: 'Recarga no completada', description: `Estado: ${statusNorm}`, variant: 'destructive' });
        safeNavigate('/passenger/wallet');
        return;
      }

      // Referencia no reconocida
      setStatus('error');
      setMessage('Referencia de pago no reconocida.');
      toast({ title: 'Error', description: 'Referencia de pago no reconocida.', variant: 'destructive' });
      safeNavigate(`/${profile?.user_type || 'passenger'}`);
    } catch (e) {
      setStatus('error');
      setMessage(e.message || 'Hubo un problema al procesar el pago.');
      toast({ title: 'Hubo un problema', description: e.message, variant: 'destructive' });
      safeNavigate(`/${profile?.user_type || 'passenger'}`);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">Procesando...</h1>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-green-600 mt-4">¡Todo Listo!</h1>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-red-600 mt-4">Hubo un Problema</h1>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <img
          src="https://img.icons8.com/color/96/mercado-pago.png"
          alt="MercadoPago"
          className="mx-auto mb-6"
        />
        {renderContent()}
        <p className="text-slate-600 dark:text-slate-400 mt-2">{message}</p>
        {status === 'error' && (
          <Button onClick={() => safeNavigate(`/${profile?.user_type || 'passenger'}`)} className="mt-6">
            Volver al inicio
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default MercadoPagoCallbackPage;
