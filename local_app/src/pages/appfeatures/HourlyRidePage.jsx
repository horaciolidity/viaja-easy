
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useHourlyRide } from '@/contexts/HourlyRideContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { getActiveVehicleTypes } from '@/services/vehicleTypeService';
import { usePayment } from '@/contexts/PaymentContext';
import HelpButton from '@/components/common/HelpButton';
import GuidedTour from '@/components/common/GuidedTour';
import PaymentModal from '@/components/ride-booking/PaymentModal';
import { createHourlyBooking } from '@/services/hourlyRideService.js';

import HoursSlider from '@/components/appfeatures/hourly-ride/HoursSlider';
import VehicleSelection from '@/components/appfeatures/hourly-ride/VehicleSelection';
import ServiceDetails from '@/components/appfeatures/hourly-ride/ServiceDetails';
import AddressPicker from '@/components/common/AddressPicker';
import DistanceSlider from '@/components/appfeatures/hourly-ride/DistanceSlider';
import CostBreakdown from '@/components/appfeatures/hourly-ride/CostBreakdown';
import InfoPanel from '@/components/appfeatures/hourly-ride/InfoPanel';
import PaymentSelection from '@/components/appfeatures/hourly-ride/PaymentSelection';
import BookingConfirmation from '@/components/appfeatures/hourly-ride/BookingConfirmation';

const HourlyRidePage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { settings, loadingSettings, bookingLoading } = useHourlyRide();
  const { paymentMethods, defaultPaymentMethod, wallet } = usePayment();

  const [hours, setHours] = useState([1]);
  const [startLocation, setStartLocation] = useState(null);
  const [estimatedDistance, setEstimatedDistance] = useState(15);

  const now = new Date();
  const defaultStartTime = new Date(now.getTime() + 15 * 60000);
  const [startDate, setStartDate] = useState(defaultStartTime.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(
    defaultStartTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  const [description, setDescription] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState(null);
  const [loadingPrerequisites, setLoadingPrerequisites] = useState(true);
  const [runTour, setRunTour] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [totalToPay, setTotalToPay] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState({ rideData: null, fare_estimated: 0 });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(defaultPaymentMethod || null);

  const tourSteps = [
    { target: '#hours-slider', content: 'Deslizá para elegir cuántas horas necesitás el vehículo. ¡Simple!', disableBeacon: true },
    { target: '#vehicle-selection-hourly', content: 'Seleccioná el tipo de vehículo que mejor se adapte a tus necesidades.' },
    { target: '#service-details-hourly', content: 'Indicá la fecha, hora y una breve descripción de para qué necesitás el servicio.' },
    { target: '#start-location-hourly', content: 'Elegí el punto de partida donde el conductor te pasará a buscar.' },
    { target: '#distance-slider-hourly', content: 'Estimá la distancia total que creés que van a recorrer.' },
    { target: '#confirm-booking-hourly', content: 'Cuando esté todo listo, confirmá tu reserva desde acá. ¡Así de fácil!' },
  ];

  const fetchPrerequisites = useCallback(async () => {
    setLoadingPrerequisites(true);
    try {
      const types = await getActiveVehicleTypes();
      setVehicleTypes(types || []);
      if (types && types.length > 0) {
        setSelectedVehicleTypeId(types[0].id);
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar datos esenciales.', variant: 'destructive' });
    } finally {
      setLoadingPrerequisites(false);
    }
  }, []);

  useEffect(() => {
    if (!settings) return;
    const minH = Number(settings.min_hours ?? 1);
    setHours([minH > 0 ? minH : 1]);
    fetchPrerequisites();
  }, [settings, fetchPrerequisites]);

  useEffect(() => {
    if (defaultPaymentMethod) {
      setSelectedPaymentMethod(defaultPaymentMethod);
    }
  }, [defaultPaymentMethod]);

  const costBreakdownData = useMemo(() => {
    if (!settings) return null;

    const bookedHours = Number(hours?.[0] ?? 0);
    if (!Number.isFinite(bookedHours) || bookedHours <= 0) return null;

    const baseRate = parseFloat(settings.base_rate_ars || 0);
    const extraKmRate = parseFloat(settings.extra_km_rate_ars || 0);
    const includedKmPerHour = parseFloat(settings.included_km || 0);
    const platformFeePct = parseFloat(settings.platform_fee_pct || 0);

    const baseFareForHours = baseRate * bookedHours;
    const totalIncludedKm = includedKmPerHour * bookedHours;

    const dist = Number(estimatedDistance ?? 0);
    const extraKm = Math.max(0, dist - totalIncludedKm);
    const extraKmFare = extraKm * extraKmRate;

    const subtotal = baseFareForHours + extraKmFare;
    const platformFee = subtotal * (platformFeePct / 100);
    const totalFare = subtotal + platformFee;

    return {
      baseFare: baseFareForHours,
      extraKmFare,
      platformFee,
      totalFare,
      totalIncludedKm,
      extraKm,
    };
  }, [settings, hours, estimatedDistance]);

  const handleConfirmBooking = async () => {
    if (!user) {
      toast({ title: 'Sesión requerida', description: 'Inicia sesión para continuar.', variant: 'destructive' });
      return;
    }
    if (!startLocation || !startLocation.address || !startLocation.lat || !startLocation.lng) {
      toast({ title: 'Falta el punto de partida', description: 'Seleccioná una dirección válida.', variant: 'destructive' });
      return;
    }
    if (!costBreakdownData) {
      toast({ title: 'Sin tarifa', description: 'No se pudo calcular el costo. Revisá los datos.', variant: 'destructive' });
      return;
    }
    if (!startDate || !startTime) {
      toast({ title: 'Fecha/hora faltante', description: 'Definí la fecha y hora de inicio.', variant: 'destructive' });
      return;
    }
    if (!description) {
      toast({ title: 'Descripción faltante', description: 'Contanos para qué necesitás el servicio.', variant: 'destructive' });
      return;
    }
    if (!selectedVehicleTypeId) {
      toast({ title: 'Vehículo faltante', description: 'Elegí un tipo de vehículo.', variant: 'destructive' });
      return;
    }
    if (!selectedPaymentMethod) {
      toast({ title: 'Método de pago', description: 'Seleccioná un método de pago.', variant: 'destructive' });
      return;
    }
    if (selectedPaymentMethod.type === 'cash') {
      toast({
        title: 'Método no disponible',
        description: 'Para reservas por hora usá tu billetera y/o Mercado Pago.',
        variant: 'destructive',
      });
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    if (startDateTime < new Date()) {
      toast({ title: 'Fecha inválida', description: 'La fecha y hora de inicio no pueden ser en el pasado.', variant: 'destructive' });
      return;
    }

    const bookingData = {
      passenger_id: user.id,
      start_location_address: startLocation.address,
      start_location_lat: startLocation.lat,
      start_location_lng: startLocation.lng,
      booked_hours: Number(hours[0]),
      estimated_distance_km: Number(estimatedDistance),
      start_datetime: startDateTime.toISOString(),
      description: description,
      vehicle_type_id: selectedVehicleTypeId,
      base_fare: costBreakdownData.baseFare,
      extra_km_fare: costBreakdownData.extraKmFare,
      platform_fee: costBreakdownData.platformFee,
      total_fare: costBreakdownData.totalFare,
      total_included_km: costBreakdownData.totalIncludedKm,
      ride_type: 'hourly',
    };

    try {
      const data = await createHourlyBooking(bookingData, selectedPaymentMethod.id, user.id);

      toast({
        title: '¡Reserva exitosa!',
        description: 'Tu viaje por hora ha sido agendado.',
        className: 'bg-green-600 text-white',
      });
      navigate('/passenger/my-rides');
    } catch (error) {
      const msg = String(error?.message || '');
      if (msg.includes('insufficient_wallet_balance')) {
        const totalAmount = Number(costBreakdownData.totalFare) + Number(profile?.pending_debt || 0);
        setTotalToPay(totalAmount);
        setPaymentDetails({
          rideData: bookingData,
          fare_estimated: Number(costBreakdownData.totalFare),
        });
        setIsPaymentModalOpen(true);
        return;
      }

      console.error('Error al confirmar reserva:', error);
      toast({
        title: 'Error al confirmar',
        description: msg || 'No se pudo completar la acción.',
        variant: 'destructive',
      });
    }
  };

  if (loadingSettings || loadingPrerequisites) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-slate-600">Cargando opciones por hora...</p>
      </div>
    );
  }

  if (!settings || !settings.is_active) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-center p-6">
        <header className="absolute top-0 left-0 right-0 p-4 pt-safe-top">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-white/50 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-800" />
          </Button>
        </header>
        <BookingConfirmation settings={settings} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <GuidedTour run={runTour} steps={tourSteps} onTourEnd={() => setRunTour(false)} />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={totalToPay}
        walletBalance={wallet?.balance || 0}
        rideData={paymentDetails.rideData}
        fare_estimated={paymentDetails.fare_estimated}
        rpcName="process_mixed_payment_hourly_creation"
        onWalletOnlySuccess={() => {
          toast({
            title: '¡Reserva confirmada!',
            description: 'Se cubrió el total con tu billetera.',
            className: 'bg-green-600 text-white',
          });
          navigate('/passenger/my-rides');
        }}
      />

      <header className="bg-gradient-to-br from-primary to-purple-600 p-4 pt-safe-top shadow-lg">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 text-white hover:bg-white/20 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">Reserva por Horas</h1>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto pb-40">
        <HoursSlider hours={hours} setHours={setHours} settings={settings} />
        <VehicleSelection vehicleTypes={vehicleTypes} selectedVehicleTypeId={selectedVehicleTypeId} setSelectedVehicleTypeId={setSelectedVehicleTypeId} />
        <ServiceDetails startDate={startDate} setStartDate={setStartDate} startTime={startTime} setStartTime={setStartTime} description={description} setDescription={setDescription} />
        
        <motion.div
          id="start-location-hourly"
          className="bg-white p-6 rounded-2xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AddressPicker
            label="Punto de Partida"
            value={startLocation}
            onLocationSelect={setStartLocation}
            placeholder="Buscar dirección de partida"
          />
        </motion.div>

        <DistanceSlider estimatedDistance={estimatedDistance} setEstimatedDistance={setEstimatedDistance} />
        
        {costBreakdownData && (
          <CostBreakdown costBreakdown={costBreakdownData} hours={hours} settings={settings} />
        )}

        <InfoPanel />
      </main>

      <footer
        id="confirm-booking-hourly"
        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-4 border-t border-slate-200 space-y-3"
      >
        <PaymentSelection paymentMethods={paymentMethods} selectedPaymentMethod={selectedPaymentMethod} setSelectedPaymentMethod={setSelectedPaymentMethod} />
        <BookingConfirmation onConfirm={handleConfirmBooking} bookingLoading={bookingLoading} startLocation={startLocation} description={description} selectedVehicleTypeId={selectedVehicleTypeId} costBreakdown={costBreakdownData} />
      </footer>

      <HelpButton onClick={() => setRunTour(true)} />
    </div>
  );
};

export default HourlyRidePage;
