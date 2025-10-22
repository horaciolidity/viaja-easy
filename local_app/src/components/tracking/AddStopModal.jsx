import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Trash2, Loader2, X } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const AddStopModal = ({ isOpen, onOpenChange, ride }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [selection, setSelection] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { searchPlaces, getPlaceDetails } = useLocation();

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setPredictions([]);
      setSelection([]);
      setIsLoading(false);
      setIsConfirming(false);
    }
  }, [isOpen]);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (term.length > 2) {
      setIsLoading(true);
      const results = await searchPlaces(term);
      setPredictions(results || []);
      setIsLoading(false);
    } else {
      setPredictions([]);
    }
  };

  const handleSelectPlace = async (placeId) => {
    setIsLoading(true);
    const details = await getPlaceDetails(placeId);
    if (details && details.address && typeof details.lat === 'number' && typeof details.lng === 'number') {
      if (!selection.some(p => p.address === details.address)) {
        setSelection([...selection, { address: details.address, lat: details.lat, lng: details.lng }]);
      }
      setSearchTerm('');
      setPredictions([]);
    } else {
      toast({ title: "Error", description: "No se pudieron obtener los detalles del lugar.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleRemovePlace = (placeAddress) => {
    setSelection(selection.filter(p => p.address !== placeAddress));
  };

  const handleConfirmStops = async () => {
    if (!ride || !ride.id) {
      toast({ title: 'Error', description: 'No se pudo identificar el viaje actual.', variant: 'destructive' });
      return;
    }
    if (selection.length === 0) {
      toast({ title: 'Sin paradas', description: 'Debes seleccionar al menos una nueva parada.', variant: 'destructive' });
      return;
    }
  
    setIsConfirming(true);
    try {
      const stopsSafe = Array.isArray(ride?.stops) ? ride.stops : [];
      const newStops = [...stopsSafe, ...selection];
      
      const tableName = ride.ride_type === 'hourly' ? 'hourly_bookings' 
                      : ride.ride_type === 'scheduled' ? 'scheduled_rides' 
                      : 'rides';

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ stops: newStops })
        .eq('id', ride.id);

      if (updateError) throw updateError;
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('recalc_route_and_fare', { p_ride_id: ride.id });

      if (rpcError || !rpcData.success) {
        throw new Error(rpcError?.message || rpcData?.message || 'Error al recalcular la ruta.');
      }

      toast({ title: 'Paradas actualizadas', description: 'Las nuevas paradas se agregaron al viaje.' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error al agregar paradas', description: error.message, variant: 'destructive' });
    } finally {
      setIsConfirming(false);
    }
  };

  const selSafe = Array.isArray(selection) ? selection : [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">Añadir Nueva Parada</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar dirección de la parada"
              className="pl-10 h-11"
            />
            {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />}
          </div>
          {predictions.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border rounded-md max-h-40 overflow-y-auto">
              {predictions.map((p) => (
                <div key={p.id} onClick={() => handleSelectPlace(p.id)} className="p-2.5 hover:bg-gray-100 cursor-pointer text-sm">
                  {p.description}
                </div>
              ))}
            </motion.div>
          )}

          <div className="space-y-2 mt-4">
            <h3 className="text-sm font-medium text-gray-500">Paradas a agregar:</h3>
            {selSafe.length === 0 && <p className="text-sm text-gray-400">Busca y selecciona una dirección para agregarla como parada.</p>}
            {selSafe.map((place, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-md">
                <p className="text-sm text-gray-700 truncate pr-2">{place.address}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-100" onClick={() => handleRemovePlace(place.address)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleConfirmStops} 
            disabled={isConfirming || selSafe.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConfirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Confirmar Paradas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddStopModal;