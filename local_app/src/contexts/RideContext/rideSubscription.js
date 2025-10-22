import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { playNotificationSound } from '@/contexts/AudioContext';

export const setupRideSubscription = (user, profile, reloadAvailableRides, getRideDetails, currentRideRef, setCurrentRide) => {
    const handleRealtimeEvent = async (payload) => {
        const rideId = payload.new?.id || payload.old?.id;
        
        if (profile?.user_type === 'driver' && profile.status === 'available') {
            if (payload.eventType === 'INSERT' && payload.new?.status === 'searching') {
                playNotificationSound('viaje_nuevo');
                toast({
                    title: "¡Nuevo viaje disponible!",
                    description: "Revisa la lista de viajes para aceptarlo.",
                });
            }
            await reloadAvailableRides();
        }

        if (currentRideRef.current && currentRideRef.current.id === rideId) {
            const updatedRide = await getRideDetails(rideId);
            if (updatedRide && ['completed', 'cancelled', 'cancelled_by_driver', 'cancelled_by_passenger'].includes(updatedRide.status)) {
                setCurrentRide(null);
            } else {
                setCurrentRide(updatedRide);
            }
        } else if (profile?.user_type === 'driver' && payload.new?.driver_id === user.id && !currentRideRef.current) {
            const fullRide = await getRideDetails(rideId);
            setCurrentRide(fullRide);
        }
    };

    const channel = supabase.channel(`public-rides-and-more`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, handleRealtimeEvent)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_rides' }, handleRealtimeEvent)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hourly_bookings' }, handleRealtimeEvent)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'package_deliveries' }, handleRealtimeEvent)
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log('Conectado al canal de viajes en tiempo real.');
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('Error en el canal de tiempo real:', err);
            }
        });

    return channel;
};