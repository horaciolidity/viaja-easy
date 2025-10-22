import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Loader2, X, MapPin, Search, Home, Clock, Trash2 } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const PlaceInputV2 = ({ value, onValueChange, onPlaceSelect, placeholder, isOrigin = false, onFocusChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { searchPlaces, getPlaceDetails } = useLocation();
  const { user } = useAuth();
  const containerRef = useRef(null);

  const [savedPlaces, setSavedPlaces] = useState([]);
  const [recentSearches, setRecentSearches] = useLocalStorage('recentSearches', []);

  const fetchSavedPlaces = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('saved_places').select('*').eq('user_id', user.id);
    if (error) console.error('Error fetching saved places:', error);
    else setSavedPlaces(data);
  }, [user]);

  useEffect(() => {
    if (isFocused) {
      fetchSavedPlaces();
    }
  }, [isFocused, fetchSavedPlaces]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = useCallback(async (e) => {
    const query = e.target.value;
    setInputValue(query);
    onValueChange(query);

    if (query.length > 2) {
      setIsLoading(true);
      const preds = await searchPlaces(query);
      setPredictions(preds || []);
      setIsLoading(false);
    } else {
      setPredictions([]);
    }
  }, [onValueChange, searchPlaces]);

  const handleSelect = async (place) => {
    setIsFocused(false);
    onFocusChange(false);
    
    if (place.isSaved || place.isRecent) {
        const locationData = {
            id: place.id || `saved-${place.name}`,
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
        };
        onPlaceSelect(locationData);
        setInputValue(place.address);
        onValueChange(place.address);
    } else {
        const details = await getPlaceDetails(place.id);
        if (details) {
            const locationData = { ...details, name: place.description, id: place.id, address: place.description };
            onPlaceSelect(locationData);
            setInputValue(place.description);
            onValueChange(place.description);
            
            const newRecent = [locationData, ...recentSearches.filter(r => r.id !== locationData.id)].slice(0, 5);
            setRecentSearches(newRecent);
        }
    }
    setPredictions([]);
  };

  const clearHistory = () => {
    setRecentSearches([]);
    toast({ title: "Historial borrado", description: "Tus búsquedas recientes han sido eliminadas." });
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
        onFocusChange(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef, onFocusChange]);

  const renderSuggestions = () => {
    if (isLoading) {
      return <div className="p-3 text-center text-sm text-gray-500 flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Buscando...</div>;
    }
    if (predictions.length > 0) {
      return predictions.map((p) => (
        <div key={p.id} onClick={() => handleSelect(p)} className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
          <p className="font-medium text-sm">{p.structured_formatting.main_text}</p>
          <p className="text-xs text-gray-500">{p.structured_formatting.secondary_text}</p>
        </div>
      ));
    }
    if (isFocused && inputValue.length <= 2) {
      return (
        <div>
          {savedPlaces.map(place => (
            <div key={place.id} onClick={() => handleSelect({ ...place, isSaved: true })} className="p-3 hover:bg-gray-100 cursor-pointer flex items-center">
              <Home className="w-5 h-5 mr-3 text-blue-500" />
              <div>
                <p className="font-medium text-sm">{place.name}</p>
                <p className="text-xs text-gray-500">{place.address}</p>
              </div>
            </div>
          ))}
          {recentSearches.length > 0 && (
            <>
              <div className="p-2 border-t mt-2">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase px-2">Recientes</h3>
                    <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs text-red-500 hover:bg-red-50">
                        <Trash2 className="w-3 h-3 mr-1"/> Borrar
                    </Button>
                </div>
                {recentSearches.map(place => (
                  <div key={place.id} onClick={() => handleSelect({ ...place, isRecent: true })} className="p-3 hover:bg-gray-100 cursor-pointer flex items-center rounded-md">
                    <Clock className="w-5 h-5 mr-3 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{place.name}</p>
                      <p className="text-xs text-gray-500">{place.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {isOrigin ? (
                <MapPin className="w-5 h-5 text-gray-400"/>
            ) : (
                <Search className="w-5 h-5 text-gray-400"/>
            )}
        </div>
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (!disabled) { setIsFocused(true); onFocusChange(true); } }}
          placeholder={placeholder}
          className="w-full h-12 pl-10 pr-10 bg-white shadow-md rounded-lg border-transparent focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
          disabled={disabled}
        />
        {inputValue && !disabled && (
          <button
            onClick={() => {
              setInputValue('');
              onValueChange('');
              onPlaceSelect(null);
              setPredictions([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
          >
            {renderSuggestions()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaceInputV2;