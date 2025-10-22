
// src/services/driverService.js
import { supabase } from '@/lib/supabaseClient';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

/** ====== ESTADÍSTICAS ====== */
export const getDriverStats = async (driverId) => {
  if (!driverId) {
    console.warn('getDriverStats called without driverId');
    return { tripsToday: 0, earningsToday: 0 };
  }
  try {
    const operation = async () => {
      const { data, error } = await supabase.rpc('get_driver_stats', { p_driver_id: driverId });
      if (error) throw error;
      return data;
    };
    return await NetworkErrorHandler.retryOperation(operation);
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'obtención de estadísticas');
    return { tripsToday: 0, earningsToday: 0 };
  }
};

/** ====== DISPONIBLES PARA TOMAR ====== */
// Inmediatos (ride_type=now)
export const listDriverAvailableNow = async () => {
  const op = async () => {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .in('status', ['searching', 'pending'])
      .is('driver_id', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };
  return NetworkErrorHandler.retryOperation(op);
};

// Programados (ride_type=scheduled)
export const listDriverAvailableScheduled = async () => {
  const op = async () => {
    const { data, error } = await supabase
      .from('scheduled_rides')
      .select('*')
      .in('status', ['searching', 'pending', 'scheduled'])
      .is('driver_id', null)
      .order('scheduled_pickup_time', { ascending: true });
    if (error) throw error;
    return data || [];
  };
  return NetworkErrorHandler.retryOperation(op);
};

// Por hora
export const listDriverAvailableHourly = async () => {
  const op = async () => {
    const { data, error } = await supabase
      .from('hourly_bookings')
      .select('*')
      .eq('status', 'pending')
      .is('driver_id', null)
      .order('start_datetime', { ascending: true });
    if (error) throw error;
    return data || [];
  };
  return NetworkErrorHandler.retryOperation(op);
};

// Paquetería
export const listDriverAvailablePackages = async () => {
  const op = async () => {
    const { data, error } = await supabase
      .from('package_deliveries')
      .select('*')
      .in('status', ['searching', 'pending'])
      .is('driver_id', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };
  return NetworkErrorHandler.retryOperation(op);
};

/** ====== ASIGNADOS AL CONDUCTOR ====== */
// (opcional: por si los listás en otra pestaña)
export const listDriverAssignedRides = async () => {
  const op = async () => {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .in('status', ['driver_assigned', 'accepted', 'in_progress'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };
  return NetworkErrorHandler.retryOperation(op);
};

export const listDriverAssignedHourly = async () => {
  const op = async () => {
    const { data, error } = await supabase
      .from('hourly_bookings')
      .select('*')
      .in('status', ['accepted', 'in_progress'])
      .order('start_datetime', { ascending: true });
    if (error) throw error;
    return data || [];
  };
  return NetworkErrorHandler.retryOperation(op);
};

export const listDriverAssignedPackages = async () => {
  const op = async () => {
    const { data, error } = await supabase
      .from('package_deliveries')
      .select('*')
      .in('status', ['driver_assigned', 'in_progress'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };
  return NetworkErrorHandler.retryOperation(op);
};
