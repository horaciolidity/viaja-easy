import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { createPreference } from '@/services/paymentService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

/**
 * Props:
 * - isOpen, onClose
 * - totalAmount, walletBalance
 * - rideData, fare_estimated
 * - mode?: 'ride' | 'delivery' (por defecto 'ride')
 * - rpcName?: string (si lo pasás, tiene prioridad sobre mode)
 * - onWalletOnlySuccess?: (data) => void
 */
const PaymentModal = ({
  isOpen,
  onClose,
  totalAmount,
  walletBalance,
  rideData,
  fare_estimated,
  mode = 'ride',
  rpcName,
  onWalletOnlySuccess,
}) => {
  const { user } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [preferenceUrl, setPreferenceUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [serverMpAmount, setServerMpAmount] = useState(null);
  const runOnceGuard = useRef(false);

  // ⬇⬇ IMPORTANTE: default al wrapper sin ambigüedad
  const RPC_RIDE_DEFAULT = 'process_mixed_payment_ride_creation_v2';
  const RPC_DELIVERY_DEFAULT = 'process_mixed_payment_delivery_creation';

  const rpcToUse =
    rpcName || (mode === 'delivery' ? RPC_DELIVERY_DEFAULT : RPC_RIDE_DEFAULT);

  const total = Number(totalAmount || 0);
  const balance = Number(walletBalance || 0);
  const walletToUse = Math.min(total, balance);
  const mpToPayLocal = Math.max(0, total - walletToUse);
  const mpToPay = serverMpAmount ?? mpToPayLocal;
  const isMixed = mpToPay > 0;

  const processPayment = useCallback(async () => {
    if (!user?.id) {
      setErrorMsg('Debés iniciar sesión para continuar.');
      return;
    }

    setIsProcessing(true);
    setPreferenceUrl(null);
    setErrorMsg(null);
    setServerMpAmount(null);

    try {
      const { data, error } = await supabase.rpc(rpcToUse, {
        p_passenger_id: user.id,
        p_ride_data: rideData,
        p_estimated_fare: fare_estimated,
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.message || 'No se pudo procesar el pago mixto.');
      }

      if (data.action === 'PROCEED_TO_MP' && Number(data?.amount_to_pay) > 0) {
        setServerMpAmount(Number(data.amount_to_pay));

        const url = await createPreference({
          amount: Number(data.amount_to_pay),
          description: mode === 'delivery' ? 'Pago de envío y/o deuda' : 'Pago de viaje y/o deuda',
          externalReference: data.external_reference,
        });

        if (!url) throw new Error('No se pudo crear la preferencia de Mercado Pago.');
        setPreferenceUrl(url);
        setIsProcessing(false);
        return;
      }

      if (data.success && (data.ride || data.delivery_id)) {
        toast({
          title: mode === 'delivery' ? '¡Envío solicitado!' : '¡Viaje solicitado!',
          description: 'Se cubrió el total con tu billetera. Buscando conductor...',
          className: 'bg-green-600 text-white',
        });

        setIsProcessing(false);
        onWalletOnlySuccess?.(data);
        onClose?.();
        return;
      }

      throw new Error('Respuesta inesperada del servidor.');
    } catch (err) {
      setErrorMsg(err?.message || 'Error al generar el link de pago.');
      setIsProcessing(false);
    }
  }, [fare_estimated, rideData, rpcToUse, user?.id, onClose, onWalletOnlySuccess, mode]);

  useEffect(() => {
    if (!isOpen) {
      runOnceGuard.current = false;
      return;
    }
    if (runOnceGuard.current) return;
    runOnceGuard.current = true;

    processPayment();
  }, [isOpen, processPayment]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isProcessing) onClose?.(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Completar Pago</DialogTitle>
          <DialogDescription>
            {isMixed
              ? 'Tu saldo no alcanza para cubrir el costo total; usaremos tu billetera y el resto con Mercado Pago.'
              : 'Tu saldo alcanza para cubrir el costo total. Se pagará con tu billetera.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Costo total</span>
              <span className="font-bold">{formatCurrencyARS(total)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Saldo disponible</span>
              <span className="font-semibold">{formatCurrencyARS(balance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">Se usa de tu billetera</span>
              <span className="font-bold text-red-500">- {formatCurrencyARS(walletToUse)}</span>
            </div>
            <hr className="my-2 border-slate-200 dark:border-slate-700" />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Monto a pagar con MP</span>
              <span>{formatCurrencyARS(mpToPay)}</span>
            </div>
          </div>

          {isProcessing && !preferenceUrl && (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Generando link de pago...</span>
            </div>
          )}

          {!!errorMsg && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
              {errorMsg}
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={processPayment} disabled={isProcessing}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {preferenceUrl && (
            <Button
              onClick={() => (window.location.href = preferenceUrl)}
              className="w-full bg-blue-500 hover:bg-blue-600"
              disabled={isProcessing}
            >
              Pagar con Mercado Pago
            </Button>
          )}

          <div className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-1" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {isMixed
                ? 'Se usará tu saldo necesario y el resto se cobrará con Mercado Pago.'
                : 'Se debitará el total desde tu billetera.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
