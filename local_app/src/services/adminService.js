import { supabase } from '@/lib/supabaseClient';
    import { handleAndThrowError } from '@/utils/errorHandler.js';

    export const getDashboardStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_dashboard_stats');
        if (error) throw error;
        return data;
      } catch (error) {
        handleAndThrowError(error, 'obtención de estadísticas del panel');
      }
    };

    export const getSystemHealth = async () => {
      try {
        const { data, error } = await supabase.rpc('get_system_health');
        if (error) throw error;
        return data;
      } catch (error) {
        handleAndThrowError(error, 'obtención del estado del sistema');
      }
    };

    export const adminDeleteUser = async (userId) => {
      try {
        const { data, error } = await supabase.rpc('delete_user_by_admin', {
          p_user_id_to_delete: userId,
        });
        if (error) throw error;
        if (data && !data.success) throw new Error(data.message);
        return data;
      } catch (error) {
        handleAndThrowError(error, 'eliminación de usuario');
      }
    };

    export const processBulkDriverPayment = async (driverSummary) => {
        try {
            const { data: tokenData, error: tokenError } = await supabase
                .from('admin_settings')
                .select('setting_value')
                .eq('setting_key', 'mercadopago_access_token')
                .single();
    
            if (tokenError || !tokenData) {
                throw new Error('No se pudo obtener el token de acceso de MercadoPago.');
            }
    
            const { data, error } = await supabase.functions.invoke('process-bulk-driver-payment', {
                body: {
                    driverId: driverSummary.driver_id,
                    accessToken: tokenData.setting_value,
                    amount: driverSummary.pending_amount,
                    alias: driverSummary.mercadopago_alias,
                    cvu: driverSummary.mercadopago_cvu,
                },
            });
    
            if (error) throw error;
            if (data.error) throw new Error(data.error.message || 'Error en la función de pago.');
    
            await supabase.rpc('pay_all_pending_to_driver', {
                p_driver_id: driverSummary.driver_id,
                p_transaction_id: data.transaction_id,
            });
    
            return data;
        } catch (error) {
            handleAndThrowError(error, 'procesamiento de pago masivo a conductor');
        }
    };

    export const adminGetScheduledSettings = async () => {
      try {
        const { data, error } = await supabase.rpc('admin_get_scheduled_settings');
        if (error) throw error;
        return data;
      } catch (error) {
        handleAndThrowError(error, 'obtención de configuración de viajes programados');
      }
    };

    export const adminUpdateScheduledSettings = async (settings) => {
      try {
        const params = {
            p_is_active: settings.is_active,
            p_min_advance_notice_hours: settings.min_advance_notice_hours,
            p_max_advance_booking_days: settings.max_advance_booking_days,
            p_cancellation_window_hours: settings.cancellation_window_hours,
            p_platform_fee_pct: settings.platform_fee_pct,
            p_early_start_minutes: settings.early_start_minutes,
            p_start_proximity_meters: settings.start_proximity_meters,
        };
        const { data, error } = await supabase.rpc('admin_update_scheduled_settings', params);
        if (error) throw error;
        return data;
      } catch (error) {
        handleAndThrowError(error, 'actualización de configuración de viajes programados');
      }
    };

    export const getImpersonationSession = async (userIdToImpersonate) => {
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { userIdToImpersonate },
      });

      if (error) {
        throw new Error(error.message);
      }
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    };

    export const adminVerifyAccount = async (userId) => {
      const { error } = await supabase.rpc('admin_verify_account', { p_user_id: userId });
      if (error) throw error;
      return { success: true };
    };

    export const getMercadoPagoAccessToken = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'mercadopago_access_token')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        return data ? data.setting_value : '';
      } catch (error) {
        handleAndThrowError(error, 'obtención del access token de MercadoPago');
      }
    };

    export const updateMercadoPagoAccessToken = async (token) => {
      try {
        const { error } = await supabase
          .from('admin_settings')
          .upsert({ setting_key: 'mercadopago_access_token', setting_value: token }, { onConflict: 'setting_key' });

        if (error) throw error;
        return { success: true };
      } catch (error) {
        handleAndThrowError(error, 'actualización del access token de MercadoPago');
      }
    };

    export const getDriverPaymentSummaries = async () => {
      try {
        const { data, error } = await supabase
          .from('driver_payment_summary')
          .select('*');
        if (error) throw error;
        return data || [];
      } catch (error) {
        handleAndThrowError(error, 'obtención de resúmenes de pago de conductores');
      }
    };

    export const getCompletedDriverPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('driver_payments')
          .select('*, profiles(full_name, email)')
          .eq('status', 'paid')
          .order('payment_date', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (error) {
        handleAndThrowError(error, 'obtención de pagos completados a conductores');
      }
    };

    export const adminListTariffs = async () => {
      try {
        const { data, error } = await supabase.rpc('admin_list_tariffs');
        if (error) throw error;
        return data;
      } catch (error) {
        handleAndThrowError(error, 'obtención de listado de tarifas');
      }
    };
    
    export const adminUpsertTariff = async (tariffData) => {
      try {
        const { data, error } = await supabase.rpc('admin_upsert_tariff', tariffData);
        if (error) throw error;
        return data;
      } catch (error) {
        handleAndThrowError(error, 'actualización de tarifa');
      }
    };

    export const getSharedRideSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('shared_ride_settings')
          .single();
    
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        return data ? data.shared_ride_settings : null;
      } catch (error) {
        handleAndThrowError(error, 'obtención de configuración de viajes compartidos');
      }
    };
    
    export const updateSharedRideSettings = async (settings) => {
      try {
        const { error } = await supabase.rpc('update_shared_ride_settings', {
          p_settings: settings,
        });
        if (error) throw error;
        return { success: true };
      } catch (error) {
        handleAndThrowError(error, 'actualización de configuración de viajes compartidos');
      }
    };

    export const updateAppSettings = async (settings) => {
      try {
        const { error } = await supabase.rpc('update_app_settings', {
          p_settings: settings,
        });
        if (error) throw error;
        return { success: true };
      } catch (error) {
        handleAndThrowError(error, 'actualización de configuración de la aplicación');
      }
    };

    export const getDailyMetrics = async (daysAgo) => {
      try {
        const { data, error } = await supabase.rpc('get_daily_metrics', { days_ago: daysAgo });
        if (error) throw error;
        return data || [];
      } catch (error) {
        handleAndThrowError(error, 'obtención de métricas diarias');
      }
    };
    
    export const getAverageWaitTimes = async (daysAgo) => {
      try {
        const { data, error } = await supabase.rpc('get_average_wait_times', { days_ago: daysAgo });
        if (error) throw error;
        return data || [];
      } catch (error) {
        handleAndThrowError(error, 'obtención de tiempos de espera promedio');
      }
    };
    
    export const getTopDrivers = async () => {
      try {
        const { data, error } = await supabase.rpc('get_top_drivers_this_month');
        if (error) throw error;
        return data || [];
      } catch (error) {
        handleAndThrowError(error, 'obtención de mejores conductores');
      }
    };
    
    export const getVehicleDistribution = async () => {
      try {
        const { data, error } = await supabase.rpc('get_vehicle_type_distribution');
        if (error) throw error;
        return data || [];
      } catch (error) {
        handleAndThrowError(error, 'obtención de distribución de vehículos');
      }
    };
    
    export const getNewPassengersMonthly = async () => {
      try {
        const { data, error } = await supabase.rpc('get_new_passengers_monthly');
        if (error) throw error;
        return data || [];
      } catch (error) {
        handleAndThrowError(error, 'obtención de nuevos pasajeros mensualmente');
      }
    };
    
    export const getHeatmapData = async (startDate, endDate) => {
      try {
        const { data, error } = await supabase.rpc('get_ride_request_heatmap_data', { start_date: startDate, end_date: endDate });
        if (error) throw error;
        return data || [];
      } catch (error) {
        handleAndThrowError(error, 'obtención de datos para mapa de calor');
      }
    };
