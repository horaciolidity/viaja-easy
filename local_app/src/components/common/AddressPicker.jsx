import React, { useState, useRef, useEffect, useCallback } from 'react';
import Map, { Marker } from 'react-map-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, X, MapPin, Search, LocateFixed } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from '@/components/ui/use-toast';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const AddressPicker = ({
  label,
  value,
  onLocationSelect,
  placeholder,
  disabled = false,
  className = '',
  initialViewState: initialViewStateProp
}) => {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const { searchPlaces, getPlaceDetails, geocodeCoordinates, currentLocation } = useLocation();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);

  const [viewState, setViewState] = useState({
    longitude: currentLocation?.lng || -58.45,
    latitude: currentLocation?.lat || -34.6,
    zoom: 12,
    ...initialViewStateProp
  });

  useEffect(() => {
    setInputValue(value?.address || '');
    if (value?.lat && value?.lng) {
      setViewState(prev => ({ ...prev, latitude: value.lat, longitude: value.lng, zoom: 15 }));
    }
  }, [value]);

  const handleInputChange = useCallback(async (e) => {
    const query = e.target.value;
    setInputValue(query);
    if (query.length > 2) {
      setIsLoading(true);
      const results = await searchPlaces(query);
      setSuggestions(results || []);
      setIsLoading(false);
    } else {
      setSuggestions([]);
    }
  }, [searchPlaces]);

  const handleSelectSuggestion = useCallback(async (place) => {
    setIsFocused(false);
    setSuggestions([]);
    setIsLoading(true);
    const details = await getPlaceDetails(place.id);
    setIsLoading(false);
    if (details) {
      onLocationSelect(details);
    } else {
      toast({ title: "Error", description: "No se pudieron obtener los detalles del lugar.", variant: "destructive" });
    }
  }, [getPlaceDetails, onLocationSelect]);

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    onLocationSelect(null);
    setSuggestions([]);
  };

  const handleMapMoveEnd = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const center = map.getCenter();
    
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    setIsGeocoding(true);
    
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const addressInfo = await geocodeCoordinates({ lat: center.lat, lng: center.lng });
        if (addressInfo) {
          onLocationSelect(addressInfo);
        }
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudo obtener la dirección.', variant: 'destructive' });
      } finally {
        setIsGeocoding(false);
      }
    }, 700);
  }, [geocodeCoordinates, onLocationSelect]);

  const recenterMap = useCallback(() => {
    if (currentLocation && mapRef.current) {
        mapRef.current.flyTo({ center: [currentLocation.lng, currentLocation.lat], zoom: 14, duration: 1500 });
    }
  }, [currentLocation]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-4 ${className}`} ref={containerRef}>
      <div>
        <label htmlFor={`address-picker-${label}`} className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id={`address-picker-${label}`}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="pl-10 pr-8 h-12 rounded-lg"
            disabled={disabled}
            autoComplete="off"
            aria-labelledby={`address-label-${label}`}
            aria-describedby={`address-desc-${label}`}
          />
          <span id={`address-label-${label}`} className="sr-only">{label}</span>
          <span id={`address-desc-${label}`} className="sr-only">Escriba una dirección para ver sugerencias</span>
          {isLoading ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-500" />
          ) : inputValue && (
            <Button variant="ghost" size="icon" onClick={handleClear} className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <AnimatePresence>
          {isFocused && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute w-full mt-1 bg-white rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {suggestions.map((s) => (
                <div key={s.id} onClick={() => handleSelectSuggestion(s)} className="p-3 hover:bg-gray-100 cursor-pointer text-sm">
                  <p className="font-semibold">{s.structured_formatting.main_text}</p>
                  <p className="text-gray-600">{s.structured_formatting.secondary_text}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-64 w-full rounded-lg overflow-hidden relative">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          onMoveEnd={handleMapMoveEnd}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
           <Button variant="secondary" size="icon" onClick={recenterMap} className="absolute top-2 right-2 z-10 h-10 w-10 rounded-full shadow-md">
                <LocateFixed className="w-5 h-5"/>
            </Button>
        </Map>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {isGeocoding ? 
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin drop-shadow-lg" /> : 
                <MapPin className="h-10 w-10 text-blue-600 drop-shadow-lg" />
            }
        </div>
      </div>
    </div>
  );
};

export default AddressPicker;