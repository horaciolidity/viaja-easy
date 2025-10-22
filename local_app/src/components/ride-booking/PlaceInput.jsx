import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

const PlaceInput = ({ label, value, onChange, onSelectPlace, placeholder, inputType }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const { searchPlaces } = useLocation();
  const [isFocused, setIsFocused] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  const handleInputChange = useCallback(async (e) => {
    const query = e.target.value;
    setInputValue(query);
    onChange(query);

    if (query.length > 2) {
      setIsLoadingPredictions(true);
      try {
        const preds = await searchPlaces(query);
        setPredictions(preds || []);
      } catch (error) {
        console.error("Error fetching place predictions:", error);
        setPredictions([]);
      } finally {
        setIsLoadingPredictions(false);
      }
    } else {
      setPredictions([]);
    }
  }, [onChange, searchPlaces]);

  const handlePredictionSelect = useCallback((prediction) => {
    setInputValue(prediction.description);
    onSelectPlace(prediction);
    setPredictions([]);
    setIsFocused(false);
  }, [onSelectPlace]);

  const handleClearInput = useCallback(() => {
    setInputValue('');
    onChange('');
    onSelectPlace(null);
    setPredictions([]);
  }, [onChange, onSelectPlace]);

  return (
    <div className="relative">
      <Label htmlFor={inputType} className="text-sm font-medium text-gray-700 mb-1 block">{label}</Label>
      <div className="relative flex items-center">
        {inputType === 'origin' ?
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /> :
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        }
        <Input
          id={inputType}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="pl-10 h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
          autoComplete="off"
        />
        {inputValue && (
          <Button variant="ghost" size="icon" onClick={handleClearInput} className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-gray-200 p-1 h-7 w-7">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </Button>
        )}
      </div>
      {(isFocused || isLoadingPredictions) && (inputValue.length > 2 || predictions.length > 0) && (
        <motion.div
          className="bg-white rounded-lg shadow-lg mt-1 p-1 max-h-60 overflow-y-auto z-20 absolute w-full border border-gray-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {isLoadingPredictions && <div className="p-2.5 text-sm text-gray-500 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Buscando...</div>}
          {!isLoadingPredictions && predictions.length === 0 && inputValue.length > 2 && <div className="p-2.5 text-sm text-gray-500">No se encontraron resultados.</div>}
          {!isLoadingPredictions && predictions.map(pred => (
            <div
              key={pred.id}
              onMouseDown={() => handlePredictionSelect(pred)}
              className="p-2.5 hover:bg-gray-100 rounded-md cursor-pointer"
            >
              <p className="text-sm font-medium text-gray-800 leading-tight">{pred.structured_formatting.main_text}</p>
              <p className="text-xs text-gray-500 leading-tight">{pred.structured_formatting.secondary_text}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default PlaceInput;