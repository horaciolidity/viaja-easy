import React, { useState, useRef, useEffect, useCallback } from 'react';
    import Map from 'react-map-gl';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Loader2, MapPin } from 'lucide-react';
    import { useLocation } from '@/contexts/LocationContext';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import { toast } from '@/components/ui/use-toast';
    import { Skeleton } from '@/components/ui/skeleton';
    
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    
    const LocationPickerModal = ({ isOpen, onClose, onConfirm, initialLocation }) => {
      const { currentLocation, geocodeCoordinates } = useLocation();
      const mapRef = useRef(null);
      const [viewState, setViewState] = useState({
        longitude: -58.45,
        latitude: -34.6,
        zoom: 12
      });
      const [currentSelection, setCurrentSelection] = useState(null);
      const [isGeocoding, setIsGeocoding] = useState(false);
      const geocodeTimeoutRef = useRef(null);
    
      useEffect(() => {
        if (isOpen) {
          const locationToUse = initialLocation || currentLocation;
          if (locationToUse && typeof locationToUse.lat === 'number' && typeof locationToUse.lng === 'number' && !isNaN(locationToUse.lat) && !isNaN(locationToUse.lng)) {
            const newViewState = {
              longitude: locationToUse.lng,
              latitude: locationToUse.lat,
              zoom: 15
            };
            setViewState(newViewState);
            setCurrentSelection({
              lat: locationToUse.lat,
              lng: locationToUse.lng,
              address: locationToUse.address || ''
            });
          } else {
             setViewState({ longitude: -58.45, latitude: -34.6, zoom: 12 });
             setCurrentSelection(null);
          }
        }
      }, [isOpen, initialLocation, currentLocation]);
    
      const handleMapMoveEnd = useCallback(() => {
        if (!mapRef.current) return;
        const map = mapRef.current.getMap();
        const center = map.getCenter();
        
        if (geocodeTimeoutRef.current) {
          clearTimeout(geocodeTimeoutRef.current);
        }
    
        setIsGeocoding(true);
        setCurrentSelection(prev => ({ ...prev, lat: center.lat, lng: center.lng, address: '' }));
    
        geocodeTimeoutRef.current = setTimeout(async () => {
          try {
            const addressInfo = await geocodeCoordinates({ lat: center.lat, lng: center.lng });
            if (addressInfo) {
              setCurrentSelection({
                lat: center.lat,
                lng: center.lng,
                address: addressInfo.address,
                name: addressInfo.name,
                id: addressInfo.id
              });
            } else {
              setCurrentSelection(prev => ({ ...prev, address: 'No se pudo encontrar la dirección.' }));
            }
          } catch (error) {
            toast({ title: 'Error', description: 'No se pudo obtener la dirección.', variant: 'destructive' });
            setCurrentSelection(prev => ({ ...prev, address: 'Error al buscar dirección.' }));
          } finally {
            setIsGeocoding(false);
          }
        }, 500);
      }, [geocodeCoordinates]);
    
      const handleConfirm = () => {
        if (currentSelection && currentSelection.address) {
          onConfirm({
            lat: currentSelection.lat,
            lng: currentSelection.lng,
            address: currentSelection.address,
            name: currentSelection.name || currentSelection.address.split(',')[0],
            id: currentSelection.id || `manual-${Date.now()}`
          });
        }
      };
    
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] p-0 flex flex-col h-[80vh]">
            <DialogHeader className="p-4 pb-2 flex-shrink-0">
              <DialogTitle>Selecciona el punto de partida</DialogTitle>
            </DialogHeader>
            <div className="flex-grow w-full relative">
              <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                onMoveEnd={handleMapMoveEnd}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
              >
              </Map>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                 <MapPin className="h-12 w-12 text-red-500 drop-shadow-lg" style={{transform: 'translateY(-50%)'}} />
              </div>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md text-xs text-center font-semibold">
                Mueve el mapa para elegir el punto de partida.
              </div>
            </div>
            <div className="p-4 flex-shrink-0 border-t">
                <div className="bg-slate-100 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 font-medium">Dirección seleccionada:</p>
                    {isGeocoding ? (
                        <Skeleton className="h-5 w-3/4 mt-1" />
                    ) : (
                        <p className="font-semibold text-slate-800 mt-1">{currentSelection?.address || 'Moviendo el mapa...'}</p>
                    )}
                </div>
            </div>
            <DialogFooter className="p-4 pt-0 flex-shrink-0">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={!currentSelection || !currentSelection.address || isGeocoding}>
                {isGeocoding ? <Loader2 className="animate-spin mr-2" /> : null}
                Usar este lugar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };
    
    export default LocationPickerModal;