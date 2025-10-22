import { supabase } from '@/lib/supabaseClient';
import { getQueryForRide, getTableForRide } from '@/contexts/RideContext/rideQueries';

export const loadUserRidesAPI = async (userId, userType) => {
    const roleColumn = userType === 'driver' ? 'driver_id' : 'passenger_id';
    
    const ridesQuery = getQueryForRide('now', userType);
    let { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select(ridesQuery)
        .eq(roleColumn, userId)
        .order('created_at', { ascending: false });

    if (ridesError) throw ridesError;

    const scheduledQuery = getQueryForRide('scheduled', userType);
    let { data: scheduledRides, error: scheduledError } = await supabase
        .from('scheduled_rides')
        .select(scheduledQuery)
        .eq(roleColumn, userId)
        .order('created_at', { ascending: false });

    if (scheduledError) throw scheduledError;

    const hourlyQuery = getQueryForRide('hourly', userType);
    let { data: hourlyRides, error: hourlyError } = await supabase
        .from('hourly_bookings')
        .select(hourlyQuery)
        .eq(roleColumn, userId)
        .order('created_at', { ascending: false });

    if (hourlyError) throw hourlyError;

    const allRides = [...(rides || []), ...(scheduledRides || []), ...(hourlyRides || [])];
    allRides.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { data: allRides, error: null };
};

export const loadAvailableRidesAPI = async () => {
    const { data, error } = await supabase.rpc('get_all_pending_rides');
    if (error) {
        console.error("Error fetching available rides:", error);
        throw error;
    }
    return { data, error: null };
};

export const createRideAPI = async (rideData) => {
    const query = getQueryForRide('now', 'passenger');
    const { data, error } = await supabase
        .from('rides')
        .insert([rideData])
        .select(query)
        .single();
    if (error) throw error;
    return data;
};

export const acceptRideAPI = async (rideId, rideType) => {
    if (!rideId) throw new Error('rideId is missing');
    const { data, error } = await supabase.rpc('accept_ride', {
      p_ride_id: rideId,
      p_ride_type: rideType
    });
  
    if (error) {
        console.error("Error calling accept_ride RPC:", error);
        throw error;
    }

    if (data && !data.success) {
        console.error("accept_ride RPC returned an error:", data.message);
        throw new Error(data.message || 'Error al aceptar el viaje desde el servidor.');
    }
  
    return data;
};

export const driverArrivedAPI = async (rideId, rideType) => {
    if (!rideId) throw new Error('rideId is missing');
    const { data, error } = await supabase.rpc('driver_arrived', {
        p_ride_id: rideId,
        p_ride_type: rideType
    });

    if (error) {
        console.error("Error calling driver_arrived RPC:", error);
        return { data: null, error };
    }
    
    if (data && !data.success) {
        const rpcError = new Error(data.message || 'Error en el servidor al marcar la llegada.');
        console.error("driver_arrived RPC returned an error:", rpcError);
        return { data: null, error: rpcError };
    }
    
    return { data: data.ride, error: null };
};

export const startRideAPI = async (rideId, rideType, pinCode) => {
    if (!rideId) throw new Error('rideId is missing');
    if (pinCode === null || pinCode === undefined) {
        throw new Error('PIN code is required');
    }
    
    const { data, error } = await supabase.rpc('start_ride', {
        p_ride_id: rideId,
        p_ride_type: rideType || 'now',
        p_pin: String(pinCode),
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.message);
    
    return { data, error: null };
};

export const completeRideAPI = async (rideId, rideType, actualFare, driverCash) => {
    if (!rideId) throw new Error('rideId is missing');
    
    const commissionRate = 0.15;

    const { data, error } = await supabase.rpc('complete_ride', {
        p_ride_id: rideId,
        p_ride_type: rideType,
        p_actual_fare: isNaN(Number(actualFare)) ? null : Number(actualFare),
        p_commission_pct: commissionRate,
        p_driver_cash: Number(driverCash) || 0,
    });
    
    if (error) throw error;
    if (data && !data.success) throw new Error(data.message);
    
    return { data, error: null };
};

export const updateRideStatusAPI = async (rideId, newStatus, userType, rideType, validationData) => {
    if (!rideId) throw new Error('rideId is missing for updateRideStatusAPI');
    
    const tableName = getTableForRide(rideType);
    const query = getQueryForRide(rideType, userType);

    const updates = { status: newStatus };

    if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
        if (validationData.finalLocation) {
            updates.destination_lat = validationData.finalLocation.lat;
            updates.destination_lng = validationData.finalLocation.lng;
            updates.destination_address = validationData.finalLocation.address;
        }
        if (validationData.actual_distance) updates.actual_distance_km = validationData.actual_distance;
        if (validationData.actual_duration) updates.actual_duration_min = validationData.actual_duration;
    }

    const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', rideId)
        .select(query)
        .single();
    
    if (error) return { data: null, error };
    return { data, error: null };
};


export const cancelRideAPI = async (rideId, rideType, reason) => {
    if (!rideId) throw new Error('rideId is missing');
    const { data, error } = await supabase.rpc('cancel_ride', {
        p_ride_id: rideId,
        p_ride_type: rideType || 'now',
        p_reason: reason || null
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.message || 'No se pudo cancelar el viaje.');
    return data;
};

export const addStopToRideAPI = async (rideId, rideType, stopData, newRoute) => {
  if (!rideId) throw new Error('rideId is missing');
  const { address, lat, lng } = stopData;
  const { data, error } = await supabase.rpc('add_stop_to_ride', {
    p_ride_id: rideId,
    p_ride_type: rideType,
    p_address: address,
    p_lat: lat,
    p_lng: lng,
    p_new_distance_km: newRoute.distance,
    p_new_duration_min: newRoute.duration
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.message);
  return { data, error: null };
};

export const fetchRideByIdAPI = async (rideId, rideType) => {
    if (!rideId) throw new Error('rideId is missing');
    const tableName = getTableForRide(rideType);
    const query = getQueryForRide(rideType);

    const { data, error } = await supabase
        .from(tableName)
        .select(query)
        .eq('id', rideId)
        .single();
    
    if (error) throw error;
    return data;
};

export const getRideAuthInfoAPI = async (rideId, rideType) => {
    if (!rideId) throw new Error('rideId is missing');
    const { data, error } = await supabase.rpc('get_ride_auth_info', {
        p_ride_id: rideId,
        p_ride_type: rideType || 'now'
    });
    if (error) throw error;
    if (data && !data.success) throw new Error(data.message);
    return data;
};