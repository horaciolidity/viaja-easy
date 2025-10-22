import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import { requestWithdrawal } from '@/services/walletService';
import { formatCurrencyARS } from '@/utils/mercadoPago';

const WithdrawFundsModal = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const { profile } = useAuth();
  const { wallet, fetchWalletData } = usePayment();

  const hasMercadoPagoInfo = profile?.mercadopago_alias || profile?.mercadopago_cvu;

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Por favor, ingresá un monto válido.');
      return;
    }
    if (withdrawAmount > wallet.balance) {
      setError('No tenés saldo suficiente para retirar ese monto.');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      await requestWithdrawal(withdrawAmount);
      toast({
        title: "Solicitud Enviada",
        description: "Tu solicitud de retiro ha sido enviada y será procesada pronto.",
      });
      await fetchWalletData();
      onClose();
    } catch (err) {
      console.error("Error al solicitar retiro:", err);
      toast({
        title: "Error",
        description: err.message || 'No se pudo procesar tu solicitud de retiro.',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar Saldo a Mercado Pago</DialogTitle>
          <DialogDescription>
            El dinero será enviado a tu cuenta de Mercado Pago asociada.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {!hasMercadoPagoInfo ? (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="font-semibold text-yellow-800">Falta información de Mercado Pago</p>
                <p className="text-sm text-yellow-700">Por favor, andá a tu perfil y agregá tu alias o CVU para poder retirar fondos.</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="withdraw-amount">Monto a Retirar</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Máximo: ${formatCurrencyARS(wallet?.balance || 0)}`}
                  className="mt-1"
                  disabled={isProcessing}
                />
                <p className="text-xs text-slate-500 mt-1">Saldo disponible: {formatCurrencyARS(wallet?.balance || 0)}</p>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button onClick={handleWithdraw} disabled={!amount || isProcessing} className="w-full">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isProcessing ? 'Procesando...' : 'Solicitar Retiro'}
              </Button>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawFundsModal;