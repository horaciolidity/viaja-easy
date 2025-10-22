import React, { useEffect, useRef, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Car } from 'lucide-react';
import { getBounds } from '@/utils/geolocation';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const ActiveDriversMap = ({ drivers, selectedRide }) => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: -58.3816,
    latitude: -34.6037,
    zoom: 12
  });
  
  const [routeGeoJson, setRouteGeoJson] = useState(null);

  const fitBoundsToMarkers = useCallback(() => {
    if (mapRef.current && (drivers.length > 0 || selectedRide)) {
      const points = [];
      drivers.forEach(d => {
        if (d.last_location?.lat && d.last_location?.lng) {
          points.push({ lat: d.last_location.lat, lng: d.last_location.lng });
        }
      });
      if (selectedRide) {
        if (selectedRide.origin_lat && selectedRide.origin_lng) points.push({ lat: selectedRide.origin_lat, lng: selectedRide.origin_lng });
        if (selectedRide.destination_lat && selectedRide.destination_lng) points.push({ lat: selectedRide.destination_lat, lng: selectedRide.destination_lng });
        if (selectedRide.driver?.last_location?.lat && selectedRide.driver?.last_location?.lng) points.push({ lat: selectedRide.driver.last_location.lat, lng: selectedRide.driver.last_location.lng });
      }

      if (points.length > 0) {
        const bounds = getBounds(points);
        if(bounds) {
          mapRef.current.fitBounds(bounds, { padding: 60, duration: 1000 });
        }
      }
    }
  }, [drivers, selectedRide]);


  useEffect(() => {
    fitBoundsToMarkers();
  }, [fitBoundsToMarkers]);
  
  const fetchRoute = useCallback(async () => {
    if (!selectedRide || !selectedRide.driver?.last_location || !selectedRide.destination_lat) {
      setRouteGeoJson(null);
      return;
    }

    const start = selectedRide.driver.last_location;
    const end = { lat: selectedRide.destination_lat, lng: selectedRide.destination_lng };
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes) {
        setRouteGeoJson({ type: 'Feature', geometry: data.routes[0].geometry });
      }
    } catch (error) {
      console.error('Error fetching Mapbox route:', error);
    }
  }, [selectedRide]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  const availableCount = drivers.filter(d => d.status === 'available').length;
  const onTripCount = drivers.filter(d => d.status === 'on_trip').length;

  if (!MAPBOX_TOKEN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapa de Conductores Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500">Token de Mapbox no configurado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const routeLayer = {
    id: 'route',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#3b82f6',
      'line-width': 4
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Mapa de Conductores Activos
          {selectedRide && (
            <Badge variant="outline" className="ml-2">
              Siguiendo viaje seleccionado
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Disponibles ({availableCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">En viaje ({onTripCount})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full rounded-lg border overflow-hidden">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            style={{ width: '100%', height: '100%' }}
          >
            {drivers.map((driver) => {
              if (!driver.last_location?.lat || !driver.last_location?.lng) return null;
              
              const isAvailable = driver.status === 'available';
              const isSelected = selectedRide?.driver?.id === driver.id;
              
              return (
                <Marker
                  key={driver.id}
                  longitude={driver.last_location.lng}
                  latitude={driver.last_location.lat}
                  anchor="center"
                >
                  <div 
                    className={`relative transform transition-all duration-200 ${isSelected ? 'scale-125 z-10' : 'hover:scale-110'}`}
                    style={{ 
                      transform: `rotate(${driver.last_location.heading || 0}deg)`,
                      filter: isSelected ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isAvailable ? 'bg-green-500' : 'bg-blue-500'
                    } border-2 border-white shadow-lg`}>
                      <Car className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </Marker>
              );
            })}
            
            {selectedRide && selectedRide.origin_lat && selectedRide.origin_lng && (
              <Marker
                longitude={selectedRide.origin_lng}
                latitude={selectedRide.origin_lat}
                anchor="center"
              >
                 <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse flex items-center justify-center text-white font-bold">O</div>
              </Marker>
            )}
            
            {selectedRide && selectedRide.destination_lat && selectedRide.destination_lng && (
              <Marker
                longitude={selectedRide.destination_lng}
                latitude={selectedRide.destination_lat}
                anchor="center"
              >
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold">D</div>
              </Marker>
            )}
            
            {routeGeoJson && (
              <Source id="route-source" type="geojson" data={routeGeoJson}>
                <Layer {...routeLayer} />
              </Source>
            )}
          </Map>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveDriversMap;