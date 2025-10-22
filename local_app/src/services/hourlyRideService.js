import { supabase } from '@/lib/supabaseClient';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

export const getHourlyRideSettings = async () => {
  const operation = async () => {
    const { data, error } = await supabase
      .from('hourly_ride_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw error;
    return data;
  };
  return NetworkErrorHandler.retryOperation(operation);
};

export const updateHourlyRideSettings = async (updates) => {
  const operation = async () => {
    const { id, ...updateData } = updates;
    const { data, error } = await supabase
      .from('hourly_ride_settings')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    return data;
  };
  return NetworkErrorHandler.retryOperation(operation);
};

export const createHourlyRideRequest = async (bookingData) => {
  const operation = async () => {
    const { data, error } = await supabase
      .from('hourly_bookings')
      .insert([bookingData])
      .select()
      .single();
    if (error) throw error;
    return data;
  };
  return NetworkErrorHandler.retryOperation(operation);
};

export const getDriverAndAvailableHourlyBookings = async (driverId) => {
  if (!driverId) return { assigned: [], available: [] };

  const operation = async () => {
    const { data: available, error: availableError } = await supabase
      .from('hourly_bookings')
      .select('*')
      .eq('status', 'pending')
      .is('driver_id', null)
      .order('start_datetime', { ascending: true });

    if (availableError) throw availableError;

    const { data: assigned, error: assignedError } = await supabase
      .from('hourly_bookings')
      .select('*')
      .eq('driver_id', driverId)
      .in('status', ['accepted', 'in_progress'])
      .order('start_datetime', { ascending: true });

    if (assignedError) throw assignedError;

    return { assigned: assigned || [], available: available || [] };
  };
  return NetworkErrorHandler.retryOperation(operation);
};

export const claimHourlyBooking = async (bookingId, driverId) => {
  const operation = async () => {
    const { data, error } = await supabase
      .from('hourly_bookings')
      .update({ driver_id: driverId, status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .is('driver_id', null)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error during claimHourlyBooking update:', error.message);
      throw new Error('Ocurrió un error al intentar aceptar la reserva.');
    }
    return data;
  };
  return NetworkErrorHandler.retryOperation(operation);
};

export const updateHourlyBookingStatus = async (bookingId, status, extraData = {}) => {
  const operation = async () => {
    const { data, error } = await supabase
      .from('hourly_bookings')
      .update({ status, updated_at: new Date().toISOString(), ...extraData })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating booking status to ${status}:`, error.message);
      throw new Error('No se pudo actualizar el estado de la reserva.');
    }
    return data;
  };
  return NetworkErrorHandler.retryOperation(operation);
};

export const getPassengerHourlyBookings = async (passengerId) => {
  if (!passengerId) return [];
  const operation = async () => {
    const { data, error } = await supabase
      .from('hourly_bookings')
      .select('*')
      .eq('passenger_id', passengerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  };
  return NetworkErrorHandler.retryOperation(operation);
};

export const cancelBooking = async (bookingId) => {
  const { auth } = supabase;
  const {
    data: { user },
  } = await auth.getUser();
  if (!user) throw new Error('Usuario no autenticado.');

  const operation = async () => {
    const { data, error } = await supabase
      .from('hourly_bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .eq('passenger_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling booking:', error);
      throw new Error(
        'No se pudo cancelar la reserva. Es posible que ya no se pueda cancelar o que haya ocurrido un error.'
      );
    }

    if (data && data.driver_id) {
      const { error: rpcError } = await supabase.rpc('create_notification', {
        target_user_id: data.driver_id,
        notification_type: 'booking_cancelled',
        notification_title: 'Reserva Cancelada',
        notification_body: `El pasajero ha cancelado la reserva para el ${new Date(
          data.start_datetime
        ).toLocaleString()}.`,
        notification_payload: { bookingId: data.id },
      });

      if (rpcError) {
        console.error('Error sending cancellation notification via RPC:', rpcError);
      }
    }

    return data;
  };
  return NetworkErrorHandler.retryOperation(operation);
};

/**
 * Crea la reserva por hora usando el método de pago elegido.
 * Si el backend lanza "insufficient_wallet_balance",
 * dejá que el componente abra el PaymentModal con flujo mixto.
 */
export const createHourlyBooking = async (bookingData, paymentMethod, passengerId) => {
  const operation = async () => {
    const { data, error } = await supabase.rpc('process_hourly_booking_creation', {
      p_passenger_id: passengerId,
      p_payment_method: paymentMethod,
      p_booking_data: bookingData,
    });
    if (error) throw error; // importante: no atrapar acá, que lo maneje el componente
    return data;
  };
  return NetworkErrorHandler.retryOperation(operation);
};
