import React, { useState } from 'react';
    import { Card, CardContent, CardFooter } from '@/components/ui/card';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { MapPin, Clock, Star, Users, Loader2, ArrowRight, Car, Home } from 'lucide-react';
    import { formatCurrencyARS } from '@/utils/mercadoPago';
    import { motion } from 'framer-motion';
    import { useToast } from '@/components/ui/use-toast';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    } from "@/components/ui/dialog";
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import LocationInput from '@/components/common/LocationInput';

    const SharedRideCard = ({ ride, onReserve }) => {
      const [isConfirmOpen, setIsConfirmOpen] = useState(false);
      const [isReserving, setIsReserving] = useState(false);
      const [pickupLocation, setPickupLocation] = useState(null);
      const [dropoffLocation, setDropoffLocation] = useState(null);
      const { toast } = useToast();

      const handleConfirmReservation = async () => {
        if (!pickupLocation || !dropoffLocation) {
          toast({
            title: "Faltan datos",
            description: "Por favor, especifica tu dirección de recogida y de destino.",
            variant: "destructive",
          });
          return;
        }

        setIsReserving(true);
        try {
          const reservationData = {
            seats: 1,
            pickup: {
              address: pickupLocation.address,
              lat: pickupLocation.lat,
              lng: pickupLocation.lng,
            },
            dropoff: {
              address: dropoffLocation.address,
              lat: dropoffLocation.lat,
              lng: dropoffLocation.lng,
            },
          };
          const result = await onReserve(ride.id, reservationData);
          if (result?.insufficientBalance) {
            // Parent will handle dialog
          } else {
            setIsConfirmOpen(false);
          }
        } catch (error) {
          toast({
            title: "Error en la reserva",
            description: error.message || "No se pudo completar la reserva. Intenta de nuevo.",
            variant: "destructive",
          });
        } finally {
          setIsReserving(false);
        }
      };

      const driverName = ride.driver?.full_name || 'Conductor';
      const driverRating = ride.driver?.rating?.toFixed(1) || 'Nuevo';
      const vehicle = ride.driver?.vehicle_info;
      const seatsToReserve = 1; 
      const totalCost = ride.seat_price * seatsToReserve;

      return (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            id="ride-card"
          >
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow w-full flex flex-col h-full">
              <CardContent className="p-4 flex-grow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarImage src={ride.driver?.avatar_url} alt={driverName} />
                      <AvatarFallback>{driverName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-gray-800">{driverName}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1"/>
                        {driverRating}
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" className="font-bold text-lg">{formatCurrencyARS(ride.seat_price)}</Badge>
                </div>
                
                {vehicle && (
                  <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded-md mb-4 flex items-center gap-3">
                    <Car className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="font-semibold">{vehicle.brand} {vehicle.model}</span> ({vehicle.color})
                      <span className="block text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded-sm ml-2 inline-block">{vehicle.plate}</span>
                    </div>
                  </div>
                )}

                <div className="my-4 space-y-3">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-primary flex-shrink-0" /> 
                    <span className="font-medium">Desde:</span>
                    <span className="ml-2 truncate">{ride.origin_city}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" /> 
                    <span className="font-medium">Hasta:</span>
                    <span className="ml-2 truncate">{ride.destination_city}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-3 mt-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 
                    <span>{new Date(ride.departure_time).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> 
                    <span className="font-semibold">{ride.available_seats}</span> asientos disp.
                  </div>
                </div>
                
                {ride.notes && <p className="text-xs text-gray-500 mt-3 p-2 bg-gray-50 rounded-md border">Nota del conductor: {ride.notes}</p>}
              </CardContent>
              <CardFooter className="mt-auto">
                <Button id="reserve-button" className="w-full font-bold" onClick={() => setIsConfirmOpen(true)}>
                  Reservar 1 Asiento <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirmar Reserva</DialogTitle>
                <DialogDescription>
                  Especifica tu punto de encuentro y destino para el viaje a {ride.destination_city}.
                </DialogDescription>
              </DialogHeader>
              <div className="my-4 space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center mb-2"><Home className="w-4 h-4 mr-2 text-primary" />¿Dónde te buscamos en {ride.origin_city}?</label>
                  <LocationInput onLocationSelect={setPickupLocation} placeholder="Dirección de recogida" />
                </div>
                 <div>
                  <label className="text-sm font-medium flex items-center mb-2"><MapPin className="w-4 h-4 mr-2 text-green-500" />¿Dónde te dejamos en {ride.destination_city}?</label>
                  <LocationInput onLocationSelect={setDropoffLocation} placeholder="Dirección de destino" />
                </div>
              </div>
              <div className="my-4">
                <p className="font-semibold text-lg">Total a Pagar: {formatCurrencyARS(totalCost)}</p>
                <p className="text-sm text-gray-500">
                  El monto se debitará de tu billetera. La reserva quedará pendiente hasta que el conductor la confirme.
                </p>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsConfirmOpen(false)} disabled={isReserving}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmReservation} disabled={isReserving}>
                  {isReserving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando...</> : "Confirmar y Pagar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    };

    export default SharedRideCard;