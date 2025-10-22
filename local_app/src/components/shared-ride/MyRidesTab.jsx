import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, PlayCircle } from 'lucide-react';
import MyRidesView from '@/components/shared-ride/MyRidesView';
import CreateSharedRideForm from '@/components/shared-ride/CreateSharedRideForm';
import { useNotifications } from '@/contexts/NotificationContext';

const MyRidesTab = ({ profile }) => {
  const [mySharedRides, setMySharedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [rideToEdit, setRideToEdit] = useState(null);
  const [isManaging, setIsManaging] = useState(null);
  const { toast } = useToast();
  const { sendNotification } = useNotifications();

  const fetchMySharedRides = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('shared_rides')
      .select('*, reservations:shared_ride_reservations(*, passenger:profiles!passenger_id(id, full_name, avatar_url, rating))')
      .eq('driver_id', profile.id)
      .order('departure_time', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar tus viajes publicados.', variant: 'destructive' });
    } else {
      setMySharedRides(data);
    }
    setLoading(false);
  }, [profile, toast]);

  useEffect(() => {
    fetchMySharedRides();
  }, [fetchMySharedRides]);

  const handleRideCreated = () => {
    fetchMySharedRides();
  };

  const handleEditRide = (ride) => {
    setRideToEdit(ride);
    setIsCreateFormOpen(true);
  };

  const handleDeleteRide = async (rideId) => {
    const { error } = await supabase.from('shared_rides').update({ status: 'cancelled' }).eq('id', rideId);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo cancelar el viaje.', variant: 'destructive' });
    } else {
      toast({ title: 'Viaje Cancelado', description: 'El viaje ha sido cancelado.' });
      fetchMySharedRides();
    }
  };

  const handleManageReservation = async (reservationId, action) => {
    setIsManaging(reservationId);
    const { data, error } = await supabase.rpc('manage_shared_ride_reservation', { p_reservation_id: reservationId, p_action: action });
    
    if (error || (data && !data.success)) {
      toast({ title: 'Error', description: error?.message || data?.message, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: data.message });
      
      if (action === 'confirm') {
        const reservation = mySharedRides
          .flatMap(ride => ride.reservations)
          .find(res => res.id === reservationId);
        
        if (reservation && reservation.passenger) {
          const ride = mySharedRides.find(r => r.id === reservation.shared_ride_id);
          const vehicle = profile.vehicle_info?.[0] || profile.vehicle_info || {};
          
          await sendNotification(reservation.passenger.id, {
            title: '¡Reserva Confirmada! 🎉',
            body: `Tu viaje a ${ride.destination_city} fue confirmado. Conductor: ${profile.full_name}. Vehículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate}).`,
            data: { url: `/passenger/my-rides` }
          });
        }
      }
      
      fetchMySharedRides();
    }
    setIsManaging(null);
  };
  
  const handleOpenCreateForm = () => {
    setRideToEdit(null);
    setIsCreateFormOpen(true);
  };

  const handleStartPickup = async (rideId) => {
    setIsManaging(rideId);
    const { data, error } = await supabase.rpc('start_shared_ride_pickup', { p_ride_id: rideId });

    if (error || !data.success) {
      toast({ title: 'Error', description: error?.message || data.message, variant: 'destructive' });
    } else {
      toast({ title: '¡Recorrido iniciado!', description: 'Se ha notificado a los pasajeros.' });
      fetchMySharedRides();
    }
    setIsManaging(null);
  };

  return (
    <>
      <div className="flex justify-between items-center my-3">
        <h2 className="text-lg font-semibold text-gray-800">Tus viajes publicados</h2>
        <Button onClick={handleOpenCreateForm} id="publish-ride-button">
          <PlusCircle className="w-4 h-4 mr-2" /> Publicar Viaje
        </Button>
      </div>
      {loading ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" /> : 
        <MyRidesView 
          rides={mySharedRides} 
          onEdit={handleEditRide} 
          onDelete={handleDeleteRide}
          onManageReservation={handleManageReservation}
          onStartPickup={handleStartPickup}
          isManaging={isManaging}
        />
      }
      <CreateSharedRideForm 
        open={isCreateFormOpen} 
        onOpenChange={setIsCreateFormOpen} 
        onRideCreated={handleRideCreated} 
        rideToEdit={rideToEdit} 
      />
    </>
  );
};

export default MyRidesTab;