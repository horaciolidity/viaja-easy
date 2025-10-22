import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { useAuth } from '@/contexts/AuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2, AlertTriangle, Star } from 'lucide-react';
    import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
    import PassengerTrackingMap from '@/components/tracking/PassengerTrackingMap';
    import { motion } from 'framer-motion';
    import { formatDuration, formatDistance } from '@/utils/geolocation';
    import PassengerValidationInfo from '@/components/tracking/PassengerValidationInfo';

    const STATUS_TEXT = {
      driver_assigned: "Tu conductor está en camino",
      accepted: "Tu conductor está en camino",
      driver_arriving: "Tu conductor está llegando",
      driver_arrived: "Tu conductor está en la puerta",
      in_progress: "En camino a tu destino",
      completed: "Viaje completado",
      cancelled: "Viaje cancelado",
    };

    const PassengerTracking = ({ rideId }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const [ride, setRide] = useState(null);
      const [driver, setDriver] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [eta, setEta] = useState({ duration: null, distance: null });
      const [routePolyline, setRoutePolyline] = useState(null);
      
      const rideSubscriptionRef = useRef(null);
      const driverSubscriptionRef = useRef(null);
      const routeFetchIntervalRef = useRef(null);

      const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = '/images/default-avatar.png';
      };

      const fetchRideDetails = useCallback(async () => {
        setLoading(true);
        const { data, error: rpcError } = await supabase.rpc('get_ride_details', { p_ride_id: rideId });
        
        if (rpcError || !data?.success) {
          setError(rpcError?.message || data?.message || "No se pudo cargar el viaje.");
          toast({ variant: 'destructive', title: 'Error', description: rpcError?.message || data?.message });
          setLoading(false);
          return;
        }

        const rideData = { ...data.ride, passenger: data.passenger, driver: data.driver };
        setRide(rideData);
        if (rideData.driver) {
          setDriver(rideData.driver);
        }
        setLoading(false);
      }, [rideId, toast]);

      const fetchRoute = useCallback(async (start, end) => {
        if(!start || !end || !start.lat || !end.lat) return;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            setRoutePolyline(route.geometry);
            setEta({ duration: route.duration, distance: route.distance });
          }
        } catch (err) {
          console.error("Error fetching route:", err);
        }
      }, []);

      useEffect(() => {
        fetchRideDetails();
      }, [fetchRideDetails]);

      useEffect(() => {
        if (routeFetchIntervalRef.current) {
          clearInterval(routeFetchIntervalRef.current);
        }

        if (!ride || !driver?.last_location) return;

        let startPoint, endPoint;

        if (['driver_assigned', 'accepted', 'driver_arriving'].includes(ride.status)) {
          startPoint = driver.last_location;
          endPoint = ride.origin;
        } else if (ride.status === 'in_progress') {
          startPoint = driver.last_location;
          endPoint = ride.destination;
        } else {
          setRoutePolyline(null);
          setEta({ duration: null, distance: null });
          return;
        }
        
        if(startPoint && endPoint) {
            const fetchAndSetRoute = () => fetchRoute(startPoint, endPoint);
            fetchAndSetRoute();
            routeFetchIntervalRef.current = setInterval(fetchAndSetRoute, 25000);
        }
        
        return () => {
          if (routeFetchIntervalRef.current) {
            clearInterval(routeFetchIntervalRef.current);
          }
        };
      }, [ride?.status, driver?.last_location, ride?.origin, ride?.destination, fetchRoute]);


      useEffect(() => {
        if (!ride || rideSubscriptionRef.current) return;

        const handleRideUpdate = (payload) => {
          setRide(prev => ({ ...prev, ...payload.new }));
          if (payload.new.status === 'driver_arrived') {
            toast({ title: "¡Tu conductor llegó!", description: "Por favor, encuéntralo en el punto de partida." });
            if (navigator.vibrate) navigator.vibrate(200);
          }
        };

        rideSubscriptionRef.current = supabase
          .channel(`rides-changes-for-tracking-${ride.id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${ride.id}` }, handleRideUpdate)
          .subscribe();

        return () => {
          if (rideSubscriptionRef.current) {
            supabase.removeChannel(rideSubscriptionRef.current).catch(e => console.error("Error removing ride channel:", e));
            rideSubscriptionRef.current = null;
          }
        };
      }, [ride, toast]);

      useEffect(() => {
        if (!driver?.id || driverSubscriptionRef.current) return;

        const handleDriverUpdate = (payload) => {
          if (payload.new.last_location) {
              setDriver(prev => ({ ...prev, ...payload.new }));
          }
        };

        driverSubscriptionRef.current = supabase
          .channel(`profiles-changes-for-tracking-${driver.id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${driver.id}` }, handleDriverUpdate)
          .subscribe();

        return () => {
          if (driverSubscriptionRef.current) {
            supabase.removeChannel(driverSubscriptionRef.current).catch(e => console.error("Error removing driver channel:", e));
            driverSubscriptionRef.current = null;
          }
        };
      }, [driver?.id]);
      
      const mapPoints = useMemo(() => {
        const points = {};
        if (driver?.last_location) points.driver = { ...driver.last_location, bearing: driver.last_location.bearing || 0 };
        if (ride?.origin) points.origin = ride.origin;
        if (ride?.destination) points.destination = ride.destination;
        return points;
      }, [driver, ride]);

      const etaText = useMemo(() => {
        if (!eta.duration) return null;
        const minutes = Math.ceil(eta.duration / 60);
        if (minutes < 1) return "Menos de 1 min";
        return `${minutes} min`;
      }, [eta.duration]);

      if (loading) {
        return <div className="flex items-center justify-center h-full w-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
      }

      if (error) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold">Error al Cargar Viaje</h2>
            <p className="text-slate-500 mt-2">{error}</p>
          </div>
        );
      }

      if (!ride) return null;

      const vehicle = driver?.vehicle_info || {};
      const partialPlate = vehicle.plate ? vehicle.plate.slice(-3) : '';

      return (
        <div className="h-full w-full flex flex-col bg-slate-100 dark:bg-slate-950">
          <div className="flex-grow relative">
            <PassengerTrackingMap points={mapPoints} routeGeometry={routePolyline} status={ride.status} />
          </div>

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="bg-white dark:bg-slate-900 shadow-top rounded-t-2xl p-4 border-t-2 border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold">{STATUS_TEXT[ride.status] || 'Estado del viaje'}</h2>
                <div className="flex items-baseline space-x-2">
                  {eta.duration && (
                    <p className="text-3xl text-primary font-bold">
                      {etaText}
                    </p>
                  )}
                  {eta.distance && (
                     <p className="text-md text-slate-500 font-normal">
                      ({formatDistance(eta.distance / 1000)})
                    </p>
                  )}
                </div>
              </div>
              <Avatar className="h-16 w-16 border-4 border-white dark:border-slate-800 shadow-md">
                <AvatarImage src={driver?.avatar_url} alt={driver?.full_name || 'Conductor'} onError={handleImageError} />
                <AvatarFallback>{driver?.full_name?.charAt(0) || 'C'}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mt-4">
              <div>
                <p className="font-semibold text-lg">{driver?.full_name}</p>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                  <span>{driver?.rating?.toFixed(1) || 'Nuevo'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{vehicle.color}</p>
                {partialPlate && <p className="text-sm font-mono bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded mt-1">***{partialPlate}</p>}
              </div>
            </div>

            {['driver_arrived', 'driver_arriving'].includes(ride.status) && <PassengerValidationInfo ride={ride} />}
          </motion.div>
        </div>
      );
    };

    export default PassengerTracking;