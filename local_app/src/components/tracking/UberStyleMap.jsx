import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = { height: '100%', width: '100%' };

const lightMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
    { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

const mapOptions = {
  styles: lightMapStyle,
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

const UberStyleMap = ({ driverLocation, passengerLocation, destinationLocation, status, userType, directionsResult, isNavigating }) => {
  const [map, setMap] = useState(null);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  useEffect(() => {
    if (map && directionsResult) {
      const bounds = new window.google.maps.LatLngBounds();
      if (driverLocation) bounds.extend(new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng));
      
      if (status === 'driver_arriving' && passengerLocation) {
        bounds.extend(new window.google.maps.LatLng(passengerLocation.lat, passengerLocation.lng));
      } else if (status === 'in_progress' && destinationLocation) {
        bounds.extend(new window.google.maps.LatLng(destinationLocation.lat, destinationLocation.lng));
      }
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, isNavigating ? 150 : 100);
      }
    }
  }, [map, driverLocation, passengerLocation, destinationLocation, status, userType, directionsResult, isNavigating]);

  const driverIcon = {
    url: '/car-icon.svg',
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 20),
  };

  const passengerIcon = {
    url: '/passenger-icon.svg',
    scaledSize: new window.google.maps.Size(35, 35),
    anchor: new window.google.maps.Point(17, 17),
  };

  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} options={mapOptions} onLoad={onMapLoad} zoom={15}>
      {driverLocation?.lat && (
        <Marker position={{ lat: driverLocation.lat, lng: driverLocation.lng }} icon={driverIcon} title="Conductor" />
      )}

      {passengerLocation?.lat && (
        <Marker position={{ lat: passengerLocation.lat, lng: passengerLocation.lng }} icon={passengerIcon} title="Pasajero" />
      )}

      {status === 'in_progress' && destinationLocation?.lat && (
        <Marker position={{ lat: destinationLocation.lat, lng: destinationLocation.lng }} title="Destino" />
      )}

      {directionsResult && (
        <DirectionsRenderer
          directions={directionsResult}
          options={{
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: '#000000',
              strokeWeight: 8,
              strokeOpacity: 0.8,
            },
          }}
        />
      )}
    </GoogleMap>
  );
};

export default UberStyleMap;