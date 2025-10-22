import React, { useRef, useEffect, useState, useMemo } from 'react';
    import Map, { Marker, Source, Layer } from 'react-map-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import { getBounds } from '@/utils/geolocation';
    import { motion } from 'framer-motion';

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapStyle = "mapbox://styles/mapbox/streets-v12";

    const routeLayerStyle = {
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.85 },
    };
    
    const DriverMarker = ({ point }) => {
      const elRef = useRef(null);

      useEffect(() => {
        if (elRef.current) {
          elRef.current.style.transition = 'transform 1s linear';
          elRef.current.style.transform = `rotate(${point.bearing || 0}deg)`;
        }
      }, [point.bearing]);

      return (
        <Marker longitude={point.lng} latitude={point.lat} anchor="center">
          <div ref={elRef} className="w-10 h-10">
            <img src="/car-icon-map.svg" alt="Conductor" className="w-full h-full drop-shadow-lg" />
          </div>
        </Marker>
      );
    };

    const PointMarker = ({ point, label, color }) => {
      return (
        <Marker longitude={point.lng} latitude={point.lat} anchor="bottom">
          <div className="flex flex-col items-center transform -translate-y-1/2">
            <span className={`text-xs font-bold text-white px-2 py-1 rounded-full shadow-lg ${color}`}>{label}</span>
            <div className="w-2 h-2 bg-white border-2 border-black rounded-full mt-1"></div>
          </div>
        </Marker>
      );
    };

    const PassengerTrackingMap = ({ points, routeGeometry }) => {
      const mapRef = useRef(null);
      const [viewState, setViewState] = useState({
        longitude: -58.3816, latitude: -34.6037, zoom: 12,
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
      });

      useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map || !points) return;

        const validPoints = Object.values(points).filter(p => p && p.lat && p.lng);
        if (validPoints.length === 0) return;

        if (validPoints.length > 1) {
          const bounds = getBounds(validPoints);
          if(bounds) {
             map.fitBounds(bounds, { padding: { top: 60, bottom: 260, left: 60, right: 60 }, duration: 1000, maxZoom: 16 });
          }
        } else if (validPoints.length === 1) {
          map.flyTo({ center: [validPoints[0].lng, validPoints[0].lat], zoom: 15, duration: 1000 });
        }
      }, [points]);
      
      const routeGeoJson = useMemo(() => {
        if (!routeGeometry) return null;
        return { type: 'Feature', properties: {}, geometry: routeGeometry };
      }, [routeGeometry]);

      return (
        <Map
          ref={mapRef}
          initialViewState={viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={mapStyle}
          style={{ width: '100%', height: '100%' }}
        >
          {points.driver && <DriverMarker point={points.driver} />}
          {points.origin && <PointMarker point={points.origin} label="O" color="bg-green-500" />}
          {points.destination && <PointMarker point={points.destination} label="D" color="bg-red-500" />}
          
          {routeGeoJson && (
            <Source id="route" type="geojson" data={routeGeoJson}>
              <Layer {...routeLayerStyle} />
            </Source>
          )}
        </Map>
      );
    };

    export default PassengerTrackingMap;