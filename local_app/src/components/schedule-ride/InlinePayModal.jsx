import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/utils/mercadoPago';

const InlinePayModal = ({ open, onClose, total, walletBalance, onGenerate }) => {
  const diff = Math.max((total || 0) - (walletBalance || 0), 0);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handlePay = async () => {
    try {
      setLoading(true);
      await onGenerate(diff);
    } catch (e) {
      toast({
        title: 'Error',
        description: String(e?.message || 'No se pudo generar el link de pago.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold mb-3">Completar Pago</h3>
        <p className="text-sm text-slate-600 mb-4">
          Tu saldo no es suficiente para cubrir el costo total.
        </p>

        <div className="rounded-lg border p-3 mb-4 text-sm">
          <div className="flex justify-between">
            <span>Costo total</span>
            <span className="font-semibold">{formatCurrencyARS(total || 0)}</span>
          </div>
          <div className="flex justify-between text-red-500">
            <span>Tu saldo en billetera</span>
            <span>- {formatCurrencyARS(Math.abs(walletBalance || 0))}</span>
          </div>
          <div className="mt-2 flex justify-between font-semibold">
            <span>Monto a pagar con MP</span>
            <span>{formatCurrencyARS(diff)}</span>
          </div>
        </div>

        <div className="rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-3 mb-4">
          Se usará todo tu saldo disponible y el resto se cobrará con Mercado Pago.
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handlePay} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando link…
              </>
            ) : (
              'Pagar con Mercado Pago'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlinePayModal;