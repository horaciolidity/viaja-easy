import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import FindRideView from '@/components/shared-ride/FindRideView';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import PaymentModal from '@/components/ride-booking/PaymentModal';

const SharedRidesOffersPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { wallet } = usePayment();

  // Modal de pago (wallet-first + MP resto)
  const [showPay, setShowPay] = useState(false);
  const [payDetails, setPayDetails] = useState({
    totalAmount: 0,
    payload: null,
    estimated: 0,
  });

  const handleBackNavigation = () => {
    navigate('/passenger');
  };

  /**
   * Callback que puede invocar FindRideView cuando detecte
   * que hace falta cobrar (p.ej., saldo de billetera insuficiente).
   *
   * Espera un objeto con:
   *  - fare: número estimado a cobrar por la reserva (ARS)
   *  - payload: objeto con los datos que necesita tu RPC para crear la reserva compartida
   *  - totalOverride (opcional): si ya calculaste el total (fare + deuda), lo podés pasar
   */
  const handlePaymentRequired = useCallback(({ fare, payload, totalOverride } = {}) => {
    const estimated = Number(fare || 0);
    const totalAmount =
      totalOverride != null
        ? Number(totalOverride)
        : estimated + Number(profile?.pending_debt || 0);

    setPayDetails({
      totalAmount,
      payload,      // lo usará el RPC para crear la reserva compartida
      estimated,
    });
    setShowPay(true);
  }, [profile?.pending_debt]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="passenger-dashboard-header sticky top-0 z-10 py-4 px-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackNavigation}
            className="mr-2 text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            <span>Viajes Compartidos Disponibles</span>
          </h1>
        </div>
      </header>

      <main className="flex-grow p-4 space-y-6 overflow-y-auto pb-24">
        {/* 
          Pasamos onPaymentRequired para que FindRideView pueda
          disparar el flujo de pago mixto cuando corresponda.
          Si FindRideView no usa esta prop aún, la página funcionará
          como antes sin romper nada.
        */}
        <FindRideView onPaymentRequired={handlePaymentRequired} />
      </main>

      <BottomNavBar userType={profile?.user_type} />

      {showPay && (
        <PaymentModal
          isOpen={showPay}
          onClose={() => setShowPay(false)}
          totalAmount={payDetails.totalAmount}
          walletBalance={wallet?.balance || 0}
          rideData={payDetails.payload}
          fare_estimated={payDetails.estimated}
          // RPC para reservas de viaje compartido (ajústalo al nombre real en tu backend)
          rpcName="process_mixed_payment_shared_reservation"
          // Si la billetera cubre el 100% (wallet-only), al cerrar navegamos a "Mis viajes"
          onWalletOnlySuccess={() => {
            navigate('/passenger/my-rides');
          }}
        />
      )}
    </div>
  );
};

export default SharedRidesOffersPage;
