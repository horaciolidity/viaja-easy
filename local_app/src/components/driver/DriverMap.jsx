import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DriverMap = ({ currentLocation, availableRides, isOnline }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const rideMarkersRef = useRef([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOnline || !mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: currentLocation ? [currentLocation.lng, currentLocation.lat] : [-58.3816, -34.6037],
      zoom: 14,
    });
    mapRef.current = map;

    map.on('load', () => {
      setIsLoading(false);
      if (currentLocation) {
        map.flyTo({ center: [currentLocation.lng, currentLocation.lat], zoom: 15 });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isOnline]);

  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    const coords = [currentLocation.lng, currentLocation.lat];

    if (!markerRef.current) {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.style.backgroundImage = 'url(/car-icon-map.svg)';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundSize = 'contain';

      markerRef.current = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(coords);
    }
    
    mapRef.current.flyTo({ center: coords, zoom: 15, essential: true });

  }, [currentLocation]);

  useEffect(() => {
    if (!mapRef.current) return;

    rideMarkersRef.current.forEach(marker => marker.remove());
    rideMarkersRef.current = [];

    if (availableRides && availableRides.length > 0) {
      availableRides.forEach(ride => {
        if (ride.origin_lat && ride.origin_lng) {
          const el = document.createElement('div');
          el.className = 'ride-marker';
          el.style.backgroundImage = 'url(/passenger-icon.svg)';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.backgroundSize = 'contain';
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([ride.origin_lng, ride.origin_lat])
            .setPopup(new mapboxgl.Popup().setHTML(`
              <div class="p-2">
                <h4 class="font-bold text-sm">${ride.ride_type === 'now' ? 'Viaje Inmediato' : 'Viaje Programado'}</h4>
                <p class="text-xs">Desde: ${ride.origin_address.substring(0, 25)}...</p>
                <p class="text-xs">Hasta: ${ride.destination_address.substring(0, 25)}...</p>
                <p class="font-semibold text-xs mt-1">Tarifa: $${ride.fare_estimated}</p>
              </div>
            `))
            .addTo(mapRef.current);
          rideMarkersRef.current.push(marker);
        }
      });
    }
  }, [availableRides]);

  if (!isOnline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6 h-96"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa</h3>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Conéctate para ver el mapa</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden h-96"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Mapa en Tiempo Real</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">En vivo</span>
          </div>
        </div>
      </div>
      
      <div className="relative h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Cargando mapa...</p>
            </div>
          </div>
        )}
        <div ref={mapContainerRef} className="h-full" />
      </div>
    </motion.div>
  );
};

export default DriverMap;