import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const SettingsContext = createContext({});

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return context;
};

/* ============================
   VALORES POR DEFECTO
   ============================ */
const defaultAppSettings = {
  platform_name: 'ViajaFácil',
  default_currency: 'ARS',
  base_fare: 1000,
  price_per_km: 150,
  price_per_min: 50,
  commission_rate: 20,
  grace_period_minutes: 2,
  wait_fee_per_minute: 50,
  passenger_cancellation_fee: 150,
  driver_cancellation_fee: 200,
  maintenance_mode: false,
  maintenance_message: 'Estamos en mantenimiento. Volveremos pronto.',
  enable_push_notifications: true,
};

const defaultHourlySettings = {
  is_active: true,
  min_hours: 1,
  max_hours: 8,
  base_rate_ars: 5000,
  included_km: 10,
  extra_km_rate_ars: 150,
  platform_fee_pct: 15,
  booking_expiration_hours: 2,
  start_ride_minutes_before: 30,
};

const defaultScheduledSettings = {
  is_active: true,
  min_advance_notice_hours: 2,
  max_advance_booking_days: 30,
  passenger_cancellation_fee: 500,
  driver_cancellation_fee: 500,
  cancellation_window_hours: 24,
};

/* ============================
   PROVIDER PRINCIPAL
   ============================ */
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    appSettings: defaultAppSettings,
    hourlyRideSettings: defaultHourlySettings,
    scheduledRideSettings: defaultScheduledSettings,
    tariffs: [],
  });
  const [loading, setLoading] = useState(true);

  /* ---------------------- CARGAR CONFIGURACIONES ---------------------- */
  const fetchAllSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [
        appSettingsResponse,
        hourlySettingsResponse,
        scheduledSettingsResponse,
        tariffsResponse,
      ] = await Promise.all([
        supabase.from('app_settings').select('settings').single(),
        supabase.from('hourly_ride_settings').select('*').single(),
        supabase.from('scheduled_ride_settings').select('*').single(),
        supabase.from('tariffs').select('*, vehicle_types(*)'),
      ]);

      const appSettingsData = appSettingsResponse?.data?.settings ?? {};
      const hourlySettingsData = hourlySettingsResponse?.data ?? {};
      const scheduledSettingsData = scheduledSettingsResponse?.data ?? {};
      const tariffsData = tariffsResponse?.data ?? [];

      setSettings({
        appSettings: { ...defaultAppSettings, ...appSettingsData },
        hourlyRideSettings: { ...defaultHourlySettings, ...hourlySettingsData },
        scheduledRideSettings: { ...defaultScheduledSettings, ...scheduledSettingsData },
        tariffs: tariffsData,
      });
    } catch (error) {
      console.error('Error cargando configuración:', error.message);
      toast({
        title: 'Error al cargar configuración',
        description: 'Se usará la configuración por defecto.',
      });
      setSettings({
        appSettings: defaultAppSettings,
        hourlyRideSettings: defaultHourlySettings,
        scheduledRideSettings: defaultScheduledSettings,
        tariffs: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------- SUSCRIPCIONES EN TIEMPO REAL ---------------------- */
  useEffect(() => {
    fetchAllSettings();

    const channel = supabase
      .channel('settings-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
        },
        () => {
          toast({
            title: 'Configuración actualizada',
            description: 'Los ajustes generales han cambiado.',
          });
          fetchAllSettings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hourly_ride_settings',
        },
        () => {
          toast({
            title: 'Tarifas por hora actualizadas',
            description: 'Se aplicarán los nuevos valores en breve.',
          });
          fetchAllSettings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_ride_settings',
        },
        () => {
          toast({
            title: 'Configuración de viajes programados actualizada',
            description: 'Los nuevos parámetros se han aplicado.',
          });
          fetchAllSettings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tariffs',
        },
        () => {
          toast({
            title: 'Tarifas actualizadas',
            description: 'Los precios por tipo de vehículo han cambiado.',
          });
          fetchAllSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllSettings]);

  /* ---------------------- CONTEXTO ---------------------- */
  const value = {
    settings,
    loading,
    refreshSettings: fetchAllSettings,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
