
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation as useReactRouterLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, PlusCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/contexts/LocationContext';
import { useRide } from '@/contexts/RideContext';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import BookingMap from '@/components/ride-booking/BookingMap';
import LocationInput from '@/components/common/LocationInput';
import BookingConfirmationPanel from '@/components/ride-booking/BookingConfirmationPanel';
import PaymentModal from '@/components/ride-booking/PaymentModal';
import { getActiveVehicleTypes } from '@/services/vehicleTypeService';
import { fetchTariff } from '@/services/tariffService';
import HelpButton from '@/components/common/HelpButton';
import GuidedTour from '@/components/common/GuidedTour';
import { formatCurrencyARS } from '@/utils/mercadoPago';

const RideBookingPage = () => {
  const navigate = useNavigate();
  const { state: routeState } = useReactRouterLocation();
  const { user, profile } = useAuth();

  const {
    currentLocation,
    route,
    calculateRoute,
    loading: locationLoading,
    clearRoute
  } = useLocation();

  const { loading: rideLoading } = useRide();
  const { wallet } = usePayment(); // solo balance
  const { settings, loading: loadingSettings } = useSettings();

  const [origin, setOrigin] = useState(null);
  const [stops, setStops] = useState([]);
  const [destination, setDestination] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loadingPrerequisites, setLoadingPrerequisites] = useState(true);
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState(null);

  const [numPassengers, setNumPassengers] = useState([1]);
  const [driverGenderPreference, setDriverGenderPreference] = useState('any');

  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [isRouteConfirmed, setIsRouteConfirmed] = useState(false);
  const [runTour, setRunTour] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({ totalAmount: 0, rideData: null, fare_estimated: 0 });

  const [tariff, setTariff] = useState(null);
  const [loadingFare, setLoadingFare] = useState(false);

  // (opcional) si querés usarlo más adelante
  // const maxStops = parseInt(settings?.appSettings?.max_stops_immediate_ride, 10) || 4;

  const tourSteps = [
    { target: '#origin-input', content: 'Aquí ingresas o confirmas tu punto de partida. ¡Podés mover el mapa para ajustar!', disableBeacon: true },
    { target: '#destination-input', content: 'Decinos a dónde querés ir. Escribí la dirección o el nombre del lugar.' },
    { target: '#confirm-route-button', content: 'Con origen y destino, confirmá la ruta para ver opciones y tarifas.' },
    { target: '#vehicle-options', content: 'Elegí el tipo de vehículo. Vas a ver la tarifa estimada.' },
    { target: '#payment-method', content: 'Este es tu método de pago. Podés cambiarlo.' },
    { target: '#confirm-ride-button', content: '¡Listo! Presioná acá para confirmar y solicitar el viaje.' },
  ];

  // Redirect si no está logueado
  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  // Carga tipos de vehículo
  useEffect(() => {
    const fetchPrerequisites = async () => {
      setLoadingPrerequisites(true);
      try {
        const types = await getActiveVehicleTypes();
        setVehicleTypes(types || []);
        if (types && types.length > 0) setSelectedVehicleTypeId(types[0].id);
      } catch {
        toast({ title: 'Error', description: 'No se pudieron cargar los datos necesarios para reservar.', variant: 'destructive' });
      } finally {
        setLoadingPrerequisites(false);
      }
    };
    fetchPrerequisites();
  }, []);

  // Relleno desde navegación previa
  useEffect(() => {
    if (routeState?.rideData) {
      const { origin: rOrigin, destination: rDest, stops: rStops } = routeState.rideData;
      setOrigin(rOrigin);
      setDestination(rDest);
      setStops(rStops || []);
      if (rOrigin && rDest) {
        calculateRoute(rOrigin, rDest, rStops || []);
        setIsRouteConfirmed(true);
      }
    } else if (currentLocation && !origin) {
      setOrigin(currentLocation);
    }
  }, [routeState, currentLocation, origin, calculateRoute]);

  const handleSelectOrigin = (location) => { clearRoute(); setIsRouteConfirmed(false); setOrigin(location); };
  const handleSelectDestination = (location) => { clearRoute(); setIsRouteConfirmed(false); setDestination(location); };

  const handleConfirmRoute = useCallback(async () => {
    if (!origin || !destination) {
      toast({ title: 'Faltan datos', description: 'Definí un origen y un destino.', variant: 'destructive' });
      return;
    }
    try {
      await calculateRoute(origin, destination, stops);
      setIsRouteConfirmed(true);
    } catch {
      toast({ title: 'Error de ruta', description: 'No se pudo calcular la ruta. Probá con otras direcciones.', variant: 'destructive' });
    }
  }, [origin, destination, stops, calculateRoute]);

  const selectedVehicleType = useMemo(
    () => vehicleTypes.find(vt => vt.id === selectedVehicleTypeId),
    [vehicleTypes, selectedVehicleTypeId]
  );

  /** =========================
   *  TARIFA
   *  ========================= */
  useEffect(() => {
    let mounted = true;
    if (!isRouteConfirmed || !selectedVehicleTypeId) return;

    const vehicleRefForRpc = {
      id: String(selectedVehicleTypeId),
      name: selectedVehicleType?.name ?? ''
    };

    (async () => {
      try {
        setLoadingFare(true);
        const t = await fetchTariff(vehicleRefForRpc, 'now');
        if (!mounted) return;
        setTariff(t);
      } catch (e) {
        console.error('Tarifa error:', e);
        if (mounted) {
          toast({
            title: 'Error',
            description: String(e?.message || 'No se encontraron tarifas para este vehículo y tipo.'),
            variant: 'destructive'
          });
        }
        setTariff(null);
      } finally {
        if (mounted) setLoadingFare(false);
      }
    })();

    return () => { mounted = false; };
  }, [selectedVehicleTypeId, selectedVehicleType, isRouteConfirmed]);

  // Estimación local
  const estimatedFare = useMemo(() => {
    if (!tariff || !route) return 0;

    const base = Number(tariff?.base_fare ?? 0);
    const perKm = Number(tariff?.price_per_km ?? 0);
    const perMin = Number(tariff?.price_per_minute ?? 0);

    const distanceKm = Number(route?.distance ?? route?.estimated_distance_km ?? 0);
    const durationMin = Number(route?.duration ?? route?.estimated_duration_min ?? 0);

    const total = base + distanceKm * perKm + durationMin * perMin;
    return Number.isFinite(total) ? total : 0;
  }, [tariff, route]);

  // Confirmación y pago — delega TODO al PaymentModal (wallet-first + MP resto)
  const handleConfirmAndPay = () => {
    if (!user || !profile) {
      toast({ title: 'Error', description: 'Debés iniciar sesión para solicitar un viaje.', variant: 'destructive' });
      return;
    }
    if (!origin || !origin.address || !origin.lat || !origin.lng) {
      toast({ title: 'Error', description: 'El punto de partida no es válido. Seleccionalo de nuevo.', variant: 'destructive' });
      return;
    }
    if (!destination || !destination.address || !destination.lat || !destination.lng) {
      toast({ title: 'Error', description: 'El destino no es válido. Seleccionalo de nuevo.', variant: 'destructive' });
      return;
    }
    if (!estimatedFare) {
      toast({ title: 'Sin tarifa', description: 'Calculá la tarifa antes de solicitar.', variant: 'destructive' });
      return;
    }

    const rideStops = stops.map((stop, index) => ({ ...stop, order: index + 1 }));

    const rideData = {
      origin_address: origin.address,
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      destination_address: destination.address,
      destination_lat: destination.lat,
      destination_lng: destination.lng,
      estimated_distance_km: route?.distance,
      estimated_duration_min: route?.duration,
      vehicle_type_id: selectedVehicleTypeId,
      preferred_driver_gender: driverGenderPreference || 'any',
      stops: rideStops,
      route_polyline: route?.geometry?.coordinates ? JSON.stringify(route.geometry) : null,
      ride_type: 'now'
    };

    const totalAmount = Number(estimatedFare) + Number(profile?.pending_debt || 0);

    setPaymentDetails({ totalAmount, rideData, fare_estimated: Number(estimatedFare) });
    setShowPaymentModal(true);
  };

  if ((locationLoading && !currentLocation) || loadingPrerequisites || loadingSettings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative">
      <GuidedTour run={runTour} steps={tourSteps} onTourEnd={() => setRunTour(false)} />
      <BookingMap
        origin={origin}
        destination={destination}
        routeGeometry={route?.geometry}
        isMapInteracting={isMapInteracting}
        setIsMapInteracting={setIsMapInteracting}
        isRouteConfirmed={isRouteConfirmed}
      />

      <div className={`absolute top-0 left-0 right-0 p-4 pt-safe-top transition-all duration-300 ${isInputFocused ? 'bg-black/10 backdrop-blur-sm' : ''}`}>
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100">
            <ArrowLeft className="h-6 w-6 text-black" />
          </button>
        </div>

        <AnimatePresence>
          {!isRouteConfirmed && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
              <div className="space-y-3 bg-white p-4 rounded-xl shadow-lg">
                <div id="origin-input">
                  <LocationInput
                    value={origin}
                    onLocationSelect={handleSelectOrigin}
                    placeholder="Punto de partida"
                    isOrigin
                    disabled={isRouteConfirmed}
                    onFocusChange={setIsInputFocused}
                  />
                </div>

                <div id="destination-input">
                  <LocationInput
                    value={destination}
                    onLocationSelect={handleSelectDestination}
                    placeholder="¿A dónde vas?"
                    disabled={!origin || isRouteConfirmed}
                    onFocusChange={setIsInputFocused}
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate('/trami/add-stops', { state: { origin, destination, stops } })}
                  className="w-full"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {stops.length > 0 ? `Editar ${stops.length} parada(s)` : 'Añadir paradas'}
                </Button>

                {origin && destination && (
                  <div id="confirm-route-button">
                    <Button
                      onClick={handleConfirmRoute}
                      className="w-full h-12 bg-green-500 hover:bg-green-600 text-white text-base font-bold"
                      disabled={!origin || !destination}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirmar Ruta
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isRouteConfirmed && route && (
          <BookingConfirmationPanel
            route={route}
            onConfirm={handleConfirmAndPay}
            isLoading={rideLoading || loadingPrerequisites || loadingFare}
            vehicleTypes={vehicleTypes}
            selectedVehicleTypeId={selectedVehicleTypeId}
            setSelectedVehicleTypeId={setSelectedVehicleTypeId}
            selectedVehicleType={selectedVehicleType}
            numPassengers={numPassengers}
            setNumPassengers={setNumPassengers}
            driverGenderPreference={driverGenderPreference}
            setDriverGenderPreference={setDriverGenderPreference}
            onEditRoute={() => { setIsRouteConfirmed(false); clearRoute(); }}
            stopsCount={stops.length}
            estimatedFare={estimatedFare}
          />
        )}
      </AnimatePresence>

      {profile?.pending_debt > 0 && (
        <div className="absolute top-24 right-4 bg-yellow-400 text-black p-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-bold">Tenés una deuda de {formatCurrencyARS(profile.pending_debt)}</span>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          totalAmount={paymentDetails.totalAmount}
          walletBalance={wallet?.balance || 0}
          rideData={paymentDetails.rideData}
          fare_estimated={paymentDetails.fare_estimated}
          rpcName="process_mixed_payment_ride_creation"
          onWalletOnlySuccess={(data) => {
            const id = data?.ride_id || data?.ride?.id;
            if (id) navigate(`/tracking/${id}`);
          }}
        />
      )}

      <HelpButton onClick={() => setRunTour(true)} />
    </div>
  );
};

export default RideBookingPage;
