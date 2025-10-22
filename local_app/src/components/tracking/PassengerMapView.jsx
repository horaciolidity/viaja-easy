import React, { useRef, useEffect, useState, useMemo } from 'react';
    import Map, { Marker, Source, Layer } from 'react-map-gl';
    import { getBounds } from '@/utils/geolocation';
    import { motion } from 'framer-motion';
    import RecenterButton from '@/components/common/RecenterButton';
    import { useLocation } from '@/contexts/LocationContext';
    
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapStyle = "mapbox://styles/mapbox/streets-v12";
    
    const routeLayerStyle = {
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#1a73e8',
        'line-width': 6,
        'line-opacity': 0.8,
      },
    };
    
    const DriverMarker = ({ location }) => {
      const lastBearing = useRef(0);
      if (!location) return null;
      
      const newBearing = location.heading || 0;
      lastBearing.current = newBearing;
    
      return (
        <Marker longitude={location.lng} latitude={location.lat} anchor="center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            style={{ transform: `rotate(${newBearing}deg)` }}
            className="w-10 h-10 transition-transform duration-500 ease-linear"
          >
            <img src="/driver-icon.svg" alt="Conductor" className="w-full h-full drop-shadow-lg" />
          </motion.div>
        </Marker>
      );
    };
    
    const PassengerMarker = ({ location }) => {
      if (!location) return null;
      return (
        <Marker longitude={location.lng} latitude={location.lat} anchor="center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
             <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
          </motion.div>
        </Marker>
      );
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
    
    const PassengerMapView = ({ ride }) => {
      const mapRef = useRef(null);
      const [routeGeometry, setRouteGeometry] = useState(null);
      const [isUserInteracting, setIsUserInteracting] = useState(false);
      const { currentLocation } = useLocation();
    
      const [viewState, setViewState] = useState({
        longitude: -58.3816,
        latitude: -34.6037,
        zoom: 12,
        pitch: 0,
        bearing: 0,
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
      });
    
      const {
        driver_last_location,
        passenger_last_location,
        origin_lat,
        origin_lng,
        destination_lat,
        destination_lng,
        status
      } = ride;
    
      const isValidCoord = (loc) => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng);
      
      const origin = { lat: origin_lat, lng: origin_lng };
      const destination = { lat: destination_lat, lng: destination_lng };
    
      const targetLocation = useMemo(() => {
        if (status === 'in_progress' || status === 'completed') {
          return destination;
        }
        return origin;
      }, [status, origin, destination]);
    
      const recenterMap = () => {
        if (!driver_last_location || !mapRef.current) return;
        const map = mapRef.current.getMap();
        map.flyTo({
          center: [driver_last_location.lng, driver_last_location.lat],
          zoom: 15,
          duration: 1500,
        });
        setIsUserInteracting(false);
      };
    
      useEffect(() => {
        const fetchRoute = async () => {
          if (!isValidCoord(driver_last_location) || !isValidCoord(targetLocation)) {
            setRouteGeometry(null);
            return;
          }
          
          const start = [driver_last_location.lng, driver_last_location.lat];
          const end = [targetLocation.lng, targetLocation.lat];
          
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
            setRouteGeometry(null);
          }
        };
        
        fetchRoute();
      }, [driver_last_location, targetLocation]);
    
      useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map || isUserInteracting) return;
    
        let points = [
          driver_last_location,
          passenger_last_location,
          origin,
          destination
        ].filter(p => isValidCoord(p));
    
        if (points.length > 1) {
          const bounds = getBounds(points);
          if (bounds) {
            try {
                map.fitBounds(bounds, {
                  padding: { top: 50, bottom: 350, left: 50, right: 50 },
                  duration: 1000,
                  maxZoom: 16
                });
            } catch(e) {
              console.error("Error fitting bounds:", e, bounds);
            }
          }
        } else if (points.length === 1 && isValidCoord(points[0])) {
          map.flyTo({
              center: [points[0].lng, points[0].lat],
              zoom: 15,
              duration: 1000
          });
        }
    
      }, [driver_last_location, passenger_last_location, origin, destination, status, isUserInteracting]);
    
      const routeGeoJson = useMemo(() => {
        if (!routeGeometry) return null;
        return {
          type: 'Feature',
          properties: {},
          geometry: routeGeometry
        };
      }, [routeGeometry]);
    
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
            {isValidCoord(driver_last_location) && <DriverMarker location={driver_last_location} />}
            {status !== 'in_progress' && isValidCoord(passenger_last_location || origin) && <PassengerMarker location={passenger_last_location || origin} />}
            
            <PointMarker location={origin} label="Origen" color="#16a34a" />
            <PointMarker location={destination} label="Destino" color="#dc2626" />
    
            {routeGeoJson && (
              <Source id="route" type="geojson" data={routeGeoJson}>
                <Layer {...routeLayerStyle} />
              </Source>
            )}
          </Map>
          <RecenterButton show={isUserInteracting} onClick={recenterMap} className="top-20" />
        </div>
      );
    };
    
    export default PassengerMapView;