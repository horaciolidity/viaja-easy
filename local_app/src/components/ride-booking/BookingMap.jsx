import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
    import Map, { Marker, Source, Layer } from 'react-map-gl';
    import { getBounds } from '@/utils/geolocation';
    import { motion } from 'framer-motion';
    import RecenterButton from '@/components/common/RecenterButton';
    import { useLocation as useGeoLocation } from '@/contexts/LocationContext';
    
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapStyle = "mapbox://styles/mapbox/streets-v12";
    
    const routeLayerStyle = {
      id: 'route',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#8b5cf6', // a violet color
        'line-width': 6,
        'line-opacity': 0.75
      }
    };

    const CustomMarker = ({ color = '#3b82f6' }) => (
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'translateY(-20px)' }}>
        <g style={{ filter: 'drop-shadow(0px 3px 3px rgba(0,0,0,0.3))' }}>
          <path d="M20 0C11.16 0 4 7.16 4 16C4 28 20 40 20 40S36 28 36 16C36 7.16 28.84 0 20 0Z" fill={color} />
          <circle cx="20" cy="16" r="6" fill="white" />
        </g>
      </svg>
    );
    
    const BookingMap = ({ origin, destination, routeGeometry, onMapMoveEnd = () => {}, isMapInteracting, setIsMapInteracting, isRouteConfirmed }) => {
      const mapRef = useRef(null);
      const { currentLocation } = useGeoLocation();
    
      const [viewState, setViewState] = useState({
        longitude: origin?.lng || currentLocation?.lng || -58.3816,
        latitude: origin?.lat || currentLocation?.lat || -34.6037,
        zoom: 15,
        pitch: 0,
        bearing: 0,
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
      });
    
      const recenterMap = useCallback(() => {
        if (!currentLocation || !mapRef.current) return;
        const map = mapRef.current.getMap();
        map.flyTo({
          center: [currentLocation.lng, currentLocation.lat],
          zoom: 15,
          duration: 1500,
        });
        setIsMapInteracting(false);
      }, [currentLocation, setIsMapInteracting]);
    
      const isValidCoord = (loc) => loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng);
      
      useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map || isMapInteracting) return;
        
        const points = [origin, destination].filter(p => isValidCoord(p));
        
        if (points.length > 1) {
          const bounds = getBounds(points);
          if (bounds) {
            try {
                map.fitBounds(bounds, {
                  padding: { top: 180, bottom: (isRouteConfirmed ? 450 : 150), left: 50, right: 50 },
                  duration: 1000
                });
            } catch(e) {
              console.error("Error fitting bounds:", e, bounds);
            }
          }
        } else if (points.length === 1 && !destination && isValidCoord(points[0])) {
          map.flyTo({
              center: [points[0].lng, points[0].lat],
              zoom: 15,
              duration: 1000
          });
        }
      }, [origin, destination, isMapInteracting, isRouteConfirmed]);
    
      const routeGeoJson = useMemo(() => {
        if (!routeGeometry) return null;
        return {
          type: 'Feature',
          properties: {},
          geometry: routeGeometry
        };
      }, [routeGeometry]);
    
      const handleMoveEnd = () => {
        if (!mapRef.current || destination) return;
        const map = mapRef.current.getMap();
        if (typeof onMapMoveEnd === 'function') {
            onMapMoveEnd(map.getCenter());
        }
      };
    
      return (
        <div className="h-full w-full bg-gray-300 relative">
          <Map
            ref={mapRef}
            {...viewState}
            onMoveStart={() => setIsMapInteracting(true)}
            onMove={evt => setViewState(evt.viewState)}
            onMoveEnd={handleMoveEnd}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle={mapStyle}
            style={{ width: '100%', height: '100%' }}
            maxPitch={0}
            dragPan={!isRouteConfirmed}
          >
            {!destination && !isRouteConfirmed && (
                <div className="absolute top-1/2 left-1/2 pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
                    <CustomMarker color="#3b82f6" />
                </div>
            )}
            
            {(destination || isRouteConfirmed) && isValidCoord(origin) && (
                <Marker longitude={origin.lng} latitude={origin.lat} anchor="bottom">
                    <CustomMarker color="#16a34a" />
                </Marker>
            )}

            {isValidCoord(destination) && (
                <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
                    <CustomMarker color="#ef4444" />
                </Marker>
            )}
    
            {routeGeoJson && (
              <Source id="route" type="geojson" data={routeGeoJson}>
                <Layer {...routeLayerStyle} />
              </Source>
            )}
          </Map>
          <RecenterButton show={isMapInteracting} onClick={recenterMap} className="top-[180px]" />
        </div>
      );
    };
    
    export default BookingMap;