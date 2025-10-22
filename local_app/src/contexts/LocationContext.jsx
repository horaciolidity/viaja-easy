import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
    import { toast } from '@/components/ui/use-toast';
    import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
    import { geolocationService, getBounds as getBoundsUtil } from '@/utils/geolocation';
    import { useAuth } from '@/contexts/AuthContext';
    import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

    const LocationContext = createContext(null);
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    
    export const useLocation = () => {
      const context = useContext(LocationContext);
      if (!context) {
        throw new Error('useLocation debe usarse dentro de un LocationProvider');
      }
      return context;
    };
    
    const ARGENTINA_DEFAULT_LOCATION = {
      lat: -34.6037,
      lng: -58.3816,
      address: 'Buenos Aires, Argentina',
      name: 'Buenos Aires',
      id: 'default-location'
    };
    
    export const LocationProvider = ({ children }) => {
      const [currentLocation, setCurrentLocation] = useState(null);
      const [originForRoute, setOriginForRoute] = useState(null);
      const [destinationForRoute, setDestinationForRoute] = useState(null);
      const [route, setRoute] = useState(null);
      const [loading, setLoading] = useState(true);
      const [isTracking, setIsTracking] = useState(false);
      const [locationError, setLocationError] = useState(null);
      const { isOnline } = useNetworkStatus();
      const { user, logout } = useAuth();
      const isInitialLoad = useRef(true);
      const trackingStartedRef = useRef(false);
      const lowAccuracyToastId = useRef(null);
      const mapContainerRef = useRef(null);
    
      const geocodeCoordinates = useCallback(async ({ lat, lng }) => {
        if (!isOnline) {
          NetworkErrorHandler.handleError({ message: 'Sin conexión a internet' }, 'búsqueda de dirección');
          return null;
        }
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
          console.error("Geocode attempt with invalid coordinates:", {lat, lng});
          return null;
        }
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi&language=es`;
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const firstResult = data.features[0];
            return {
              address: firstResult.place_name,
              name: firstResult.text || firstResult.place_name.split(',')[0],
              id: firstResult.id,
              lat,
              lng
            };
          }
          return null;
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'geocodificación inversa de Mapbox');
          return null;
        }
      }, [isOnline]);
    
      const updateLocation = useCallback(async (position) => {
        const { latitude, longitude, heading, accuracy } = position.coords;
        
        if (accuracy > 50) {
            if (!lowAccuracyToastId.current) {
              const { id } = toast({
                  title: "Precisión de ubicación baja",
                  description: "Intenta moverte a un lugar abierto para mejorar la señal.",
                  variant: "default",
                  duration: 8000
              });
              lowAccuracyToastId.current = id;
            }
        } else {
            if (lowAccuracyToastId.current) {
                lowAccuracyToastId.current = null;
            }
        }
    
        const newCoords = { lat: latitude, lng: longitude };
        
        let addressInfo = null;
        if (!currentLocation || Math.abs(currentLocation.lat - latitude) > 0.0001 || Math.abs(currentLocation.lng - longitude) > 0.0001) {
            addressInfo = await geocodeCoordinates(newCoords);
        }

        const newLocation = {
          ...newCoords,
          heading: heading,
          accuracy: accuracy,
          address: addressInfo?.address || currentLocation?.address || `${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)}`,
          name: addressInfo?.name || currentLocation?.name || `${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)}`,
          id: addressInfo?.id || currentLocation?.id || `current-loc-${Date.now()}`,
        };
    
        setCurrentLocation(newLocation);
        if (isInitialLoad.current) {
            setOriginForRoute(newLocation);
            isInitialLoad.current = false;
        }
        
        setLocationError(null);
        return newLocation;
      }, [geocodeCoordinates, currentLocation]);
    
      const handleLocationError = useCallback((error) => {
        console.error('LOCATION_CONTEXT_DEBUG: Error de ubicación GPS:', error.message);
        setLocationError(error.message || 'No se pudo obtener la ubicación GPS.');
        if(isInitialLoad.current) {
            setCurrentLocation(ARGENTINA_DEFAULT_LOCATION);
            setOriginForRoute(ARGENTINA_DEFAULT_LOCATION);
            setLoading(false);
            isInitialLoad.current = false;
            toast({
              title: "Error de Ubicación",
              description: "No se pudo obtener tu ubicación. Se usará una predeterminada.",
              variant: "destructive",
            });
        }
      }, []);
      
      const startLocationTracking = useCallback(() => {
        if (trackingStartedRef.current) return;
        
        geolocationService.startWatching(async (position, error) => {
            if (!trackingStartedRef.current) return;
            if (error) {
                handleLocationError(error);
                setIsTracking(false);
                trackingStartedRef.current = false;
                return;
            }
            if (position) {
                await updateLocation(position);
                if (loading) setLoading(false);
            }
        });
        trackingStartedRef.current = true;
        setIsTracking(true);
      }, [handleLocationError, updateLocation, loading]);
    
      const stopLocationTracking = useCallback(() => {
        if (!trackingStartedRef.current) return;
        geolocationService.stopWatching();
        trackingStartedRef.current = false;
        setIsTracking(false);
      }, []);
      
      useEffect(() => {
        if (user) {
          startLocationTracking();
        } else {
          stopLocationTracking();
          setCurrentLocation(ARGENTINA_DEFAULT_LOCATION);
          if (loading) setLoading(false);
        }
        
        return () => {
          stopLocationTracking();
        };
      }, [user, startLocationTracking, stopLocationTracking, loading]);
    
      const calculateRoute = useCallback(async (origin, destination) => {
        if (!isOnline) {
          NetworkErrorHandler.handleError({ message: 'Sin conexión a internet' }, 'cálculo de ruta');
          return null;
        }
        if (!origin?.lat || !destination?.lat || isNaN(origin.lat) || isNaN(origin.lng) || isNaN(destination.lat) || isNaN(destination.lng)) {
          console.error("Calculate route attempt with invalid coordinates", {origin, destination});
          return null;
        }
    
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
        
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const routeData = data.routes[0];
            const leg = routeData.legs[0];
            const newRoute = {
              origin: { lat: origin.lat, lng: origin.lng, address: origin.address },
              destination: { lat: destination.lat, lng: destination.lng, address: destination.address },
              distance: routeData.distance / 1000, // in km
              duration: routeData.duration / 60, // in minutes
              geometry: routeData.geometry,
              steps: leg.steps.map(step => ({
                instructions: step.maneuver.instruction,
                distance: step.distance,
                duration: step.duration,
              })),
              source: 'mapbox'
            };
            setRoute(newRoute);
            return newRoute;
          }
          throw new Error("No se encontraron rutas.");
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'cálculo de ruta de Mapbox');
          throw error;
        }
      }, [isOnline]);
    
      const searchPlaces = useCallback(async (query) => {
        if (query.length < 3) return [];
        
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=ar&types=address,poi,place&language=es`;
        
        if (currentLocation?.lng && currentLocation?.lat && !isNaN(currentLocation.lng) && !isNaN(currentLocation.lat)) {
          url += `&proximity=${currentLocation.lng},${currentLocation.lat}`;
        }

        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.features) {
            return data.features.map(f => ({
              id: f.id,
              description: f.place_name,
              structured_formatting: {
                main_text: f.text,
                secondary_text: f.place_name.replace(f.text, '').trim().replace(/^,/, '').trim(),
              }
            }));
          }
          return [];
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'búsqueda de lugares');
          return [];
        }
      }, [currentLocation]);
    
      const getPlaceDetails = useCallback(async (placeId) => {
        if (!placeId) return null;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${placeId}.json?access_token=${MAPBOX_TOKEN}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                return {
                    id: feature.id,
                    name: feature.text || feature.place_name.split(',')[0],
                    address: feature.place_name,
                    lat: feature.center[1],
                    lng: feature.center[0],
                };
            }
            throw new Error("Lugar no encontrado.");
        } catch (error) {
            NetworkErrorHandler.handleError(error, 'obtención de detalles de lugar');
            return null;
        }
      }, []);
    
      const value = {
        currentLocation, originForRoute, setOriginForRoute,
        destinationForRoute, setDestinationForRoute, route,
        loading, locationError, isTracking,
        calculateRoute, searchPlaces, getPlaceDetails, getBounds: getBoundsUtil,
        clearRoute: () => setRoute(null),
        startLocationTracking,
        stopLocationTracking,
        geocodeCoordinates,
        mapContainerRef,
      };
    
      return (
        <LocationContext.Provider value={value}>
          {children}
        </LocationContext.Provider>
      );
    };