import { supabase } from '@/lib/supabaseClient';

const RIDE_BASE_COLUMNS = `
  id, passenger_id, driver_id, status, ride_type, vehicle_type_id, pin_code,
  created_at, completed_at, cancelled_at, cancel_reason,
  estimated_distance_km, actual_distance_km, estimated_duration_min, actual_duration_min,
  stops, route_polyline
`;

const SCHEDULED_BASE_COLUMNS = `
  id, passenger_id, driver_id, status, ride_type, vehicle_type_id, pin_code,
  created_at, completed_at, cancelled_at, cancel_reason,
  estimated_distance, estimated_duration,
  stops, route_polyline
`;

const HOURLY_BASE_COLUMNS = `
  id, passenger_id, driver_id, status, ride_type, vehicle_type_id, pin_code,
  created_at, completed_at, cancelled_at, cancel_reason,
  estimated_distance_km, actual_distance_km, actual_duration_min,
  stops, route_polyline
`;

const FARE_COLUMNS = `
  fare_estimated, actual_fare, fare_paid, commission_fee, app_earnings, driver_earnings,
  wait_fee, total_wait_minutes, driver_cash, payment_method, payment_status, prepaid_amount
`;

const LOCATION_COLUMNS = `
  origin_address:origin_address, origin_lat:origin_lat, origin_lng:origin_lng,
  destination_address:destination_address, destination_lat:destination_lat, destination_lng:destination_lng
`;

const USER_RELATIONS = `
  passenger:passenger_id(id, full_name, avatar_url, phone, rating, pending_debt),
  driver:driver_id(id, full_name, avatar_url, phone, rating, vehicle_info)
`;

export const RIDE_SELECT_QUERY = `
  ${RIDE_BASE_COLUMNS},
  ${FARE_COLUMNS},
  ${LOCATION_COLUMNS},
  ${USER_RELATIONS}
`;

export const SCHEDULED_RIDE_SELECT_QUERY = `
  ${SCHEDULED_BASE_COLUMNS},
  ${FARE_COLUMNS},
  ${LOCATION_COLUMNS},
  ${USER_RELATIONS}
`;

const HOURLY_LOCATION_COLUMNS = `
  origin_address:start_location_address, origin_lat:start_location_lat, origin_lng:start_location_lng,
  description
`;

const HOURLY_FARE_COLUMNS = `
  total_fare, base_fare, extra_km_fare, platform_fee, total_included_km,
  fare_paid, driver_earnings, app_earnings, wait_fee, driver_cash,
  payment_method, payment_status, prepaid_amount
`;

export const HOURLY_SELECT_QUERY = `
  ${HOURLY_BASE_COLUMNS},
  ${HOURLY_FARE_COLUMNS},
  ${HOURLY_LOCATION_COLUMNS},
  ${USER_RELATIONS},
  booked_hours
`;

const PACKAGE_BASE_COLUMNS = `
  id, user_id, driver_id, status, vehicle_type_id, security_pin,
  created_at, updated_at, wait_started_at, wait_ended_at, total_wait_minutes, wait_fee
`;

const PACKAGE_LOCATION_COLUMNS = `
  origin_address:pickup_address, origin_lat:pickup_lat, origin_lng:pickup_lng,
  destination_address:delivery_address, destination_lat:delivery_lat, destination_lng:delivery_lng
`;

const PACKAGE_INFO_COLUMNS = `
  sender_name, sender_phone, recipient_name, recipient_phone,
  package_description, package_weight_kg, fare_estimated
`;

const PACKAGE_USER_RELATIONS = `
  passenger:user_id(id, full_name, avatar_url, rating),
  driver:driver_id(id, full_name, avatar_url, phone, rating, vehicle_info)
`;

export const PACKAGE_DELIVERY_SELECT_QUERY = `
  ${PACKAGE_BASE_COLUMNS},
  ${PACKAGE_LOCATION_COLUMNS},
  ${PACKAGE_INFO_COLUMNS},
  ${PACKAGE_USER_RELATIONS}
`;


export const getQueryForRide = (rideType, userType) => {
  switch (rideType) {
    case 'hourly':
      return HOURLY_SELECT_QUERY;
    case 'package':
      return PACKAGE_DELIVERY_SELECT_QUERY;
    case 'scheduled':
      return SCHEDULED_RIDE_SELECT_QUERY;
    case 'now':
    case 'ride':
    default:
      return RIDE_SELECT_QUERY;
  }
};

export const getTableForRide = (rideType) => {
  switch (rideType) {
    case 'hourly':
      return 'hourly_bookings';
    case 'scheduled':
      return 'scheduled_rides';
    case 'package':
      return 'package_deliveries';
    case 'now':
    case 'ride':
    default:
      return 'rides';
  }
};