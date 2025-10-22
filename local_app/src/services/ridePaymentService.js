import { toast } from '@/components/ui/use-toast';
import { mercadoPagoService, formatCurrencyARS } from '@/utils/mercadoPago.js';

export const processPaymentForRide = async (rideData, paymentMethod, user) => {
    if (!paymentMethod) {
      throw new Error('No hay método de pago seleccionado o disponible.');
    }

    if (paymentMethod.type === 'cash') {
        await new Promise(resolve => setTimeout(resolve, 500)); 
        toast({
          title: "Viaje en Efectivo",
          description: `Prepara ${formatCurrencyARS(rideData.price)} para pagar al conductor.`,
        });
        return {
          id: `cash_payment_${Date.now()}`, rideId: rideData.id, amount: rideData.price,
          currency: 'ARS', paymentMethod: paymentMethod, status: 'pending_cash_payment',
          processedAt: new Date().toISOString(),
        };
    }
    
    if (paymentMethod.type === 'mercadopago') {
        const paymentResult = await mercadoPagoService.simulatePayment({
          amount: rideData.price,
          description: `Viaje ViajaFácil #${rideData.id}`,
          payerEmail: user.email,
        });

        if (paymentResult.status === 'approved') {
          toast({
            title: "Pago con MercadoPago Exitoso",
            description: `Pago de ${formatCurrencyARS(rideData.price)} completado.`,
          });
          return {
            id: paymentResult.id, rideId: rideData.id, amount: rideData.price,
            currency: 'ARS', paymentMethod: paymentMethod, status: 'completed',
            processedAt: new Date().toISOString(), transactionId: paymentResult.id,
            mercadopagoStatus: paymentResult.status_detail,
          };
        } else {
          throw new Error(`Pago con MercadoPago rechazado: ${paymentResult.status_detail}`);
        }
    }
    
    throw new Error('Tipo de método de pago no soportado.');
};