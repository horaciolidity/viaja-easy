import { useState, useEffect, useRef, useCallback } from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
    import { useNotifications } from '@/contexts/NotificationContext';
    import { useLocation } from '@/contexts/LocationContext';
    import { supabase } from '@/lib/supabaseClient';
    import { setupRideSubscription } from './rideSubscription.js';
    import * as rideOperations from './rideOperations';
    import { toast } from '@/components/ui/use-toast';
    import { formatAvailableRide } from './utils';
    import { realtimeLocationService } from '@/services/realtimeLocationService';
    import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

    export const useRideState = () => {
        const { user, profile, loading: authLoading, updateProfile, logout } = useAuth();
        const { isOnline } = useNetworkStatus();
        const { sendNotification } = useNotifications();
        const { currentLocation, calculateRoute } = useLocation();
        
        const [currentRide, setCurrentRide] = useState(null);
        const [allUserRides, setAllUserRides] = useState([]);
        const [availableRides, setAvailableRides] = useState([]);
        const [passengerRides, setPassengerRides] = useState([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);

        const currentRideRef = useRef(currentRide);
        useEffect(() => {
            currentRideRef.current = currentRide;
        }, [currentRide]);
        
        const subscriptions = useRef(null);

        const executeOperation = useCallback(async (operation, ...args) => {
            if (!isOnline) {
              toast({ title: "Error de Red", description: "No hay conexión a internet.", variant: "destructive" });
              throw new Error("No hay conexión a internet.");
            }
            setLoading(true);
            setError(null);
            try {
              return await operation(...args);
            } catch (err) {
              setError(err.message);
              if (!NetworkErrorHandler.isAuthError(err)) {
                NetworkErrorHandler.handleError(err, 'operación de viaje');
              }
              if (NetworkErrorHandler.isAuthError(err)) {
                logout({ showToast: true });
              }
              throw err;
            } finally {
              setLoading(false);
            }
          }, [isOnline, logout]);

        const fetchRideById = useCallback(async (rideId) => {
            if (!rideId) {
                console.error("fetchRideById called with undefined rideId");
                return;
            }
            const { data, error } = await executeOperation(
                (...args) => supabase.rpc(...args), 
                'get_ride_details', 
                { p_ride_id: rideId }
            );
            
            if (error || !data?.success) {
                toast({ title: 'Error', description: `No se pudo cargar el viaje: ${error?.message || data?.message}`, variant: 'destructive' });
                return null;
            }

            const rideDetails = {
                ...data.ride,
                passenger: data.passenger,
                driver: data.driver,
            };
            
            return rideDetails;
        }, [executeOperation]);

        const getRideDetails = useCallback(async (rideId) => {
            const rideData = await fetchRideById(rideId);
            if (rideData) {
                setCurrentRide(rideData);
            }
            return rideData;
        }, [fetchRideById]);

        const loadUserRides = useCallback(async () => {
            if (!user || !profile) return;
            const { data } = await executeOperation(rideOperations.loadUserRidesAPI, user.id, profile.user_type);
            setAllUserRides(data || []);
            if (['passenger', 'driver'].includes(profile.user_type)) {
                const activeRide = (data || []).find(ride => 
                    !['completed', 'cancelled', 'cancelled_by_driver', 'cancelled_by_passenger'].includes(ride.status)
                );
                if (activeRide && (!currentRideRef.current || currentRideRef.current.id !== activeRide.id)) {
                    const fullRide = await fetchRideById(activeRide.id);
                    setCurrentRide(fullRide);
                } else if (!activeRide && currentRideRef.current) {
                    setCurrentRide(null);
                }
            }
        }, [user, profile, executeOperation, fetchRideById]);

        const loadAvailableRides = useCallback(async () => {
            if (!user || profile?.user_type !== 'driver' || profile?.status !== 'available') {
                setAvailableRides([]);
                return;
            };
            const { data } = await executeOperation(rideOperations.loadAvailableRidesAPI);
            setAvailableRides((data || []).map(formatAvailableRide));
        }, [user, profile, executeOperation]);
        
        const loadPassengerRides = useCallback(async () => {
            if (!user || profile?.user_type !== 'passenger') return;
            const { data } = await executeOperation(rideOperations.loadUserRidesAPI, user.id, 'passenger');
            setPassengerRides(data || []);
        }, [user, profile, executeOperation]);

        const requestRide = async (rideData) => {
            const data = await executeOperation(rideOperations.createRideAPI, rideData);
            const fullRide = await fetchRideById(data.id);
            setCurrentRide(fullRide);
            return fullRide;
        };
        
        const acceptRide = async (ride) => {
            if (!user || profile?.user_type !== 'driver') throw new Error("Solo los conductores pueden aceptar viajes.");
            if (!ride || !ride.id) throw new Error("Datos del viaje inválidos para aceptar.");
        
            const result = await executeOperation(
                rideOperations.acceptRideAPI, 
                ride.id, 
                ride.ride_type
            );
        
            if (!result.success || !result.ride) {
                throw new Error(result.message || "El viaje ya no está disponible.");
            }
            const acceptedRide = result.ride;
        
            await updateProfile({ status: 'on_trip' });
            toast({ title: "✅ Viaje aceptado", description: "Dirígete al punto de recogida." });
            
            const fullRideDetails = await fetchRideById(acceptedRide.id);
            setCurrentRide(fullRideDetails || acceptedRide);
            
            return fullRideDetails || acceptedRide;
        };

        const updateRideStatus = async (newStatus, validationData = {}) => {
            if (!currentRide?.id || !user) return { success: false, error: 'Viaje actual o usuario no definido' };
        
            const rideType = currentRide.ride_type || (currentRide.start_location_address ? 'hourly' : 'now');
            const rideId = currentRide.id;
        
            try {
                setLoading(true);
                let result;
                
                if (newStatus === 'driver_arrived') {
                    result = await rideOperations.driverArrivedAPI(rideId, rideType);
                } else if (newStatus === 'in_progress') {
                    result = await rideOperations.startRideAPI(rideId, rideType, validationData.pin_code);
                } else if (newStatus === 'completed') {
                    result = await rideOperations.completeRideAPI(rideId, rideType, validationData.actual_fare, validationData.driver_cash);
                } else {
                     result = await rideOperations.updateRideStatusAPI(rideId, newStatus, profile.user_type, rideType, validationData);
                }
        
                if (result.error) throw result.error;
        
                const updatedRide = await fetchRideById(rideId);
                if(updatedRide) {
                    setCurrentRide(updatedRide);
                     if (newStatus === 'completed' || newStatus.includes('cancelled')) {
                        await loadUserRides();
                        setCurrentRide(null);
                    }
                }
                return { success: true, data: updatedRide };

            } catch (error) {
                setError(error.message);
                NetworkErrorHandler.handleError(error, `actualización de estado de viaje a ${newStatus}`);
                if (NetworkErrorHandler.isAuthError(error)) {
                    logout({ showToast: true });
                }
                return { success: false, error: error.message };
            } finally {
                setLoading(false);
            }
        };

        const cancelRide = async (ride, reason) => {
            if (!ride || !ride.id || !user) return;
            const result = await executeOperation(rideOperations.cancelRideAPI, ride.id, ride.ride_type, reason);
            if (currentRide?.id === ride.id) {
                setCurrentRide(null);
            }
            toast({ title: "Viaje cancelado", description: result.message });
            loadUserRides();
            if (profile.user_type === 'passenger') loadPassengerRides();
            if (profile.user_type === 'driver') {
                await updateProfile({ status: 'available' });
                loadAvailableRides();
            }
            return result;
        };
          
        const updateRouteWithStops = async (origin, stops, destination) => {
            const { data, error } = await supabase.functions.invoke('update-route-for-stops', {
                body: { origin, stops, destination },
            });
    
            if (error) {
                throw new Error(error.message);
            }
    
            if (data.error) {
                throw new Error(data.error);
            }
            return data;
        };

        const addStop = async (rideId, rideType, stopData) => {
            if (!rideId || !currentRide) {
                 toast({ title: 'Error', description: "ID de viaje no encontrado.", variant: 'destructive' });
                 return { success: false, message: "ID de viaje no encontrado." };
            }
            
            const stopsSafe = Array.isArray(currentRide.stops) ? currentRide.stops : [];
        
            const waypoints = [
                currentRide.driver_last_location,
                ...stopsSafe.map(s => ({ lat: s.lat, lng: s.lng })),
                stopData,
                { lat: currentRide.destination_lat, lng: currentRide.destination_lng }
            ].filter(p => p && p.lat && p.lng);
        
            const newRoute = await calculateRoute(waypoints[0], waypoints[waypoints.length - 1], waypoints.slice(1, -1));
        
            if (!newRoute) {
                toast({ title: 'Error de Ruta', description: "No se pudo calcular la nueva ruta con la parada.", variant: 'destructive' });
                return { success: false, message: "No se pudo calcular la nueva ruta." };
            }
        
            const { data, error } = await executeOperation(rideOperations.addStopToRideAPI, rideId, rideType, stopData, newRoute);
            
            if (error) {
                toast({ title: 'Error al añadir parada', description: error.message, variant: 'destructive' });
                return { success: false, message: error.message };
            }
            
            toast({ title: "Parada añadida", description: "La ruta y la tarifa han sido actualizadas." });
            const updatedRide = await fetchRideById(rideId);
            setCurrentRide(updatedRide);
            return { success: true, data };
        };

        const getRideAuthInfo = async (rideId, rideType) => {
            return await executeOperation(rideOperations.getRideAuthInfoAPI, rideId, rideType);
        };

        const dismissRide = (rideId) => {
            setAvailableRides(prev => prev.filter(r => r.id !== rideId));
            toast({ title: "Viaje descartado", description: "No volverás a ver esta solicitud." });
        };

        useEffect(() => {
            if (user && profile) {
                loadUserRides();
                if (profile.user_type === 'driver') {
                    loadAvailableRides();
                }
            }
        }, [user, profile, loadUserRides, loadAvailableRides]);

        useEffect(() => {
            if (currentRide && user && ['driver_assigned', 'driver_arriving', 'in_progress', 'accepted'].includes(currentRide.status)) {
              realtimeLocationService.start(profile, currentRide.id, 
                (payload) => setCurrentRide(prev => prev ? { ...prev, driver_last_location: payload.location } : null),
                (payload) => setCurrentRide(prev => prev ? { ...prev, passenger_last_location: payload.location } : null)
              );
            } else {
              realtimeLocationService.stop();
            }
            return () => realtimeLocationService.stop();
        }, [currentRide?.id, currentRide?.status, profile]);

        useEffect(() => {
            const cleanupSubscriptions = () => {
                if (subscriptions.current) {
                    supabase.removeChannel(subscriptions.current).catch(err => console.error("Error al desuscribir de rides", err));
                    subscriptions.current = null;
                }
            };

            if (!isOnline || !user || authLoading) {
                cleanupSubscriptions();
                return;
            }

            if (subscriptions.current) return;
            
            subscriptions.current = setupRideSubscription(
                user, profile, loadAvailableRides, getRideDetails, currentRideRef, setCurrentRide
            );
            
            return cleanupSubscriptions;
        }, [user, profile, isOnline, authLoading, loadAvailableRides, getRideDetails]);

        return {
            currentRide, setCurrentRide, allUserRides, availableRides, passengerRides, 
            rides: availableRides, loading, error, requestRide, acceptRide,
            updateRideStatus, cancelRide, addStop, getRideDetails,
            loadAvailableRides, loadPassengerRides, loadUserRides, dismissRide,
            getRideAuthInfo, updateRouteWithStops
        };
    };