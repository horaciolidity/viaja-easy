import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, X, MapPin, Search, Home, Clock, Trash2 } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from '@/components/ui/use-toast';
import LocationPickerModal from '@/components/common/LocationPickerModal';

const LocationInput = ({
  value,
  onLocationSelect,
  placeholder,
  isOrigin = false,
  disabled = false,
  label,
  onFocusChange = () => {},
}) => {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [predictions, setPredictions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { searchPlaces, getPlaceDetails } = useLocation();
  const { user } = useAuth();
  const containerRef = useRef(null);

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [recentSearches, setRecentSearches] = useLocalStorage(`recentSearches_${user?.id || 'guest'}`, []);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const fetchSavedPlaces = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('saved_places').select('*').eq('user_id', user.id);
    if (error) {
      console.error('Error fetching saved places:', error);
    } else {
      setSavedPlaces(data || []);
    }
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      fetchSavedPlaces();
    }
    onFocusChange(isFocused);
  }, [isFocused, fetchSavedPlaces, onFocusChange]);

  useEffect(() => {
    setInputValue(value?.address || '');
  }, [value]);

  const handleInputChange = useCallback(
    async (e) => {
      const query = e.target.value;
      setInputValue(query);

      if (query.length > 2) {
        setIsLoading(true);
        const preds = await searchPlaces(query);
        setPredictions(preds || []);
        setIsLoading(false);
      } else {
        setPredictions([]);
      }
    },
    [searchPlaces]
  );

  const handleSelect = async (place) => {
    setIsFocused(false);

    let locationData;

    if (place.isSaved || place.isRecent) {
      locationData = {
        id: place.id || `saved-${place.name}`,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
      };
    } else {
      setIsLoading(true);
      const details = await getPlaceDetails(place.id);
      setIsLoading(false);
      if (details) {
        locationData = {
          ...details,
          name: place.structured_formatting?.main_text || place.description,
          address: place.description,
          id: place.id
        };
      } else {
        toast({ title: "Error", description: "No se pudieron obtener los detalles del lugar.", variant: "destructive" });
        return;
      }
    }

    if (locationData) {
      onLocationSelect(locationData);
      setInputValue(locationData.address);
      
      const newRecent = [locationData, ...recentSearches.filter(r => r.id !== locationData.id)].slice(0, 5);
      setRecentSearches(newRecent);
    }

    setPredictions([]);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    onLocationSelect(null);
    setPredictions([]);
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    toast({ title: 'Historial borrado', description: 'Tus búsquedas recientes han sido eliminadas.' });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderSuggestions = () => (
    <div>
      <div onClick={() => setIsPickerOpen(true)} className="p-3 hover:bg-gray-100 cursor-pointer flex items-center">
        <MapPin className="w-5 h-5 mr-3 text-blue-500" />
        <p className="font-medium text-sm">Seleccionar en el mapa</p>
      </div>

      {savedPlaces.map((place) => (
        <div key={place.id} onClick={() => handleSelect({ ...place, isSaved: true })} className="p-3 hover:bg-gray-100 cursor-pointer flex items-center">
          <Home className="w-5 h-5 mr-3 text-yellow-500" />
          <div>
            <p className="font-medium text-sm">{place.name}</p>
            <p className="text-xs text-gray-500">{place.address}</p>
          </div>
        </div>
      ))}
      
      {predictions.length > 0 && (
         <div className="p-2 border-t mt-2">
             <h3 className="text-xs font-semibold text-gray-500 uppercase px-2">Sugerencias</h3>
             {predictions.map((p) => (
                <div key={p.id} onClick={() => handleSelect(p)} className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
                  <p className="font-medium text-sm">{p.structured_formatting.main_text}</p>
                  <p className="text-xs text-gray-500">{p.structured_formatting.secondary_text}</p>
                </div>
             ))}
         </div>
      )}

      {recentSearches.length > 0 && (
        <div className="p-2 border-t mt-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-gray-500 uppercase px-2">Recientes</h3>
            <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs text-red-500 hover:bg-red-50">
              <Trash2 className="w-3 h-3 mr-1" /> Borrar
            </Button>
          </div>
          {recentSearches.map((place) => (
            <div key={place.id} onClick={() => handleSelect({ ...place, isRecent: true })} className="p-3 hover:bg-gray-100 cursor-pointer flex items-center rounded-md">
              <Clock className="w-5 h-5 mr-3 text-gray-400" />
              <div>
                <p className="font-medium text-sm">{place.name}</p>
                <p className="text-xs text-gray-500">{place.address}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handlePickerConfirm = (location) => {
    onLocationSelect(location);
    setInputValue(location.address);
    setIsPickerOpen(false);
    setIsFocused(false);
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>}
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {isOrigin ? <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-md"></div> : <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-md"></div>}
          </div>
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => { if (!disabled) { setIsFocused(true); } }}
            placeholder={placeholder}
            className="w-full h-12 pl-8 pr-10 bg-white shadow-md rounded-lg border-transparent focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
            disabled={disabled}
          />
          {inputValue && !disabled && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
            </button>
          )}
        </div>
        {isOrigin && (
          <Button variant="outline" size="icon" onClick={() => setIsPickerOpen(true)} className="h-12 w-12 flex-shrink-0 bg-white shadow-md">
            <MapPin className="w-5 h-5 text-blue-500" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto custom-scrollbar"
          >
            {renderSuggestions()}
          </motion.div>
        )}
      </AnimatePresence>

      <LocationPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={handlePickerConfirm}
        initialLocation={value}
      />
    </div>
  );
};

export default LocationInput;