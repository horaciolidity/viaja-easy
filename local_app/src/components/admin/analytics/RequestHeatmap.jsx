import React, { useState, useMemo } from 'react';
import ReactMapGL, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { MapPin } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const heatmapLayer = {
  id: 'heatmap-layer',
  maxzoom: 15,
  type: 'heatmap',
  paint: {
    'heatmap-weight': 1,
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 3],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(33, 102, 172, 0)',
      0.2, 'rgb(103, 169, 207)',
      0.4, 'rgb(209, 229, 240)',
      0.6, 'rgb(253, 219, 199)',
      0.8, 'rgb(239, 138, 98)',
      1, 'rgb(178, 24, 43)'
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20, 15, 50],
    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 12, 1, 15, 0]
  }
};

const circleLayer = {
  id: 'points-layer',
  type: 'circle',
  minzoom: 12,
  paint: {
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      12, 1.5,
      18, 8
    ],
    'circle-color': 'rgb(178, 24, 43)',
    'circle-stroke-color': 'white',
    'circle-stroke-width': 0.5,
    'circle-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      12, 0,
      13, 1
    ]
  }
};

const RequestHeatmap = ({ data, loading }) => {
  const [viewport, setViewport] = useState({
    latitude: -34.6037,
    longitude: -58.3816,
    zoom: 11,
    pitch: 0,
    bearing: 0
  });

  const geoJsonData = useMemo(() => {
    if (!data || data.length === 0) return null;
    return {
      type: 'FeatureCollection',
      features: data.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat]
        },
        properties: {}
      }))
    };
  }, [data]);

  if (loading) {
    return (
      <Card className="shadow-lg col-span-1 lg:col-span-2 h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center"><MapPin className="mr-2 h-5 w-5" /> Mapa de Calor de Solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[400px]" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center"><MapPin className="mr-2 h-5 w-5" /> Mapa de Calor de Solicitudes</CardTitle>
      </CardHeader>
      <CardContent className="h-[420px] p-0 rounded-b-lg overflow-hidden">
        <ReactMapGL
          {...viewport}
          width="100%"
          height="100%"
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={evt => setViewport(evt.viewState)}
        >
          {geoJsonData && (
            <Source type="geojson" data={geoJsonData}>
              <Layer {...heatmapLayer} />
              <Layer {...circleLayer} />
            </Source>
          )}
        </ReactMapGL>
      </CardContent>
    </Card>
  );
};

export default RequestHeatmap;