import { formatCurrencyARS } from '@/utils/mercadoPago.js';

export const formatRideData = (ride) => {
  if (!ride) return null;
  
  const fare = ride.actual_fare || ride.estimated_fare || ride.total_fare || ride.fare || 0;
  const driver_earnings = fare * 0.8;
  
  const vehicle_info = ride.driver?.vehicle_info;
  const vehicleData = Array.isArray(vehicle_info) ? vehicle_info[0] : vehicle_info;

  const formattedRide = {
    ...ride,
    origin_lat: ride.origin_lat ?? ride.start_location_lat ?? ride.pickup_lat,
    origin_lng: ride.origin_lng ?? ride.start_location_lng ?? ride.pickup_lng,
    origin_address: ride.origin_address ?? ride.start_location_address ?? ride.pickup_address,
    destination_address: ride.destination_address ?? ride.description ?? ride.delivery_address,
    estimated_fare: ride.estimated_fare ?? ride.total_fare ?? ride.fare,
    estimated_duration: ride.estimated_duration ?? (ride.booked_hours ? ride.booked_hours * 60 : null),
    driver_earnings,
    driver: ride.driver ? {
        ...ride.driver,
        vehicle_info: vehicleData,
    } : null,
    stops: ride.stops || [],
    ride_type: ride.ride_type || (ride.delivery_address ? 'package' : 'now'),
  };
  return formattedRide;
};

export const formatAvailableRide = (ride) => {
  if (!ride) return null;
  const fare = ride.fare_estimated || ride.total_fare || ride.fare || 0;
  return {
    ...ride,
    id: ride.id,
    ride_type: ride.ride_type,
    passenger_name: ride.passenger_full_name,
    passenger_avatar_url: ride.passenger_avatar_url,
    passenger_rating: ride.passenger_rating,
    pickup_time: ride.pickup_datetime || ride.created_at,
    origin_address: ride.origin_address,
    destination_address: ride.destination_address,
    origin_lat: ride.origin_lat,
    origin_lng: ride.origin_lng,
    destination_lat: ride.destination_lat,
    destination_lng: ride.destination_lng,
    estimated_fare: parseFloat(fare),
    formattedEstimatedPrice: formatCurrencyARS(parseFloat(fare)),
    distance: parseFloat(ride.estimated_distance || 0),
    estimated_duration: parseInt(ride.estimated_duration || 0, 10),
    vehicle_type_name: ride.vehicle_type_name,
    stops: ride.stops || [],
  };
};