import React, { useState } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Loader2 } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/AuthContext';
    import { supabase } from '@/lib/supabaseClient';

    const AddFundsModal = ({ isOpen, onClose }) => {
      const [amount, setAmount] = useState('');
      const [isProcessing, setIsProcessing] = useState(false);
      const [error, setError] = useState('');
      const { user } = useAuth();
      
      const predefinedAmounts = [1000, 2000, 5000, 10000];

      const handleRecharge = async () => {
        const rechargeAmount = parseFloat(amount);
        if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
          setError('Por favor, ingresá un monto válido.');
          return;
        }
        setError('');
        setIsProcessing(true);

        try {
          const externalReference = `recharge-${user.id}-${Date.now()}`;
          
          const { data, error: functionError } = await supabase.functions.invoke('mp-create-preference-v2', {
            body: {
              amount: rechargeAmount,
              externalReference,
              description: 'Recarga de saldo ViajaFácil'
            },
          });

          if (functionError || !data?.init_point) {
            throw new Error(functionError?.message || data?.error || 'No se pudo crear la preferencia de pago.');
          }

          window.location.href = data.init_point;

        } catch (err) {
          console.error("Error al recargar saldo:", err);
          toast({
            title: "Error",
            description: err.message || 'No se pudo iniciar el proceso de pago.',
            variant: "destructive"
          });
          setIsProcessing(false);
        }
      };

      return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setIsProcessing(false); setAmount(''); }}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Saldo a tu Billetera</DialogTitle>
              <DialogDescription>
                Ingresá un monto para recargar. Serás redirigido a Mercado Pago para completar la compra de forma segura.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="amount">Monto a Recargar</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="$ 1.000"
                  className="mt-1"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {predefinedAmounts.map(preAmount => (
                  <Button 
                    key={preAmount} 
                    variant="outline" 
                    onClick={() => setAmount(preAmount.toString())}
                    disabled={isProcessing}
                  >
                    $ {preAmount.toLocaleString('es-AR')}
                  </Button>
                ))}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              
              <Button onClick={handleRecharge} disabled={!amount || isProcessing} className="w-full">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isProcessing ? 'Procesando...' : 'Pagar con Mercado Pago'}
              </Button>

            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    export default AddFundsModal;