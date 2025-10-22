import { supabase } from '@/lib/supabaseClient';

export async function cancelRide({ cancellerId, reason, rideId, rideType }) {
  const { data, error } = await supabase.rpc('cancel_ride', {
    p_canceller_id: cancellerId,
    p_reason: reason ?? 'Cancelado por el usuario',
    p_ride_id: rideId,
    p_ride_type: rideType, 
  });

  if (error) {
    console.error('Error canceling ride RPC:', error);
    throw new Error(error.message || 'No se pudo cancelar el viaje');
  }

  if (data && data.ok === false) {
    console.error('Error from cancel_ride function:', data.error);
    throw new Error(data.error || 'No se pudo cancelar el viaje');
  }

  return data;
}