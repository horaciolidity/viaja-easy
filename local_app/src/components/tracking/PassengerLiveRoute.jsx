import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import Map, { Marker, Source, Layer } from 'react-map-gl';
    import { motion } from 'framer-motion';
    import { getBounds, formatDuration } from '@/utils/geolocation';
    import 'mapbox-gl/dist/mapbox-gl.css';

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    const routeLayerStyle = {
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-width': 4, 'line-opacity': 0.9 },
    };

    const routeShadowLayerStyle = {
        id: 'route-shadow',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#000000', 'line-width': 6, 'line-opacity': 0.2, 'line-blur': 5 },
    };

    const CarMarker = ({ point, eta }) => {
      const elRef = useRef(null);

      useEffect(() => {
        if (elRef.current) {
          elRef.current.style.transition = 'transform 500ms linear';
          elRef.current.style.transform = `rotate(${point.bearing || 0}deg)`;
        }
      }, [point.bearing]);

      return (
        <Marker longitude={point.lng} latitude={point.lat} anchor="center" style={{ zIndex: 10 }}>
          <div className="relative flex flex-col items-center">
            <div ref={elRef} className="w-8 h-8 drop-shadow-lg">
              <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 2.5C12.5 2.5 2.5 12.5 2.5 25C2.5 37.5 12.5 47.5 25 47.5C37.5 47.5 47.5 37.5 47.5 25C47.5 12.5 37.5 2.5 25 2.5Z" fill="#111827"/>
                <path d="M25 4.5C13.6 4.5 4.5 13.6 4.5 25C4.5 36.4 13.6 45.5 25 45.5C36.4 45.5 45.5 36.4 45.5 25C45.5 13.6 36.4 4.5 25 4.5Z" fill="white" stroke="#1F2937" strokeWidth="1.5"/>
                <path d="M35.5 20L14.5 20L19.5 15" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.5 30L35.5 30L30.5 35" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
             {eta.duration && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-10 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
                >
                    {formatDuration(eta.duration)}
                </motion.div>
            )}
          </div>
        </Marker>
      );
    };

    const PassengerLiveRoute = ({ rideId }) => {
        const [ride, setRide] = useState(null);
        const [driver, setDriver] = useState(null);
        const [route, setRoute] = useState({ polyline: null, duration: null, distance: null });
        const [viewState, setViewState] = useState({ longitude: -58.3816, latitude: -34.6037, zoom: 12 });
        const mapRef = useRef(null);
        const routeRequestTimer = useRef(null);

        const fetchRideAndDriver = useCallback(async () => {
            const { data, error } = await supabase.rpc('get_ride_details', { p_ride_id: rideId });
            if (error || !data.success) {
                console.error("Error fetching ride details:", error?.message || data.message);
                return;
            }
            setRide({ ...data.ride, origin: data.ride.origin, destination: data.ride.destination });
            setDriver(data.driver);
        }, [rideId]);

        const fetchRoute = useCallback(async (start, end) => {
            if (!start || !end || !start.lat || !end.lat) return;
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.routes && data.routes.length > 0) {
                    const r = data.routes[0];
                    setRoute({
                        polyline: r.geometry,
                        duration: r.duration,
                        distance: r.distance,
                    });
                }
            } catch (err) {
                console.error("Error fetching route from Mapbox:", err);
            }
        }, []);
        
        useEffect(() => {
            fetchRideAndDriver();
        }, [fetchRideAndDriver]);

        useEffect(() => {
            if (!ride?.driver_id) return;
        
            const channel = supabase.channel(`profiles-location-changes-for-ride-${rideId}`)
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${ride.driver_id}` },
                    (payload) => {
                       if (payload.new.last_location) {
                           setDriver(prev => ({ ...prev, last_location: payload.new.last_location }));
                       }
                    }
                ).subscribe();
        
            return () => {
                supabase.removeChannel(channel);
            };
        }, [ride?.driver_id, rideId]);


        const points = useMemo(() => {
            const p = {};
            if (driver?.last_location) p.driver = driver.last_location;
            if (ride?.origin) p.origin = ride.origin;
            return p;
        }, [driver, ride]);

        const debouncedFetchRoute = useCallback(() => {
            if (routeRequestTimer.current) clearTimeout(routeRequestTimer.current);
            routeRequestTimer.current = setTimeout(() => {
                if (points.driver && points.origin) {
                    fetchRoute(points.driver, points.origin);
                }
            }, 500);
        }, [points, fetchRoute]);


        useEffect(() => {
            debouncedFetchRoute();
            const intervalId = setInterval(debouncedFetchRoute, 25000);
            return () => {
                clearInterval(intervalId);
                if (routeRequestTimer.current) clearTimeout(routeRequestTimer.current);
            }
        }, [debouncedFetchRoute]);


        useEffect(() => {
            const map = mapRef.current?.getMap();
            if (!map || !points.driver || !points.origin) return;

            const bounds = getBounds([points.driver, points.origin]);
            if (bounds) {
                map.fitBounds(bounds, { padding: 80, duration: 1000, maxZoom: 16 });
            }
        }, [points.driver, points.origin]);

        const routeGeoJson = useMemo(() => {
            if (!route.polyline) return null;
            return { type: 'Feature', properties: {}, geometry: route.polyline };
        }, [route.polyline]);

        return (
            <div className="h-64 w-full rounded-lg overflow-hidden my-4 relative shadow-lg border border-slate-200 dark:border-slate-700">
                <Map
                    ref={mapRef}
                    initialViewState={viewState}
                    onMove={evt => setViewState(evt.viewState)}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    mapStyle="mapbox://styles/mapbox/dark-v11"
                    style={{ width: '100%', height: '100%' }}
                >
                    {routeGeoJson && (
                        <Source id="route" type="geojson" data={routeGeoJson}>
                            <Layer {...routeShadowLayerStyle} />
                            <Layer {...routeLayerStyle} />
                        </Source>
                    )}
                    {points.driver && <CarMarker point={points.driver} eta={route} />}
                </Map>
            </div>
        );
    };

    export default PassengerLiveRoute;