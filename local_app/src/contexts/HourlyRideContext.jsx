import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
    import {
        getHourlyRideSettings,
        createHourlyRideRequest as createHourlyRideRequestService,
        getDriverAndAvailableHourlyBookings,
        getPassengerHourlyBookings as getPassengerHourlyBookingsService,
        cancelBooking as cancelBookingService,
        updateHourlyBookingStatus as updateHourlyBookingStatusService
    } from '@/services/hourlyRideService';
    import { useAuth } from './AuthContext';
    import { useSettings } from './SettingsContext';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import { useNotifications } from './NotificationContext';

    const HourlyRideContext = createContext(null);

    export const useHourlyRide = () => {
        const context = useContext(HourlyRideContext);
        if (!context) {
            throw new Error('useHourlyRide debe usarse dentro de un HourlyRideProvider');
        }
        return context;
    };

    export const HourlyRideProvider = ({ children }) => {
        const { user, profile } = useAuth();
        const { settings, loading: loadingSettings } = useSettings();
        const { sendNotification } = useNotifications();
        const [bookingLoading, setBookingLoading] = useState(false);
        
        const [driverBookings, setDriverBookings] = useState([]);
        const [availableBookings, setAvailableBookings] = useState([]);
        const [loadingDriverBookings, setLoadingDriverBookings] = useState(false);

        const [passengerBookings, setPassengerBookings] = useState([]);
        const [loadingPassengerBookings, setLoadingPassengerBookings] = useState(false);
        const [hourlySettings, setHourlySettings] = useState(null);

        useEffect(() => {
          const fetchSettings = async () => {
            const data = await getHourlyRideSettings();
            setHourlySettings(data);
          };
          fetchSettings();
        }, []);

        const createHourlyRideRequest = async (bookingData) => {
            if (!user) {
                toast({ title: 'Error', description: 'Debes iniciar sesión para reservar.', variant: 'destructive' });
                return null;
            }
            setBookingLoading(true);
            try {
                const newBooking = await createHourlyRideRequestService({
                    ...bookingData,
                    passenger_id: user.id,
                    status: 'pending'
                });
                toast({
                    title: '¡Reserva Exitosa!',
                    description: 'Tu viaje por hora ha sido solicitado. Buscando un conductor...',
                    className: 'bg-green-600 text-white'
                });
                setPassengerBookings(prev => [newBooking, ...prev]);
                return newBooking;
            } catch (error) {
                toast({
                    title: 'Error al Reservar',
                    description: error.message || 'No se pudo crear la reserva. Inténtalo de nuevo.',
                    variant: 'destructive',
                });
                return null;
            } finally {
                setBookingLoading(false);
            }
        };

        const fetchDriverHourlyBookings = useCallback(async () => {
            if (!user || profile?.user_type !== 'driver') return;
            setLoadingDriverBookings(true);
            try {
                const { assigned, available } = await getDriverAndAvailableHourlyBookings(user.id);
                setDriverBookings(assigned);
                setAvailableBookings(available);
            } catch (error) {
                console.error("Error fetching driver hourly bookings:", error);
                toast({
                    title: "Error al cargar reservas",
                    description: "No se pudieron obtener las reservas por hora.",
                    variant: "destructive",
                });
            } finally {
                setLoadingDriverBookings(false);
            }
        }, [user, profile]);
        
        const updateLocalBookingState = (updatedBooking) => {
          setDriverBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
          setPassengerBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
        };

        const startHourlyRide = async (bookingId) => {
            if (!user) return;
            try {
                const updatedBooking = await updateHourlyBookingStatusService(bookingId, 'in_progress', { actual_start_time: new Date().toISOString() });
                updateLocalBookingState(updatedBooking);
                toast({ title: "Viaje Iniciado", description: "¡Buen viaje!", className: 'bg-blue-600 text-white' });
                await sendNotification(updatedBooking.passenger_id, {
                   type: 'booking_in_progress',
                   title: '¡Tu viaje ha comenzado!', 
                   body: 'Tu conductor ha iniciado el viaje por horas.',
                   payload: { bookingId: updatedBooking.id } 
                });
            } catch (error) {
                toast({ title: "Error al iniciar", description: error.message, variant: "destructive" });
            }
        };
        
        const completeHourlyRide = async (booking) => {
            if (!user) return;
            try {
                const updatedBooking = await updateHourlyBookingStatusService(booking.id, 'completed', { 
                    actual_end_time: new Date().toISOString()
                });
                
                updateLocalBookingState(updatedBooking);
                toast({ title: "Viaje Finalizado", description: "El pago ha sido procesado a tu billetera.", className: 'bg-green-600 text-white' });
                await sendNotification(updatedBooking.passenger_id, { 
                  type: 'booking_completed',
                  title: '¡Viaje completado!', 
                  body: 'Tu viaje por horas ha finalizado.',
                  payload: { bookingId: updatedBooking.id }
                });
            } catch (error) {
                toast({ title: "Error al finalizar", description: error.message, variant: "destructive" });
            }
        };

        const fetchPassengerHourlyBookings = useCallback(async () => {
            if (!user || profile?.user_type !== 'passenger') return;
            setLoadingPassengerBookings(true);
            try {
                const data = await getPassengerHourlyBookingsService(user.id);
                setPassengerBookings(data);
            } catch (error) {
                console.error("Error fetching passenger hourly bookings:", error);
                toast({
                    title: "Error al cargar tus reservas",
                    description: "No se pudieron obtener tus reservas por hora.",
                    variant: "destructive",
                });
            } finally {
                setLoadingPassengerBookings(false);
            }
        }, [user, profile]);

        const cancelBooking = async (bookingId) => {
            if (!user) return false;
            try {
                const cancelledBooking = await cancelBookingService(bookingId);
                toast({
                    title: "Reserva Cancelada",
                    description: "Tu reserva ha sido cancelada exitosamente.",
                    className: 'bg-blue-600 text-white'
                });
                setPassengerBookings(prev => 
                    prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b)
                );
                return true;
            } catch (error) {
                toast({
                    title: "Error al Cancelar",
                    description: error.message,
                    variant: "destructive"
                });
                return false;
            }
        };

        useEffect(() => {
            if (!user) return;

            const channel = supabase.channel('hourly-bookings-channel')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'hourly_bookings' }, (payload) => {
                    const { new: newBooking, old: oldBooking } = payload;
                    
                    if (payload.eventType === 'INSERT') {
                        if (profile?.user_type === 'driver' && newBooking.status === 'pending' && newBooking.driver_id === null) {
                            setAvailableBookings(prev => [newBooking, ...prev.filter(b => b.id !== newBooking.id)]);
                        }
                    }
                    
                    if (payload.eventType === 'UPDATE') {
                        updateLocalBookingState(newBooking);

                        if (oldBooking.driver_id === null && newBooking.driver_id !== null) {
                            setAvailableBookings(prev => prev.filter(b => b.id !== newBooking.id));
                        }
                        
                        if (profile?.user_type === 'passenger' && newBooking.passenger_id === user.id && newBooking.status === 'cancelled' && oldBooking.status === 'pending') {
                             toast({ title: "Reserva Caducada", description: "Tu reserva por hora ha sido cancelada por exceso de tiempo." });
                        }
                    }
                    
                    if (payload.eventType === 'DELETE') {
                         setAvailableBookings(prev => prev.filter(b => b.id !== oldBooking.id));
                         setDriverBookings(prev => prev.filter(b => b.id !== oldBooking.id));
                         setPassengerBookings(prev => prev.filter(b => b.id !== oldBooking.id));
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }, [user, profile]);


        const value = {
            settings: hourlySettings,
            loadingSettings,
            bookingLoading,
            driverBookings,
            availableBookings,
            loadingDriverBookings,
            fetchDriverHourlyBookings,
            startHourlyRide,
            completeHourlyRide,
            passengerBookings,
            loadingPassengerBookings,
            fetchPassengerHourlyBookings,
            createHourlyRideRequest,
            cancelBooking,
        };

        return (
            <HourlyRideContext.Provider value={value}>
                {children}
            </HourlyRideContext.Provider>
        );
    };