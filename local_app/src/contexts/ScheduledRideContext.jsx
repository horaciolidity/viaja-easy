import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { useAuth } from '@/contexts/AuthContext';
    import { useSettings } from '@/contexts/SettingsContext';
    import { toast } from '@/components/ui/use-toast';
    import { NetworkErrorHandler } from '@/utils/networkErrorHandler';
    import { getVehicleTypesWithTariffs } from '@/services/tariffService';

    const ScheduledRideContext = createContext(null);

    export const useScheduledRide = () => {
      const context = useContext(ScheduledRideContext);
      if (!context) {
        throw new Error('useScheduledRide must be used within a ScheduledRideProvider');
      }
      return context;
    };

    export const ScheduledRideProvider = ({ children }) => {
      const { user, profile } = useAuth();
      const { settings, loading: loadingSettings } = useSettings();
      const [loading, setLoading] = useState(false);
      const [scheduledRides, setScheduledRides] = useState([]);
      const [availableScheduledRides, setAvailableScheduledRides] = useState([]);
      const [tariffs, setTariffs] = useState([]);

      const fetchTariffs = useCallback(async () => {
        try {
          const tariffsData = await getVehicleTypesWithTariffs();
          setTariffs(tariffsData || []);
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'carga de tarifas');
        }
      }, []);

      useEffect(() => {
        fetchTariffs();
      }, [fetchTariffs]);

      const fetchPassengerScheduledRides = useCallback(async () => {
        if (!user || profile?.user_type !== 'passenger') return;
        setLoading(true);
        const operation = async () => {
          const { data, error } = await supabase.from('scheduled_rides').select('*').eq('passenger_id', user.id).order('scheduled_pickup_time', { ascending: true });
          if (error) throw error;
          return data || [];
        };
        try {
          const data = await NetworkErrorHandler.retryOperation(operation);
          setScheduledRides(data);
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'carga de viajes programados');
        } finally {
          setLoading(false);
        }
      }, [user, profile]);

      const fetchDriverScheduledRides = useCallback(async () => {
        if (!user || profile?.user_type !== 'driver') return;
        setLoading(true);
        const assignedOp = async () => {
          const { data, error } = await supabase.from('scheduled_rides').select('*').eq('driver_id', user.id).order('scheduled_pickup_time', { ascending: true });
          if (error) throw error;
          return data || [];
        };
        const availableOp = async () => {
          const { data, error } = await supabase.from('scheduled_rides').select('*').is('driver_id', null).eq('status', 'scheduled').order('scheduled_pickup_time', { ascending: true });
          if (error) throw error;
          return data || [];
        };
        try {
          const [assigned, available] = await Promise.all([
            NetworkErrorHandler.retryOperation(assignedOp),
            NetworkErrorHandler.retryOperation(availableOp),
          ]);
          setScheduledRides(assigned);
          setAvailableScheduledRides(available);
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'carga de viajes programados');
        } finally {
          setLoading(false);
        }
      }, [user, profile]);

      useEffect(() => {
        if (user && profile) {
          if (profile.user_type === 'passenger') fetchPassengerScheduledRides();
          if (profile.user_type === 'driver') fetchDriverScheduledRides();
        }
      }, [user, profile, fetchPassengerScheduledRides, fetchDriverScheduledRides]);

      const scheduleNewRide = async (rideData) => {
        if (!user || !user.id) {
            toast({ title: 'Error', description: 'Debes iniciar sesión para agendar un viaje.', variant: 'destructive' });
            return null;
        }
        setLoading(true);
        const operation = async () => {
          const payload = { ...rideData, passenger_id: user.id };
          const { data, error } = await supabase.from('scheduled_rides').insert(payload).select().single();
          if (error) throw error;
          return data;
        };
        try {
          const newRide = await NetworkErrorHandler.retryOperation(operation);
          setScheduledRides(prev => [...prev, newRide]);
          toast({ title: '¡Viaje Programado!', description: 'Tu viaje ha sido agendado con éxito.', className: 'bg-green-600 text-white' });
          return newRide;
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'agendamiento de viaje');
          return null;
        } finally {
          setLoading(false);
        }
      };

      const cancelScheduledRide = async (rideId) => {
        setLoading(true);
        const operation = async () => {
          const { data, error } = await supabase.from('scheduled_rides').update({ status: 'cancelled_by_passenger' }).eq('id', rideId).select().single();
          if (error) throw error;
          return data;
        };
        try {
          const cancelledRide = await NetworkErrorHandler.retryOperation(operation);
          setScheduledRides(prev => prev.map(r => r.id === rideId ? cancelledRide : r));
          toast({ title: 'Viaje Cancelado', description: 'El viaje programado ha sido cancelado.' });
          return true;
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'cancelación de viaje programado');
          return false;
        } finally {
          setLoading(false);
        }
      };
      
      const value = {
        loading: loading || loadingSettings,
        scheduledRides,
        availableScheduledRides,
        tariffs,
        settings: settings.scheduledRideSettings,
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