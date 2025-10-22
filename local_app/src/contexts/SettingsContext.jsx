import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { getHourlyRideSettings } from '@/services/hourlyRideService';
import { getScheduledRideSettings } from '@/services/scheduledRideService';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

const SettingsContext = createContext({});

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

const defaultAppSettings = {
    platform_name: "Tu App",
    default_currency: "ARS",
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

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        appSettings: defaultAppSettings,
        hourlyRideSettings: defaultHourlySettings,
        scheduledRideSettings: defaultScheduledSettings,
        tariffs: []
    });
    const [loading, setLoading] = useState(true);

    const fetchAllSettings = useCallback(async () => {
        setLoading(true);
        try {
            const [appSettingsResponse, hourlySettingsData, scheduledSettingsData, tariffsData] = await Promise.all([
                supabase.from('app_settings').select('settings').single(),
                getHourlyRideSettings(),
                getScheduledRideSettings(),
                supabase.from('tariffs').select('*, vehicle_types(*)'),
            ]);

            if (appSettingsResponse.error && appSettingsResponse.error.code !== 'PGRST116') throw appSettingsResponse.error;
            if (tariffsData.error) throw tariffsData.error;

            const appSettingsObject = appSettingsResponse.data?.settings || {};

            setSettings({
                appSettings: { ...defaultAppSettings, ...appSettingsObject },
                hourlyRideSettings: hourlySettingsData || defaultHourlySettings,
                scheduledRideSettings: scheduledSettingsData || defaultScheduledSettings,
                tariffs: tariffsData.data || [],
            });

        } catch (error) {
            console.error("Error fetching all settings:", error);
            NetworkErrorHandler.handleError(error, 'carga de configuración');
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

    useEffect(() => {
        fetchAllSettings();

        const channel = supabase
            .channel('all-settings-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                if (['app_settings', 'hourly_ride_settings', 'scheduled_ride_settings', 'tariffs'].includes(payload.table)) {
                    toast({
                        title: "Configuración actualizada",
                        description: "Los ajustes de la aplicación han cambiado.",
                    });
                    fetchAllSettings();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAllSettings]);

    const value = {
        settings,
        loading,
        refreshSettings: fetchAllSettings,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};