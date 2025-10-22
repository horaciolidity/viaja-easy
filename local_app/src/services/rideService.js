import { supabase } from '@/lib/supabaseClient';
import { getQueryForRide, getTableForRide } from '@/contexts/RideContext/rideQueries';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

export const getRideDetails = async (rideId, rideType, userType) => {
  try {
    const query = getQueryForRide(rideType, userType);
    const table = getTableForRide(rideType);
    const { data, error } = await supabase
      .from(table)
      .select(query)
      .eq('id', rideId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'obtención de detalles del viaje');
    return null;
  }
};

export const createRide = async (rideData) => {
  try {
    const { data, error } = await supabase.from('rides').insert([rideData]).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'creación de viaje');
    return null;
  }
};

export const updateRideStatus = async (rideId, rideType, status, extraData = {}) => {
  try {
    const { data, error } = await supabase.rpc('update_ride_status', {
      p_ride_id: rideId,
      p_ride_type: rideType,
      p_new_status: status,
      p_extra_data: extraData,
    });

    if (error) throw error;
    if (data && data.error) throw new Error(data.message);

    return data.ride;
  } catch (error) {
    NetworkErrorHandler.handleError(error, `actualización de estado a ${status}`);
    return null;
  }
};

export const getDriverActiveRide = async (driverId, userType) => {
  const activeStatuses = ['accepted', 'driver_arriving', 'driver_arrived', 'in_progress'];
  const tables = ['rides', 'scheduled_rides', 'hourly_bookings', 'package_deliveries'];

  try {
    for (const table of tables) {
      const rideType = getTableForRide(table); // Convert table name to ride type
      const query = getQueryForRide(rideType, userType);
      
      const { data, error } = await supabase
        .from(table)
        .select(query)
        .eq('driver_id', driverId)
        .in('status', activeStatuses)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        return { ...data, ride_table: table };
      }
      // PGRST116 = no rows returned
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
    }
    return null;
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'búsqueda de viaje activo del conductor');
    return null;
  }
};

export const getPassengerActiveRide = async (passengerId, userType) => {
  const activeStatuses = ['pending', 'searching', 'accepted', 'driver_arriving', 'driver_arrived', 'in_progress'];
  const tables = ['rides', 'scheduled_rides', 'hourly_bookings', 'package_deliveries'];

  try {
    for (const table of tables) {
      const rideType = getTableForRide(table);
      const query = getQueryForRide(rideType, userType);
      const idField = table === 'package_deliveries' ? 'user_id' : 'passenger_id';

      const { data, error } = await supabase
        .from(table)
        .select(query)
        .eq(idField, passengerId)
        .in('status', activeStatuses)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        return { ...data, ride_table: table };
      }
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
    }
    return null;
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'búsqueda de viaje activo del pasajero');
    return null;
  }
};

export const cancelRide = async (rideId, rideType, reason) => {
  try {
    const { data, error } = await supabase.rpc('cancel_ride', {
      p_ride_id: rideId,
      p_ride_type: rideType,
      p_reason: reason,
    });
    if (error) throw error;
    if (data && !data.success) throw new Error(data.message);
    return data;
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'cancelación de viaje');
    throw error;
  }
};