
import React, { useEffect, useMemo, useState, useCallback } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { useAuth } from '@/contexts/AuthContext';
    import { useRide } from '@/contexts/RideContext';
    import { useLocation } from '@/contexts/LocationContext';
    import { toast } from '@/components/ui/use-toast';
    import { AnimatePresence, motion } from 'framer-motion';
    import { Loader2, ArrowLeft, PlusCircle } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import DriverNavigationView from '@/components/tracking/DriverNavigationView';
    import PassengerMapView from '@/components/tracking/PassengerMapView';
    import TrackingInfoPanel from '@/components/tracking/TrackingInfoPanel';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
    import LocationInput from '@/components/common/LocationInput';

    const AddStopModal = ({ isOpen, onClose, onAddStop, isLoading }) => {
      const [newStop, setNewStop] = useState(null);

      const handleAdd = () => {
        if (newStop) {
          onAddStop(newStop);
        }
      };

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nueva Parada</DialogTitle>
              <DialogDescription>
                Busca y selecciona la dirección de tu nueva parada. La tarifa se recalculará.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <LocationInput
                onLocationSelect={setNewStop}
                placeholder="Buscar dirección de la parada"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={!newStop || isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Añadir y Recalcular
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };


    const RideTracking = () => {
      const { rideId } = useParams();
      const navigate = useNavigate();
      const { user, profile, loading: authLoading } = useAuth();
      const { currentRide, getRideDetails, updateRideStatus, cancelRide, addStop, loading: rideLoading } = useRide();
      const { currentLocation } = useLocation();
      const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);

      const fetchRideDetails = useCallback(async () => {
        if (rideId && profile) {
          await getRideDetails(rideId);
        }
      }, [rideId, getRideDetails, profile]);
    
      useEffect(() => {
        if (rideId && (!currentRide || currentRide.id !== rideId)) {
          fetchRideDetails();
        }
      }, [rideId, currentRide, fetchRideDetails]);

      useEffect(() => {
        if (currentRide?.status && (currentRide.status === 'completed' || currentRide.status.startsWith('cancelled'))) {
          toast({
            title: `Viaje ${currentRide.status === 'completed' ? 'finalizado' : 'cancelado'}`,
            description: 'Serás redirigido a tu panel principal.',
          });
          setTimeout(() => {
            const homePath = profile?.user_type === 'driver' ? '/driver' : '/passenger';
            navigate(homePath, { replace: true });
          }, 2000);
        }
      }, [currentRide?.status, navigate, profile?.user_type]);

      const handleUpdateStatus = async (newStatus, validationData) => {
        if (!currentRide) return;
        try {
            const fullValidationData = {
                ...validationData,
                driverLocation: currentLocation
            };
          await updateRideStatus(newStatus, fullValidationData);
        } catch (error) {
          toast({ title: 'Error', description: 'No se pudo actualizar el estado del viaje.', variant: 'destructive' });
        }
      };

      const handleCancelRide = async (reason) => {
        if (!currentRide) return;
        try {
          await cancelRide(currentRide, reason);
        } catch (error) {
          toast({ title: 'Error', description: error.message || 'No se pudo cancelar el viaje.', variant: 'destructive' });
        }
      };

      const handleAddStop = async (stopData) => {
        if (!currentRide) return;
        const result = await addStop(currentRide.id, currentRide.ride_type, stopData);
        if (result.success) {
          setIsAddStopModalOpen(false);
        } else {
          toast({ title: 'Error al añadir parada', description: result.message, variant: 'destructive' });
        }
      };

      const handleChat = () => {
        navigate(`/chat/${rideId}`);
      };

      const handleBackToDashboard = () => {
        const homePath = profile?.user_type === 'driver' ? '/driver' : '/passenger';
        navigate(homePath);
      };

      const isDriver = profile?.user_type === 'driver';
      const isPassenger = profile?.user_type === 'passenger';

      const driverOrigin = useMemo(() => {
        if (!currentRide || !isDriver) return null;
        return currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null;
      }, [currentRide, isDriver, currentLocation]);

      const driverDestination = useMemo(() => {
        if (!currentRide || !isDriver) return null;
        
        const targetStatus = ['driver_assigned', 'driver_arriving', 'accepted'];
        if (targetStatus.includes(currentRide.status)) {
            const originLat = currentRide.origin?.lat ?? currentRide.origin_lat ?? currentRide.start_location_lat;
            const originLng = currentRide.origin?.lng ?? currentRide.origin_lng ?? currentRide.start_location_lng;
            return { lat: originLat, lng: originLng };
        }

        const stopsSafe = Array.isArray(currentRide.stops) ? currentRide.stops : [];
        const nextStop = stopsSafe.find(s => !s.completed_at);
        if(nextStop) {
             return { lat: nextStop.lat, lng: nextStop.lng };
        }

        if (currentRide.ride_type !== 'hourly') {
            const destLat = currentRide.destination?.lat ?? currentRide.destination_lat;
            const destLng = currentRide.destination?.lng ?? currentRide.destination_lng;
            return { lat: destLat, lng: destLng };
        }

        return null;
      }, [currentRide, isDriver]);

      if (authLoading || (!currentRide && rideLoading)) {
        return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-xl">Cargando viaje...</p>
          </div>
        );
      }

      if (!currentRide) {
        return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100">
            <p className="text-xl text-slate-600">No se encontró el viaje.</p>
            <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Volver al inicio</button>
          </div>
        );
      }
      
      const passengerViewRideData = {
          ...currentRide,
          origin_lat: currentRide.origin?.lat ?? currentRide.origin_lat,
          origin_lng: currentRide.origin?.lng ?? currentRide.origin_lng,
          destination_lat: currentRide.destination?.lat ?? currentRide.destination_lat,
          destination_lng: currentRide.destination?.lng ?? currentRide.destination_lng,
      };

      return (
        <div className="h-screen w-screen bg-slate-800 relative overflow-hidden">
          <AnimatePresence>
            <motion.div
              key={isDriver ? 'driver-view' : 'passenger-view'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full w-full"
            >
              {isDriver ? (
                <DriverNavigationView 
                  origin={driverOrigin}
                  destination={driverDestination}
                  driverLocation={currentLocation}
                  rideStatus={currentRide.status}
                />
              ) : (
                <PassengerMapView ride={passengerViewRideData} />
              )}
            </motion.div>
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-5 left-5 z-20 flex gap-2"
          >
            <Button
              onClick={handleBackToDashboard}
              variant="secondary"
              className="rounded-full h-12 w-12 p-0 shadow-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            {isPassenger && currentRide.status === 'in_progress' && (
              <Button
                onClick={() => setIsAddStopModalOpen(true)}
                variant="secondary"
                className="rounded-full h-12 w-12 p-0 shadow-lg"
              >
                <PlusCircle className="w-6 h-6" />
              </Button>
            )}
          </motion.div>

          <TrackingInfoPanel
            ride={currentRide}
            user={user}
            profile={profile}
            onAction={handleUpdateStatus}
            onCancel={handleCancelRide}
            onChat={handleChat}
            isLoading={rideLoading}
          />

          <AddStopModal
            isOpen={isAddStopModalOpen}
            onClose={() => setIsAddStopModalOpen(false)}
            onAddStop={handleAddStop}
            isLoading={rideLoading}
          />
        </div>
      );
    };

    export default RideTracking;
