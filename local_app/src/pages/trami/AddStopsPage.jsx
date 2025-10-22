import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation as useReactRouterLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, PlusCircle, Trash2, Route as RouteIcon, Search, Loader2, X } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from '@/components/ui/use-toast';
import { useRideContext } from '@/contexts/RideContext';

const PlaceInputForStops = ({ value, onSelectPlace, placeholder, inputId, label, icon: Icon }) => {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [predictions, setPredictions] = useState([]);
  const { searchPlaces, getPlaceDetails } = useLocation();
  const [isFocused, setIsFocused] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  useEffect(() => {
    if (value?.address && value.address !== inputValue) {
      setInputValue(value.address);
    } else if (!value && inputValue !== '') {
    }
  }, [value]);

  const handleInputChange = async (e) => {
    const query = e.target.value;
    setInputValue(query);

    if (query.length > 2) {
      setIsLoadingPredictions(true);
      const preds = await searchPlaces(query);
      setPredictions(preds || []);
      setIsLoadingPredictions(false);
    } else {
      setPredictions([]);
    }
  };

  const handlePredictionSelect = async (prediction) => {
    setIsLoadingPredictions(true);
    const placeDetails = await getPlaceDetails(prediction.id);
    setIsLoadingPredictions(false);
    if (placeDetails) {
      setInputValue(placeDetails.address || prediction.description);
      onSelectPlace({
        id: placeDetails.id,
        address: placeDetails.address || prediction.description,
        name: placeDetails.name || prediction.description.split(',')[0],
        lat: placeDetails.lat,
        lng: placeDetails.lng,
      });
      setPredictions([]);
      setIsFocused(false);
    } else {
      toast({ title: "Error", description: "No se pudieron obtener los detalles del lugar.", variant: "destructive" });
    }
  };

  const handleClearInput = () => {
    setInputValue('');
    onSelectPlace(null);
    setPredictions([]);
  };

  return (
    <div className="relative">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />}
        <Input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="pl-10 h-11 rounded-lg border-gray-300 focus:border-primary focus:ring-primary w-full"
        />
        {inputValue && <Button variant="ghost" size="icon" onClick={handleClearInput} className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-gray-200 p-1 h-7 w-7"><X className="w-3.5 h-3.5 text-gray-500" /></Button>}
      </div>
      {(isFocused || isLoadingPredictions) && (inputValue.length > 2 || predictions.length > 0) && (
        <motion.div className="bg-white rounded-lg shadow-lg mt-1 p-1 max-h-40 overflow-y-auto z-20 absolute w-full border border-gray-200" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          {isLoadingPredictions && <div className="p-2.5 text-sm text-gray-500 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Buscando...</div>}
          {!isLoadingPredictions && predictions.length === 0 && inputValue.length > 2 && <div className="p-2.5 text-sm text-gray-500">No se encontraron resultados.</div>}
          {!isLoadingPredictions && predictions.map(pred => ( <div key={pred.id} onMouseDown={() => handlePredictionSelect(pred)} className="p-2.5 hover:bg-gray-100 rounded-md cursor-pointer text-sm"> <p className="font-medium text-gray-800">{pred.description}</p> </div> ))}
        </motion.div>
      )}
    </div>
  );
};


const AddStopsPage = () => {
  const navigate = useNavigate();
  const { state: routeState } = useReactRouterLocation();
  const { isGoogleMapsLoaded } = useLocation();
  const { updateRouteWithStops } = useRideContext();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [stops, setStops] = useState([{ internalId: Date.now(), place: null }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (routeState?.origin) setOrigin(routeState.origin);
    if (routeState?.destination) setDestination(routeState.destination);
    if (routeState?.stops?.length > 0) {
      setStops(routeState.stops.map(s => ({ internalId: `stop-${Date.now()}-${Math.random()}`, place: s })));
    }
  }, [routeState]);

  const handleAddStop = () => {
    setStops([...stops, { internalId: Date.now(), place: null }]);
  };

  const handleRemoveStop = (internalId) => {
    setStops(stops.filter(stop => stop.internalId !== internalId));
  };

  const handleStopChange = (internalId, selectedPlace) => {
    setStops(stops.map(stop => stop.internalId === internalId ? { ...stop, place: selectedPlace } : stop));
  };

  const handleSubmit = async () => {
    const allLocations = [origin, ...stops.map(s => s.place), destination].filter(Boolean);
    if (allLocations.length < 2 || !origin || !destination || stops.some(s => !s.place)) {
        toast({title: "Información Incompleta", description: "Por favor, completa el origen, destino y todas las paradas.", variant: "destructive"});
        return;
    }
    
    setIsSubmitting(true);
    try {
      const finalStops = stops.map(s => s.place).filter(Boolean);
      
      const rideDataForBooking = {
        origin,
        destination,
        stops: finalStops,
      };

      toast({title: "Ruta Actualizada", description: "Redirigiendo a la pantalla de confirmación.", variant:"success"});
      navigate('/booking', { state: { rideData: rideDataForBooking } });

    } catch (error) {
      toast({title: "Error al actualizar ruta", description: error.message, variant: "destructive"});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="passenger-dashboard-header sticky top-0 z-10">
        <div className="status-bar-overlay"> <span>9:41 AM</span> <span className="font-semibold">Agregar Paradas</span> <RouteIcon className="w-4 h-4" /> </div>
        <div className="pt-2 pb-4 px-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 text-white hover:bg-white/20 rounded-full"> <ArrowLeft className="w-6 h-6" /> </Button>
          <h1 className="text-xl font-bold text-white">Planifica tu Ruta con Paradas</h1>
        </div>
      </header>

      <main className="flex-grow p-6 space-y-6 overflow-y-auto pb-24">
        {!isGoogleMapsLoaded && <div className="p-4 text-center text-yellow-700 bg-yellow-100 rounded-md mb-4">Cargando servicios de mapas...</div>}
        <motion.div className="bg-white p-6 rounded-xl shadow-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PlaceInputForStops label="Punto de Partida" inputId="origin-stop" value={origin} onSelectPlace={setOrigin} placeholder="Ingresa la dirección de origen" icon={MapPin} />
        </motion.div>

        {stops.map((stop, index) => (
          <motion.div key={stop.internalId} className="bg-white p-6 rounded-xl shadow-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (index + 1) }}>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Parada {index + 1}</label>
              {stops.length > 0 && ( <Button variant="ghost" size="icon" onClick={() => handleRemoveStop(stop.internalId)} className="text-red-500 hover:bg-red-100 rounded-full p-1 h-7 w-7"> <Trash2 className="w-4 h-4" /> </Button> )}
            </div>
            <PlaceInputForStops inputId={`stop-${stop.internalId}`} value={stop.place} onSelectPlace={(place) => handleStopChange(stop.internalId, place)} placeholder={`Ingresa la dirección de la parada ${index + 1}`} icon={MapPin} />
          </motion.div>
        ))}
        
        <Button variant="outline" onClick={handleAddStop} className="w-full h-11 text-primary border-primary hover:bg-primary/5 rounded-lg flex items-center justify-center"> <PlusCircle className="w-5 h-5 mr-2" /> Agregar otra parada </Button>

        <motion.div className="bg-white p-6 rounded-xl shadow-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (stops.length + 1) }}>
           <PlaceInputForStops label="Destino Final" inputId="destination-stop" value={destination} onSelectPlace={setDestination} placeholder="Ingresa la dirección de destino final" icon={MapPin} />
        </motion.div>
        
        <Button className="w-full h-12 text-base text-white rounded-lg shadow-md" style={{backgroundColor: "hsl(var(--accent))"}} onClick={handleSubmit} disabled={!isGoogleMapsLoaded || isSubmitting}>
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/>Recalculando...</> : (isGoogleMapsLoaded ? 'Confirmar y Recalcular Ruta' : <><Loader2 className="w-4 h-4 animate-spin mr-2"/>Cargando Mapas...</>)}
        </Button>
      </main>
      <BottomNavBar userType="passenger" />
    </div>
  );
};

export default AddStopsPage;