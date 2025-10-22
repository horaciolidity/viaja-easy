import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, AlertTriangle, Bus } from 'lucide-react';
import SharedRideCard from '@/components/shared-ride/SharedRideCard';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentModal from '@/components/ride-booking/PaymentModal';

const FindRideView = () => {
  const [sharedRides, setSharedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { wallet } = usePayment();
  const { user, profile } = useAuth();

  // Mensaje “no hay viajes” tras un pequeño delay
  const [showNoRidesMessage, setShowNoRidesMessage] = useState(false);
  const noRidesTimerRef = useRef(null);

  // Pago mixto
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    totalAmount: 0,
    rideData: null,
    fare_estimated: 0,
  });

  const clearNoRidesTimer = () => {
    if (noRidesTimerRef.current) {
      clearTimeout(noRidesTimerRef.current);
      noRidesTimerRef.current = null;
    }
  };

  const fetchSharedRides = useCallback(
    async (isManualRefresh = false) => {
      const mounted = { current: true };
      if (!isManualRefresh) setLoading(true);
      setError(null);
      setShowNoRidesMessage(false);
      clearNoRidesTimer();

      try {
        const { data, error: dbError } = await supabase
          .from('shared_rides')
          .select(`
            *,
            driver:profiles!left(
              full_name,
              avatar_url,
              rating,
              vehicle_info
            )
          `)
          .eq('status', 'scheduled')
          .gt('available_seats', 0)
          .order('departure_time', { ascending: true });

        if (dbError) throw dbError;

        if (!mounted.current) return;
        setSharedRides(data || []);

        if ((data || []).length === 0) {
          // Mostrar el mensajito después de 5s si sigue vacío
          noRidesTimerRef.current = setTimeout(() => {
            setShowNoRidesMessage(true);
          }, 5000);
        } else {
          setShowNoRidesMessage(false);
        }

        if (isManualRefresh) {
          toast({
            title: 'Lista actualizada',
            description: 'Se han cargado los últimos viajes disponibles.',
          });
        }
      } catch (dbError) {
        setError('No se pudieron cargar los viajes. Por favor, intenta de nuevo.');
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los viajes compartidos.',
          variant: 'destructive',
        });
        console.error('Error fetching shared rides:', dbError);
      } finally {
        if (mounted.current) setLoading(false);
      }

      return () => {
        mounted.current = false;
      };
    },
    [toast]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!cancelled) await fetchSharedRides();
    })();

    const intervalId = setInterval(() => fetchSharedRides(), 60000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      clearNoRidesTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reserva: delegamos TODO el cobro al PaymentModal (wallet-first + MP resto).
  const handleReserveSeat = async (rideId, reservationDetails) => {
    try {
      if (!user || !profile) {
        toast({
          title: 'Iniciar sesión',
          description: 'Debes iniciar sesión para reservar un viaje compartido.',
          variant: 'destructive',
        });
        return;
      }

      const ride = sharedRides.find((r) => r.id === rideId);
      if (!ride) {
        toast({ title: 'Error', description: 'No se encontró el viaje.', variant: 'destructive' });
        return;
      }

      const seats = Number(reservationDetails?.seats || 1);
      const fareUnit = Number(ride?.seat_price || 0);
      const fare = seats * fareUnit;

      // Payload que consumirá el RPC desde el PaymentModal (ride_type='shared')
      const rideDataForPayment = {
        ride_type: 'shared',
        shared_ride_id: ride.id,
        seats,
        pickup: reservationDetails?.pickup || null,
        dropoff: reservationDetails?.dropoff || null,
      };

      const totalAmount = Number(fare) + Number(profile?.pending_debt || 0);

      setPaymentDetails({
        totalAmount,
        rideData: rideDataForPayment,
        fare_estimated: Number(fare),
      });
      setShowPaymentModal(true);
    } catch (e) {
      console.error('handleReserveSeat error:', e);
      toast({
        title: 'Error',
        description: e.message || 'No se pudo iniciar la reserva.',
        variant: 'destructive',
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium text-gray-700">Buscando viajes...</p>
          <p className="text-sm text-gray-500">Esto puede tomar un momento.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-bold text-destructive">¡Upa! Algo salió mal</h3>
          <p className="text-sm text-red-800 mt-1">{error}</p>
        </div>
      );
    }

    if (sharedRides.length > 0) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {sharedRides.map((ride) => (
              <motion.div
                key={ride.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <SharedRideCard ride={ride} onReserve={handleReserveSeat} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      );
    }

    if (showNoRidesMessage) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Bus className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-lg font-bold text-primary">¡Qué tranquilo está todo!</h3>
          <p className="text-sm text-blue-800 mt-1">
            No hay viajes compartidos disponibles cerca tuyo en este momento.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Viajes disponibles</h2>
        <Button variant="outline" size="sm" onClick={() => fetchSharedRides(true)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar viajes
        </Button>
      </div>

      {renderContent()}

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          totalAmount={paymentDetails.totalAmount}
          walletBalance={wallet?.balance || 0}
          rideData={paymentDetails.rideData}
          fare_estimated={paymentDetails.fare_estimated}
          // Si la billetera cubre todo, el RPC ya crea la reserva/solicitud.
          onWalletOnlySuccess={() => {
            toast({
              title: '¡Reserva enviada!',
              description: 'Tu solicitud fue enviada al conductor.',
            });
            setShowPaymentModal(false);
            fetchSharedRides(true);
          }}
        />
      )}
    </>
  );
};

export default FindRideView;
