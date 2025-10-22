import { supabase } from '@/lib/supabaseClient';

export const getEstimatedFare = async (origin, destination, vehicleTypeId) => {
  if (!origin || !destination || !vehicleTypeId) {
    throw new Error("Origen, destino y tipo de vehículo son requeridos para calcular la tarifa.");
  }

  try {
    const route = await getRoute(origin, destination);
    
    if (!route) {
        throw new Error("No se pudo obtener la ruta para el cálculo de la tarifa.");
    }
    
    const distanceKm = route.distance;
    const durationMin = route.duration;
    
    const { data, error } = await supabase.rpc('calculate_fare', {
      p_vehicle_type_id: vehicleTypeId,
      p_distance_km: distanceKm,
      p_duration_min: durationMin
    });

    if (error) {
      throw error;
    }

    return { fare: data, distance: distanceKm, duration: durationMin };
  } catch (error) {
    console.error("Error al obtener la tarifa estimada:", error.message);
    throw new Error(`No se pudo calcular la tarifa estimada: ${error.message}`);
  }
};

export const getRoute = async (origin, destination) => {
    const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!apiKey) {
      console.error("Mapbox API Key no encontrada.");
      return null;
    }
  
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=true&geometries=geojson&language=es&overview=full&steps=true&access_token=${apiKey}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: route.distance / 1000, 
          duration: route.duration / 60,
          geometry: route.geometry.coordinates
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching route from Mapbox:", error);
      return null;
    }
};