import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import { motion } from 'framer-motion';
import { Navigation, Clock, CarFront, UserCircle } from 'lucide-react';
import { formatDuration } from '@/utils/geolocation';

const MapDisplay = ({
  driverLocation,
  passengerLocation,
  destination,
  origin,
  routePolyline, 
  status,
  isGoogleMapsLoaded
}) => {
  const mapContainerStyle = { height: '100%', width: '100%' };
  const defaultCenter = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires

  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const driverMarkerRef = useRef(null);
  const passengerMarkerRef = useRef(null);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const isValidCoord = (loc) => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng);

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidPoints = false;

    if (isValidCoord(driverLocation)) {
      bounds.extend(new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng));
      hasValidPoints = true;
    }
    if (isValidCoord(passengerLocation) && status !== 'in_progress' && status !== 'completed') {
      bounds.extend(new window.google.maps.LatLng(passengerLocation.lat, passengerLocation.lng));
      hasValidPoints = true;
    }
    if (isValidCoord(origin)) {
      bounds.extend(new window.google.maps.LatLng(origin.lat, origin.lng));
      hasValidPoints = true;
    }
    if (isValidCoord(destination)) {
      bounds.extend(new window.google.maps.LatLng(destination.lat, destination.lng));
      hasValidPoints = true;
    }
    
    if (hasValidPoints) {
      map.fitBounds(bounds);
      const newCenter = bounds.getCenter();
      setCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
    } else if (isValidCoord(origin)) {
      setCenter({ lat: origin.lat, lng: origin.lng });
      map.setZoom(15);
    } else {
      map.setCenter(defaultCenter);
      map.setZoom(12);
    }

  }, [map, driverLocation, passengerLocation, origin, destination, status]);


  useEffect(() => {
    if (isValidCoord(driverLocation) && (isValidCoord(destination) || isValidCoord(origin)) && window.google && window.google.maps) {
      const target = status === 'driver_arriving' ? origin : destination;
      if (isValidCoord(target)) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng),
            destination: new window.google.maps.LatLng(target.lat, target.lng),
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, statusCode) => {
            if (statusCode === window.google.maps.DirectionsStatus.OK) {
              if (result.routes && result.routes.length > 0 && result.routes[0].legs && result.routes[0].legs.length > 0) {
                setEstimatedTime(result.routes[0].legs[0].duration.value); // seconds
                if (status === 'driver_arriving' || status === 'in_progress') {
                   setDirectionsResponse(result); // Show route from driver to target
                } else {
                   setDirectionsResponse(null);
                }
              }
            } else {
              console.warn(`Error fetching ETA directions: ${statusCode}`);
              setEstimatedTime(null);
              setDirectionsResponse(null);
            }
          }
        );
      }
    } else {
      setEstimatedTime(null);
      setDirectionsResponse(null);
    }
  }, [driverLocation, destination, origin, status]);
  
  const driverIcon = {
    path: window.google?.maps?.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 6,
    rotation: driverLocation?.heading || 0,
    fillColor: '#1a73e8',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: 'white',
  };
  
  const passengerIcon = {
    path: window.google?.maps?.SymbolPath.CIRCLE,
    scale: 7,
    fillColor: '#34d399',
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: 'white',
  };

  return (
    <motion.div
      className="h-64 md:h-96 bg-gray-200 relative overflow-hidden shadow-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      {isGoogleMapsLoaded ? (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }, { featureType: "transit", stylers: [{ visibility: "off" }] }]
          }}
          onLoad={onMapLoad}
        >
          {isValidCoord(driverLocation) && (
            <Marker
              position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
              icon={driverIcon}
              title="Conductor"
              ref={driverMarkerRef}
            />
          )}

          {isValidCoord(passengerLocation) && status !== 'in_progress' && status !== 'completed' && (
             <Marker
              position={{ lat: passengerLocation.lat, lng: passengerLocation.lng }}
              icon={passengerIcon}
              title="Pasajero"
              ref={passengerMarkerRef}
            />
          )}
          
          {isValidCoord(origin) && (
            <Marker 
              position={{ lat: origin.lat, lng: origin.lng }} 
              label={{ text: "O", color: "white", fontWeight: "bold" }}
              title="Origen"
            />
          )}
          {isValidCoord(destination) && (
            <Marker 
              position={{ lat: destination.lat, lng: destination.lng }} 
              label={{ text: "D", color: "white", fontWeight: "bold" }}
              title="Destino"
            />
          )}

          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} options={{ suppressMarkers: true, preserveViewport: false, polylineOptions: { strokeColor: '#1a73e8', strokeWeight: 5, zIndex: 1 } }} />
          )}
          
          {!directionsResponse && routePolyline && Array.isArray(routePolyline) && routePolyline.length > 0 && (
             <Polyline
              path={routePolyline.map(p => ({ lat: p[1], lng: p[0] }))} // Assuming ORS format [lng, lat]
              options={{ strokeColor: '#FF0000', strokeWeight: 4, zIndex: 0 }}
            />
          )}

        </GoogleMap>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-300">
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      )}

      {estimatedTime !== null && (status === 'driver_arriving' || status === 'in_progress') && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm z-10">
          <motion.div
            className="bg-white rounded-lg shadow-xl p-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-900">
                  Llegada estimada: {formatDuration(estimatedTime)}
                </span>
              </div>
              <Navigation className="w-5 h-5 text-gray-400" />
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default MapDisplay;