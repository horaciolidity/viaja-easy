// src/services/tariffService.js
import { supabase } from '@/lib/supabaseClient';

// UUID reales de tu DB
const VEHICLE_TYPE_MAP = {
  auto: '272648c2-3657-47a6-bf71-03ce23b4ebc3',
  moto: 'ed501442-a4ff-4b3b-afd1-566c48724c20',
};

// --- helpers ---
const isUuid = (s) => typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s);
const toKey = (v) =>
  (typeof v === 'string' ? v : (v?.slug || v?.name || v?.id || v?.vehicle_type_id || '')).toString().trim();

/**
 * Devuelve SIEMPRE un UUID válido:
 * - si viene UUID, lo devuelve
 * - si viene 'auto'|'moto'|'Auto'|'Moto' o name/slug -> lo mapea
 * - si viene objeto {id,name,slug,vehicle_type_id} -> resuelve en ese orden
 */
function normalizeVehicleRefOrThrow(vehicleRef) {
  const raw = toKey(vehicleRef);
  if (!raw) throw new Error('Referencia de vehículo vacía');

  // 1) UUID directo
  if (isUuid(raw)) return raw;

  // 2) por nombre/slug
  const key = raw.toLowerCase();
  const mapped = VEHICLE_TYPE_MAP[key];
  if (mapped) return mapped;

  // 3) si vino objeto con id uuid
  if (vehicleRef && typeof vehicleRef === 'object') {
    if (isUuid(vehicleRef.id)) return vehicleRef.id;
    if (isUuid(vehicleRef.vehicle_type_id)) return vehicleRef.vehicle_type_id;
  }

  throw new Error(`No se pudo resolver vehicleRef='${raw}' a un UUID`);
}

export const getVehicleTypesWithTariffs = async () => {
  const { data, error } = await supabase.rpc('get_vehicle_types_with_tariffs');
  if (error) {
    console.error('RPC get_vehicle_types_with_tariffs error:', error);
    throw error;
  }
  return data;
};

export async function fetchTariff(vehicleRef, rideType = 'scheduled') {
  // Normalización robusta + trazas
  const uuid = normalizeVehicleRefOrThrow(vehicleRef);
  const rt = (rideType || 'scheduled').toString().toLowerCase();

  console.log('[TARIFA] vehicleRef IN =>', vehicleRef);
  console.log('[TARIFA] vehicle UUID  =>', uuid, '| rideType =>', rt);

  const { data, error } = await supabase.rpc('get_tariff_for_ride_json', {
    p_vehicle_ref: uuid,
    p_ride_type: rt,
  });

  if (error) {
    console.error('RPC get_tariff_for_ride_json error:', error);
    throw new Error(error.message || 'Error al obtener la tarifa.');
  }
  if (!data) {
    // respuesta vacía: fuerza un mensaje claro
    throw new Error('No hay tarifa configurada para este vehículo y tipo de viaje.');
  }

  console.log('[TARIFA] RPC result =>', data);
  return data; // { base_fare, price_per_km, price_per_minute, ... }
}

export async function fetchFareEstimate(vehicleRef, rideType, distanceKm, durationMin) {
  const uuid = normalizeVehicleRefOrThrow(vehicleRef);
  const rt = (rideType || 'scheduled').toString().toLowerCase();

  const { data, error } = await supabase.rpc('calculate_fare_estimate', {
    p_vehicle_ref: uuid,
    p_ride_type: rt,
    p_distance_km: Number(distanceKm || 0),
    p_duration_min: Number(durationMin || 0),
  });

  if (error) {
    console.error('RPC calculate_fare_estimate error:', error);
    throw new Error(error.message || 'Error al estimar la tarifa.');
  }
  return data;
}