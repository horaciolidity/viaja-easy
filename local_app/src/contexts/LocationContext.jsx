import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
import { geolocationService, getBounds as getBoundsUtil } from '@/utils/geolocation';
import { useAuth } from '@/contexts/AuthContext';

const LocationContext = createContext(null);
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation debe usarse dentro de LocationProvider');
  }
  return context;
};

/* ============================
   CONFIGURACIÓN PREDETERMINADA
   ============================ */
const ARGENTINA_DEFAULT_LOCATION = {
  lat: -34.6037,
  lng: -58.3816,
  address: 'Buenos Aires, Argentina',
  name: 'Buenos Aires',
  id: 'default-location',
};

/* ============================
   PROVIDER PRINCIPAL
   ============================ */
export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [originForRoute, setOriginForRoute] = useState(null);
  const [destinationForRoute, setDestinationForRoute] = useState(null);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const { isOnline } = useNetworkStatus();
  const { user } = useAuth();

  const isInitialLoad = useRef(true);
  const trackingStartedRef = useRef(false);
  const mapContainerRef = useRef(null);

  /* -------------------- 🔍 Geocodificar coordenadas -------------------- */
  const geocodeCoordinates = useCallback(
    async ({ lat, lng }) => {
      if (!isOnline) {
        toast({
          title: 'Sin conexión',
          description: 'No hay conexión a internet para obtener dirección.',
          variant: 'destructive',
        });
        return null;
      }

      if (!MAPBOX_TOKEN) {
        console.error('Falta VITE_MAPBOX_TOKEN');
        return null;
      }

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi&language=es`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.features?.length > 0) {
          const first = data.features[0];
          return {
            id: first.id,
            address: first.place_name,
            name: first.text || first.place_name.split(',')[0],
            lat,
            lng,
          };
        }
      } catch (err) {
        console.error('Error geocodificando:', err);
        toast({ title: 'Error', description: 'No se pudo obtener la dirección.' });
      }
      return null;
    },
    [isOnline]
  );

  /* -------------------- 📍 Actualizar ubicación -------------------- */
  const updateLocation = useCallback(
    async (position) => {
      const { latitude, longitude, accuracy, heading } = position.coords;
      const coords = { lat: latitude, lng: longitude };

      // Mostrar advertencia de baja precisión
      if (accuracy > 50) {
        toast({
          title: 'Precisión baja',
          description: 'Muévete a un lugar abierto para mejorar la señal GPS.',
          duration: 6000,
        });
      }

      // Evita geocodificación innecesaria
      let addressInfo = null;
      if (
        !currentLocation ||
        Math.abs(currentLocation.lat - latitude) > 0.0001 ||
        Math.abs(currentLocation.lng - longitude) > 0.0001
      ) {
        addressInfo = await geocodeCoordinates(coords);
      }

      const newLoc = {
        ...coords,
        heading,
        accuracy,
        address:
          addressInfo?.address ||
          currentLocation?.address ||
          `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        name:
          addressInfo?.name ||
          currentLocation?.name ||
          `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        id: addressInfo?.id || `current-loc-${Date.now()}`,
      };

      setCurrentLocation(newLoc);

      if (isInitialLoad.current) {
        setOriginForRoute(newLoc);
        isInitialLoad.current = false;
      }

      setLocationError(null);
      return newLoc;
    },
    [geocodeCoordinates, currentLocation]
  );

  /* -------------------- ⚠️ Manejo de error de GPS -------------------- */
  const handleLocationError = useCallback((err) => {
    console.warn('Error GPS:', err.message);
    setLocationError(err.message || 'No se pudo obtener la ubicación.');

    if (isInitialLoad.current) {
      setCurrentLocation(ARGENTINA_DEFAULT_LOCATION);
      setOriginForRoute(ARGENTINA_DEFAULT_LOCATION);
      toast({
        title: 'Ubicación no disponible',
        description: 'Se usará una ubicación predeterminada (Buenos Aires).',
        variant: 'default',
      });
      isInitialLoad.current = false;
    }
    setLoading(false);
  }, []);

  /* -------------------- 🚀 Iniciar seguimiento GPS -------------------- */
  const startLocationTracking = useCallback(() => {
    if (trackingStartedRef.current) return;

    geolocationService.startWatching(async (pos, err) => {
      if (err) return handleLocationError(err);
      await updateLocation(pos);
      if (loading) setLoading(false);
    });

    trackingStartedRef.current = true;
    setIsTracking(true);
  }, [updateLocation, handleLocationError, loading]);

  /* -------------------- 🛑 Detener seguimiento GPS -------------------- */
  const stopLocationTracking = useCallback(() => {
    if (!trackingStartedRef.current) return;
    geolocationService.stopWatching();
    trackingStartedRef.current = false;
    setIsTracking(false);
  }, []);

  /* -------------------- 🔁 Ciclo de vida -------------------- */
  useEffect(() => {
    if (user) {
      startLocationTracking();
    } else {
      stopLocationTracking();
      setCurrentLocation(ARGENTINA_DEFAULT_LOCATION);
      if (loading) setLoading(false);
    }
    return () => stopLocationTracking();
  }, [user, startLocationTracking, stopLocationTracking, loading]);

  /* -------------------- 🧭 Calcular ruta -------------------- */
  const calculateRoute = useCallback(
    async (origin, destination) => {
      if (!isOnline) {
        toast({ title: 'Sin conexión', description: 'No se puede calcular la ruta.' });
        return null;
      }

      if (!MAPBOX_TOKEN) {
        toast({ title: 'Error', description: 'Falta el token de Mapbox.' });
        return null;
      }

      if (!origin?.lat || !destination?.lat) return null;

      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes?.length > 0) {
          const routeData = data.routes[0];
          const leg = routeData.legs[0];
          const newRoute = {
            origin,
            destination,
            distance: routeData.distance / 1000,
            duration: routeData.duration / 60,
            geometry: routeData.geometry,
            steps: leg.steps.map((s) => ({
              instruction: s.maneuver.instruction,
              distance: s.distance,
              duration: s.duration,
            })),
            source: 'mapbox',
          };
          setRoute(newRoute);
          return newRoute;
        }
        throw new Error('No se encontraron rutas.');
      } catch (err) {
        console.error('Error al calcular ruta:', err);
        toast({
          title: 'Error',
          description: 'No se pudo calcular la ruta.',
          variant: 'destructive',
        });
        return null;
      }
    },
    [isOnline]
  );

  /* -------------------- 🔎 Búsqueda de lugares -------------------- */
  const searchPlaces = useCallback(
    async (query) => {
      if (!query || query.length < 3) return [];

      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=ar&types=address,poi,place&language=es`;

      if (currentLocation?.lng && currentLocation?.lat) {
        url += `&proximity=${currentLocation.lng},${currentLocation.lat}`;
      }

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.features) {
          return data.features.map((f) => ({
            id: f.id,
            description: f.place_name,
            structured_formatting: {
              main_text: f.text,
              secondary_text: f.place_name
                .replace(f.text, '')
                .trim()
                .replace(/^,/, '')
                .trim(),
            },
          }));
        }
      } catch (err) {
        console.error('Error búsqueda de lugares:', err);
      }
      return [];
    },
    [currentLocation]
  );

  /* -------------------- 📍 Obtener detalles de lugar -------------------- */
  const getPlaceDetails = useCallback(async (placeId) => {
    if (!placeId) return null;
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${placeId}.json?access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features?.length > 0) {
        const f = data.features[0];
        return {
          id: f.id,
          name: f.text || f.place_name.split(',')[0],
          address: f.place_name,
          lat: f.center[1],
          lng: f.center[0],
        };
      }
    } catch (err) {
      console.error('Error getPlaceDetails:', err);
      toast({ title: 'Error', description: 'No se pudo obtener el lugar.' });
    }
    return null;
  }, []);

  /* -------------------- 💾 Contexto expuesto -------------------- */
  const value = {
    currentLocation,
    originForRoute,
    setOriginForRoute,
    destinationForRoute,
    setDestinationForRoute,
    route,
    loading,
    locationError,
    isTracking,
    calculateRoute,
    searchPlaces,
    getPlaceDetails,
    getBounds: getBoundsUtil,
    clearRoute: () => setRoute(null),
    startLocationTracking,
    stopLocationTracking,
    geocodeCoordinates,
    mapContainerRef,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
