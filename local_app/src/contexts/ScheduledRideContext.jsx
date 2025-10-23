import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from '@/components/ui/use-toast';
import { getVehicleTypesWithTariffs } from '@/services/tariffService';

const ScheduledRideContext = createContext(null);

export const useScheduledRide = () => {
  const ctx = useContext(ScheduledRideContext);
  if (!ctx) throw new Error('useScheduledRide debe usarse dentro de ScheduledRideProvider');
  return ctx;
};

export const ScheduledRideProvider = ({ children }) => {
  const { user, profile } = useAuth();
  const { settings, loading: loadingSettings } = useSettings();

  const [loading, setLoading] = useState(false);
  const [scheduledRides, setScheduledRides] = useState([]);
  const [availableScheduledRides, setAvailableScheduledRides] = useState([]);
  const [tariffs, setTariffs] = useState([]);

  /* ------------------------- 🚗 Obtener tarifas ------------------------- */
  const fetchTariffs = useCallback(async () => {
    try {
      const tariffsData = await getVehicleTypesWithTariffs();
      setTariffs(tariffsData || []);
    } catch (err) {
      console.error('Error cargando tarifas:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las tarifas.',
        variant: 'destructive',
      });
    }
  }, []);

  useEffect(() => {
    fetchTariffs();
  }, [fetchTariffs]);

  /* ------------------------- 🧍 Pasajero: viajes programados ------------------------- */
  const fetchPassengerScheduledRides = useCallback(async () => {
    if (!user || profile?.user_type !== 'passenger') return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('scheduled_rides')
        .select('*')
        .eq('passenger_id', user.id)
        .order('scheduled_pickup_time', { ascending: true });

      if (error) throw error;
      setScheduledRides(data || []);
    } catch (err) {
      console.error('Error cargando viajes programados:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron obtener tus viajes programados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  /* ------------------------- 🚘 Conductor: viajes asignados y disponibles ------------------------- */
  const fetchDriverScheduledRides = useCallback(async () => {
    if (!user || profile?.user_type !== 'driver') return;
    setLoading(true);

    try {
      const [assigned, available] = await Promise.all([
        supabase
          .from('scheduled_rides')
          .select('*')
          .eq('driver_id', user.id)
          .order('scheduled_pickup_time', { ascending: true }),
        supabase
          .from('scheduled_rides')
          .select('*')
          .is('driver_id', null)
          .eq('status', 'scheduled')
          .order('scheduled_pickup_time', { ascending: true }),
      ]);

      if (assigned.error) throw assigned.error;
      if (available.error) throw available.error;

      setScheduledRides(assigned.data || []);
      setAvailableScheduledRides(available.data || []);
    } catch (err) {
      console.error('Error cargando viajes de conductor:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los viajes programados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  /* ------------------------- 🔁 Auto-fetch según rol ------------------------- */
  useEffect(() => {
    if (!user || !profile) return;
    if (profile.user_type === 'passenger') fetchPassengerScheduledRides();
    if (profile.user_type === 'driver') fetchDriverScheduledRides();
  }, [user, profile, fetchPassengerScheduledRides, fetchDriverScheduledRides]);

  /* ------------------------- 📅 Agendar nuevo viaje ------------------------- */
  const scheduleNewRide = async (rideData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para agendar un viaje.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_rides')
        .insert({ ...rideData, passenger_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setScheduledRides((prev) => [...prev, data]);
      toast({
        title: '¡Viaje programado!',
        description: 'Tu viaje ha sido agendado con éxito.',
      });
      return data;
    } catch (err) {
      console.error('Error al agendar viaje:', err);
      toast({
        title: 'Error',
        description: 'No se pudo agendar el viaje. Intenta nuevamente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- ❌ Cancelar viaje ------------------------- */
  const cancelScheduledRide = async (rideId) => {
    if (!user) return false;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('scheduled_rides')
        .update({ status: 'cancelled_by_passenger' })
        .eq('id', rideId)
        .select()
        .single();

      if (error) throw error;

      setScheduledRides((prev) =>
        prev.map((r) => (r.id === rideId ? data : r))
      );

      toast({
        title: 'Viaje cancelado',
        description: 'Tu viaje programado ha sido cancelado correctamente.',
      });
      return true;
    } catch (err) {
      console.error('Error al cancelar viaje programado:', err);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar el viaje.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- 🧩 Contexto expuesto ------------------------- */
  const value = {
    loading: loading || loadingSettings,
    scheduledRides,
    availableScheduledRides,
    tariffs,
    settings: settings?.scheduledRideSettings,
    scheduleNewRide,
    cancelScheduledRide,
    fetchDriverScheduledRides,
    fetchPassengerScheduledRides,
  };

  return (
    <ScheduledRideContext.Provider value={value}>
      {children}
    </ScheduledRideContext.Provider>
  );
};
