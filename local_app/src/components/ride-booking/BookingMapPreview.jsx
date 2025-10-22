import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';

const BookingMapPreview = ({ origin, destination, routeData }) => {
  const mapRef = useRef(null);
  const { isGoogleMapsLoaded } = useLocation();
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);

  useEffect(() => {
    if (isGoogleMapsLoaded && mapRef.current && !map) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: origin || { lat: -34.6037, lng: -58.3816 },
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }, { featureType: "transit", stylers: [{ visibility: "off" }] }]
      });
      setMap(newMap);

      const newDirectionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: { strokeColor: '#1a73e8', strokeWeight: 5 }
      });
      newDirectionsRenderer.setMap(newMap);
      setDirectionsRenderer(newDirectionsRenderer);
    }
  }, [isGoogleMapsLoaded, mapRef, map, origin]);

  useEffect(() => {
    if (map) {
      if (originMarker) originMarker.setMap(null);
      if (destinationMarker) destinationMarker.setMap(null);

      if (origin) {
        const newOriginMarker = new window.google.maps.Marker({
          position: origin,
          map: map,
          label: 'O'
        });
        setOriginMarker(newOriginMarker);
      }

      if (destination) {
        const newDestMarker = new window.google.maps.Marker({
          position: destination,
          map: map,
          label: 'D'
        });
        setDestinationMarker(newDestMarker);
      }

      if (routeData?.directionsResult) {
        directionsRenderer?.setDirections(routeData.directionsResult);
        const bounds = routeData.directionsResult.routes[0].bounds;
        map.fitBounds(bounds);
      } else {
        directionsRenderer?.setDirections({ routes: [] });
        if (origin && destination) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(origin);
          bounds.extend(destination);
          map.fitBounds(bounds);
        } else if (origin) {
          map.setCenter(origin);
          map.setZoom(15);
        }
      }
    }
  }, [map, origin, destination, routeData, directionsRenderer]);

  return <div ref={mapRef} style={{ height: '250px', width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }} />;
};

export default BookingMapPreview;