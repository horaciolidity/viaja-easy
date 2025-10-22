import React, { useRef, useEffect, useState, useMemo } from 'react';
    import Map, { Marker, Source, Layer, GeolocateControl } from 'react-map-gl';
    import mapboxgl from 'mapbox-gl';
    import { motion } from 'framer-motion';
    import { getBounds, calculateBearing } from '@/utils/geolocation';
    import RecenterButton from '@/components/common/RecenterButton';
    
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapStyle = "mapbox://styles/mapbox/streets-v12";
    
    const routeLayerStyle = {
      id: 'route-driver',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#1a73e8',
        'line-width': 8,
        'line-opacity': 0.8,
      },
    };
    
    const PointMarker = ({ location, label, color }) => {
        if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number' || isNaN(location.lat) || isNaN(location.lng)) return null;
        return (
          <Marker longitude={location.lng} latitude={location.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <span className="text-xs bg-black/60 text-white px-2 py-0.5 rounded-md mb-1">{label}</span>
              <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md`} style={{ backgroundColor: color }} />
            </div>
          </Marker>
        );
    };
    
    const DriverNavigationView = ({ origin, destination, driverLocation, rideStatus }) => {
      const mapRef = useRef(null);
      const [routeGeometry, setRouteGeometry] = useState(null);
      const [isUserInteracting, setIsUserInteracting] = useState(false);
    
      const [viewState, setViewState] = useState({
        longitude: driverLocation?.lng || -58.3816,
        latitude: driverLocation?.lat || -34.6037,
        zoom: 15,
        pitch: 50,
        bearing: 0,
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
      });
    
      const recenterMap = () => {
        if (!driverLocation || !mapRef.current) return;
        const map = mapRef.current.getMap();
        map.flyTo({
          center: [driverLocation.lng, driverLocation.lat],
          zoom: 16,
          pitch: 50,
          bearing: driverLocation.heading || 0,
          duration: 1500,
        });
        setIsUserInteracting(false);
      };
      
      const isValidCoord = (loc) => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng);
    
      useEffect(() => {
        const fetchRoute = async () => {
          if (!isValidCoord(origin) || !isValidCoord(destination)) {
            setRouteGeometry(null);
            return;
          }
          const start = [origin.lng, origin.lat];
          const end = [destination.lng, destination.lat];
          
          try {
            const query = await fetch(
              `https://api.mapbox.com/directions/v5/mapbox/driving/${start.join(',')};${end.join(',')}` +
              `?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
            );
            const json = await query.json();
            const data = json.routes[0];
            if(data) {
              setRouteGeometry(data.geometry);
            }
          } catch (error) {
            console.error("Error fetching Mapbox route:", error);
          }
        };
        
        fetchRoute();
      }, [origin, destination]);
    
      useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map || isUserInteracting || !isValidCoord(driverLocation)) return;
        
        map.easeTo({
          center: [driverLocation.lng, driverLocation.lat],
          zoom: 16,
          bearing: driverLocation.heading || map.getBearing(),
          pitch: 50,
          duration: 1000
        });
    
      }, [driverLocation, isUserInteracting]);
    
      const routeGeoJson = useMemo(() => {
        if (!routeGeometry) return null;
        return {
          type: 'Feature',
          properties: {},
          geometry: routeGeometry
        };
      }, [routeGeometry]);
      
      const endPointLabel = rideStatus === 'in_progress' ? 'Destino' : 'Pasajero';
      const endPointColor = rideStatus === 'in_progress' ? '#dc2626' : '#2563eb';
    
      return (
        <div className="h-full w-full bg-gray-300 relative">
          <Map
            ref={mapRef}
            initialViewState={viewState}
            onMoveStart={() => setIsUserInteracting(true)}
            onMove={evt => setViewState(evt.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={mapStyle}
            style={{ width: '100%', height: '100%' }}
          >
            <PointMarker location={destination} label={endPointLabel} color={endPointColor} />
            
            {routeGeoJson && (
              <Source id="route" type="geojson" data={routeGeoJson}>
                <Layer {...routeLayerStyle} />
              </Source>
            )}
          </Map>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              style={{ transform: `rotate(${driverLocation?.heading || 0}deg)` }}
              className="w-10 h-10 transition-transform duration-500 ease-linear"
            >
              <img src="/driver-icon.svg" alt="Conductor" className="w-full h-full drop-shadow-lg" />
            </motion.div>
          </div>
          <RecenterButton show={isUserInteracting} onClick={recenterMap} className="top-20" />
        </div>
      );
    };
    
    export default DriverNavigationView;