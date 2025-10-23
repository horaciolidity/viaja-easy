import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getHourlyRideSettings,
  createHourlyRideRequest as createHourlyRideRequestService,
  getDriverAndAvailableHourlyBookings,
  getPassengerHourlyBookings as getPassengerHourlyBookingsService,
  cancelBooking as cancelBookingService,
  updateHourlyBookingStatus as updateHourlyBookingStatusService,
} from '@/services/hourlyRideService';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { useNotifications } from './NotificationContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const HourlyRideContext = createContext(null);

export const useHourlyRide = () => {
  const ctx = useContext(HourlyRideContext);
  if (!ctx) throw new Error('useHourlyRide debe usarse dentro de HourlyRideProvider');
  return ctx;
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

  /* ------------------------- ⚙️ Cargar configuración ------------------------- */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getHourlyRideSettings();
        setHourlySettings(data);
      } catch (err) {
        console.error('Error obteniendo configuración por hora:', err);
      }
    };
    fetchSettings();
  }, []);

  /* ------------------------- 🧍 Crear reserva pasajero ------------------------- */
  const createHourlyRideRequest = async (bookingData) => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para reservar.',
        variant: 'destructive',
      });
      return null;
    }

    setBookingLoading(true);
    try {
      const newBooking = await createHourlyRideRequestService({
        ...bookingData,
        passenger_id: user.id,
        status: 'pending',
      });

      toast({
        title: 'Reserva creada',
        description: 'Tu viaje por hora ha sido solicitado. Buscando un conductor...',
      });

      setPassengerBookings((prev) => [newBooking, ...prev]);
      return newBooking;
    } catch (err) {
      console.error('Error creando reserva:', err);
      toast({
        title: 'Error al reservar',
        description: err.message || 'No se pudo crear la reserva. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setBookingLoading(false);
    }
  };

  /* ------------------------- 🚗 Cargar reservas conductor ------------------------- */
  const fetchDriverHourlyBookings = useCallback(async () => {
    if (!user || profile?.user_type !== 'driver') return;
    setLoadingDriverBookings(true);

    try {
      const { assigned, available } = await getDriverAndAvailableHourlyBookings(user.id);
      setDriverBookings(assigned);
      setAvailableBookings(available);
    } catch (err) {
      console.error('Error obteniendo reservas conductor:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron obtener las reservas por hora.',
        variant: 'destructive',
      });
    } finally {
      setLoadingDriverBookings(false);
    }
  }, [user, profile]);

  /* ------------------------- 📲 Cargar reservas pasajero ------------------------- */
  const fetchPassengerHourlyBookings = useCallback(async () => {
    if (!user || profile?.user_type !== 'passenger') return;
    setLoadingPassengerBookings(true);

    try {
      const data = await getPassengerHourlyBookingsService(user.id);
      setPassengerBookings(data);
    } catch (err) {
      console.error('Error obteniendo reservas pasajero:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar tus reservas.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPassengerBookings(false);
    }
  }, [user, profile]);

  /* ------------------------- 🔁 Actualización local ------------------------- */
  const updateLocalBookingState = useCallback((updatedBooking) => {
    setDriverBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
    setPassengerBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
  }, []);

  /* ------------------------- ▶️ Iniciar viaje por hora ------------------------- */
  const startHourlyRide = async (bookingId) => {
    if (!user) return;

    try {
      const updatedBooking = await updateHourlyBookingStatusService(bookingId, 'in_progress', {
        actual_start_time: new Date().toISOString(),
      });

      updateLocalBookingState(updatedBooking);
      toast({ title: 'Viaje iniciado', description: '¡Buen viaje!' });

      await sendNotification(updatedBooking.passenger_id, {
        type: 'booking_in_progress',
        title: '¡Tu viaje ha comenzado!',
        body: 'Tu conductor ha iniciado el viaje por horas.',
        payload: { bookingId: updatedBooking.id },
      });
    } catch (err) {
      console.error('Error al iniciar viaje:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  /* ------------------------- ✅ Completar viaje ------------------------- */
  const completeHourlyRide = async (booking) => {
    if (!user) return;

    try {
      const updatedBooking = await updateHourlyBookingStatusService(booking.id, 'completed', {
        actual_end_time: new Date().toISOString(),
      });

      updateLocalBookingState(updatedBooking);
      toast({
        title: 'Viaje completado',
        description: 'El pago ha sido procesado a tu billetera.',
      });

      await sendNotification(updatedBooking.passenger_id, {
        type: 'booking_completed',
        title: 'Viaje finalizado',
        body: 'Tu viaje por horas ha finalizado.',
        payload: { bookingId: updatedBooking.id },
      });
    } catch (err) {
      console.error('Error al completar viaje:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  /* ------------------------- ❌ Cancelar reserva ------------------------- */
  const cancelBooking = async (bookingId) => {
    if (!user) return false;

    try {
      await cancelBookingService(bookingId);
      setPassengerBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
      toast({
        title: 'Reserva cancelada',
        description: 'Tu reserva ha sido cancelada exitosamente.',
      });
      return true;
    } catch (err) {
      console.error('Error al cancelar reserva:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo cancelar la reserva.',
        variant: 'destructive',
      });
      return false;
    }
  };

  /* ------------------------- 🔄 Escuchar actualizaciones realtime ------------------------- */
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`hourly-bookings:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hourly_bookings' },
        (payload) => {
          const { eventType, new: newBooking, old: oldBooking } = payload;

          if (eventType === 'INSERT' && profile?.user_type === 'driver' && !newBooking.driver_id) {
            setAvailableBookings((prev) => [newBooking, ...prev.filter((b) => b.id !== newBooking.id)]);
          }

          if (eventType === 'UPDATE') {
            updateLocalBookingState(newBooking);

            if (!oldBooking.driver_id && newBooking.driver_id)
              setAvailableBookings((prev) => prev.filter((b) => b.id !== newBooking.id));

            if (
              profile?.user_type === 'passenger' &&
              newBooking.passenger_id === user.id &&
              newBooking.status === 'cancelled' &&
              oldBooking.status === 'pending'
            ) {
              toast({
                title: 'Reserva expirada',
                description: 'Tu reserva por hora fue cancelada por tiempo excedido.',
              });
            }
          }

          if (eventType === 'DELETE') {
            setAvailableBookings((prev) => prev.filter((b) => b.id !== oldBooking.id));
            setDriverBookings((prev) => prev.filter((b) => b.id !== oldBooking.id));
            setPassengerBookings((prev) => prev.filter((b) => b.id !== oldBooking.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, updateLocalBookingState]);

  /* ------------------------- 🧩 Contexto expuesto ------------------------- */
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

  return <HourlyRideContext.Provider value={value}>{children}</HourlyRideContext.Provider>;
};
