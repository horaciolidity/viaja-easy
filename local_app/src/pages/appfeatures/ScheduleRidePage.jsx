import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduledRide } from '@/contexts/ScheduledRideContext';
import { useLocation as useGeoLocation } from '@/contexts/LocationContext';
import { getActiveVehicleTypes } from '@/services/vehicleTypeService';
import { toast } from '@/components/ui/use-toast';
import { format, addHours, isBefore, startOfHour, addMinutes } from 'date-fns';
import HelpButton from '@/components/common/HelpButton';
import GuidedTour from '@/components/common/GuidedTour';
import { usePayment } from '@/contexts/PaymentContext';
import { supabase } from '@/lib/supabaseClient';
import { createPreference } from '@/services/paymentService';
import { fetchTariff } from '@/services/tariffService';

import ScheduleRideHeader from '@/components/schedule-ride/ScheduleRideHeader';
import Step1_LocationTime from '@/components/schedule-ride/Step1_LocationTime';
import Step2_VehiclePayment from '@/components/schedule-ride/Step2_VehiclePayment';
import ScheduleRideFooter from '@/components/schedule-ride/ScheduleRideFooter';
import InlinePayModal from '@/components/schedule-ride/InlinePayModal';

const VISIBLE_METHODS = [
  { id: 'cash', type: 'cash', name: 'Efectivo' },
  { id: 'wallet', type: 'wallet', name: 'Billetera' },
];
const keyOf = (m) => (typeof m === 'string' ? m : (m?.type || m?.id || 'cash')).toString().toLowerCase();

const ScheduleRidePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: scheduleSettings } = useScheduledRide();
  const { calculateRoute: getDirections } = useGeoLocation();
  const { defaultPaymentMethod, wallet } = usePayment();

  const [step, setStep] = useState(1);
  const [origin, setOrigin] = useState(null);
  const [stops, setStops] = useState([{ id: 'destination', location: null }]);
  const [pickupTime, setPickupTime] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [route, setRoute] = useState(null);
  const [loadingPrerequisites, setLoadingPrerequisites] = useState(true);
  const [runTour, setRunTour] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loadingFare, setLoadingFare] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [showInlinePay, setShowInlinePay] = useState(false);

  const maxStops = parseInt(scheduleSettings?.max_stops_scheduled_ride, 10) || 4;

  const tourSteps = [
    { target: '#origin-input-schedule', content: 'Primero, indicá desde dónde querés que te pasen a buscar.', disableBeacon: true },
    { target: '#destination-input-schedule', content: 'Ahora, ingresá tu destino final.' },
    { target: '#pickup-time-schedule', content: 'Elegí la fecha y hora exactas para tu viaje. ¡Planificá con tiempo!' },
    { target: '#vehicle-step-button', content: 'Con todo listo, avanzá para elegir tu vehículo.' },
    { target: '#vehicle-selection-schedule', content: 'Seleccioná el tipo de vehículo que prefieras para tu viaje programado.' },
    { target: '#confirm-schedule-button', content: '¡Perfecto! Solo queda confirmar y tu viaje quedará agendado.' },
  ];

  const minPickupDateTime = useMemo(() => {
    if (!scheduleSettings) return new Date();
    return addHours(new Date(), scheduleSettings.min_advance_notice_hours || 1);
  }, [scheduleSettings]);

  useEffect(() => {
    const load = async () => {
      setLoadingPrerequisites(true);
      try {
        const types = await getActiveVehicleTypes();
        setVehicleTypes(types || []);
        if ((!selectedVehicle || !selectedVehicle.id) && types && types.length > 0) {
          setSelectedVehicle(types[0]);
        }
      } catch {
        toast({ title: 'Error', description: 'No se pudieron cargar los tipos de vehículo.', variant: 'destructive' });
      } finally {
        setLoadingPrerequisites(false);
      }
    };
    load();

    const defaultPickupTime = startOfHour(addMinutes(minPickupDateTime, 30));
    setPickupTime(format(defaultPickupTime, "yyyy-MM-dd'T'HH:mm"));
  }, [minPickupDateTime, selectedVehicle]);

  useEffect(() => {
    const def = keyOf(defaultPaymentMethod) === 'wallet' ? VISIBLE_METHODS[1] : VISIBLE_METHODS[0];
    setSelectedPaymentMethod(def);
  }, [defaultPaymentMethod]);

  const destination = useMemo(() => {
    const lastStop = stops[stops.length - 1];
    return lastStop?.location;
  }, [stops]);

  const waypoints = useMemo(() => stops.slice(0, -1).map((s) => s.location).filter(Boolean), [stops]);

  useEffect(() => {
    const calc = async () => {
      if (!origin || !destination) return;
      setRoute(null);
      setEstimatedFare(0);

      const directions = await getDirections(origin, destination, waypoints);
      if (!directions) {
        toast({ title: 'Error', description: 'No se pudo calcular la ruta.', variant: 'destructive' });
        return;
      }
      setRoute(directions);
    };
    calc();
  }, [origin, destination, waypoints, getDirections]);

  useEffect(() => {
    let alive = true;
    if (!selectedVehicle?.id || !route) return;

    const vehicleRefForRpc = { id: String(selectedVehicle.id), name: selectedVehicle?.name ?? '' };

    (async () => {
      try {
        setLoadingFare(true);
        const t = await fetchTariff(vehicleRefForRpc, 'scheduled');
        if (!alive) return;

        const base = Number(t?.base_fare ?? 0);
        const perKm = Number(t?.price_per_km ?? 0);
        const perMin = Number(t?.price_per_minute ?? 0);

        const distanceKm = Number(route?.distance ?? route?.estimated_distance_km ?? 0);
        const durationMin = Number(route?.duration ?? route?.estimated_duration_min ?? 0);

        const total = base + distanceKm * perKm + durationMin * perMin;
        setEstimatedFare(Number.isFinite(total) ? total : 0);
      } catch (e) {
        console.error('Tarifa error:', e);
        if (alive) {
          toast({
            title: 'Error de Tarifa',
            description: String(e?.message || 'No se encontraron tarifas para este vehículo.'),
            variant: 'destructive',
          });
          setEstimatedFare(0);
        }
      } finally {
        if (alive) setLoadingFare(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedVehicle, route]);

  const handleLocationSelect = (index, location) => {
    const next = [...stops];
    next[index] = { ...next[index], location: location };
    setStops(next);
  };

  const handleAddStop = () => {
    if (stops.length - 1 < maxStops) {
      setStops([...stops, { id: `stop-${Date.now()}`, location: null }]);
    } else {
      toast({ title: 'Límite alcanzado', description: `Podés agregar un máximo de ${maxStops} paradas.`, variant: 'default' });
    }
  };

  const handleRemoveStop = (index) => {
    if (stops.length > 1) {
      const next = stops.filter((_, i) => i !== index);
      setStops(next);
    }
  };

  const createShortfallLinkAndRedirect = async (amountDiff) => {
    const diff = Number(amountDiff || 0);
    if (!(diff > 0)) return;
    const externalReference = `SR-TOPUP-${user?.id || 'anon'}-${Date.now()}`;
    const url = await createPreference({
      amount: diff,
      externalReference,
      description: 'Cobertura de diferencia (viaje programado)',
    });
    if (!url) throw new Error('No se pudo generar el link de pago.');
    window.location.href = url;
  };

  const handleConfirmSchedule = async () => {
    if (!user || !origin || !destination || !pickupTime || !selectedVehicle || !route) {
      toast({ title: 'Faltan datos', description: 'Por favor completá todos los campos.', variant: 'destructive' });
      return;
    }

    if (isBefore(new Date(pickupTime), minPickupDateTime)) {
      toast({
        title: 'Hora no válida',
        description: `Debés programar con al menos ${scheduleSettings?.min_advance_notice_hours || 1} horas de anticipación.`,
        variant: 'destructive',
      });
      return;
    }

    const rideData = {
      origin_address: origin.address,
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      destination_address: destination.address,
      destination_lat: destination.lat,
      destination_lng: destination.lng,
      scheduled_pickup_time: new Date(pickupTime).toISOString(),
      fare_estimated: estimatedFare,
      vehicle_type_id: selectedVehicle.id,
      estimated_distance: route?.distance,
      estimated_duration: route?.duration,
      ride_type: 'scheduled',
      stops: stops.map((stop, index) => ({
        ...(stop.location || {}),
        order: index + 1,
        is_destination: index === stops.length - 1,
      })),
      route_polyline: route?.geometry?.coordinates ? JSON.stringify(route.geometry) : null,
    };

    const payKey = keyOf(selectedPaymentMethod);
    const balance = Number(wallet?.balance || 0);

    if (payKey === 'wallet' && balance < (estimatedFare || 0)) {
      setShowInlinePay(true);
      return;
    }

    try {
      setScheduling(true);

      const { data, error } = await supabase.rpc('process_ride_request_and_payment', {
        p_passenger_id: user.id,
        p_ride_data: rideData,
        p_payment_method: payKey,
      });

      setScheduling(false);

      if (error || (data && !data.success)) {
        console.error('process_ride_request_and_payment error:', error || data?.message);
        toast({
          title: 'Error al solicitar',
          description: data?.message || error?.message || 'Ocurrió un error inesperado.',
          variant: 'destructive',
        });
        return;
      }

      if (data.success && data.ride_id) {
        toast({
          title: '¡Viaje Programado!',
          description: 'Tu viaje ha sido agendado con éxito.',
          className: 'bg-green-600 text-white',
        });
        navigate('/passenger/my-rides');
      }
    } catch (e) {
      setScheduling(false);
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo procesar tu solicitud.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <GuidedTour run={runTour} steps={tourSteps} onTourEnd={() => setRunTour(false)} />

      <InlinePayModal
        open={showInlinePay}
        onClose={() => setShowInlinePay(false)}
        total={estimatedFare}
        walletBalance={wallet?.balance || 0}
        onGenerate={createShortfallLinkAndRedirect}
      />

      <ScheduleRideHeader step={step} onStepChange={setStep} />

      <main className="flex-grow p-4 overflow-y-auto pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: step === 1 ? 0 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <Step1_LocationTime
                origin={origin}
                onOriginSelect={setOrigin}
                stops={stops}
                onStopSelect={handleLocationSelect}
                onAddStop={handleAddStop}
                onRemoveStop={handleRemoveStop}
                maxStops={maxStops}
                pickupTime={pickupTime}
                onPickupTimeChange={setPickupTime}
                minPickupDateTime={format(minPickupDateTime, "yyyy-MM-dd'T'HH:mm")}
              />
            )}

            {step === 2 && (
              <Step2_VehiclePayment
                loadingPrerequisites={loadingPrerequisites}
                vehicleTypes={vehicleTypes}
                selectedVehicle={selectedVehicle}
                onVehicleSelect={setSelectedVehicle}
                selectedPaymentMethod={selectedPaymentMethod}
                onPaymentMethodSelect={setSelectedPaymentMethod}
                loadingFare={loadingFare}
                estimatedFare={estimatedFare}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <ScheduleRideFooter
        step={step}
        onStepChange={setStep}
        onConfirm={handleConfirmSchedule}
        isStep1Valid={!!origin && !!destination && !!pickupTime}
        isStep2Valid={!!selectedVehicle && !loadingFare}
        scheduling={scheduling}
      />

      <HelpButton onClick={() => setRunTour(true)} />
    </div>
  );
};

export default ScheduleRidePage;