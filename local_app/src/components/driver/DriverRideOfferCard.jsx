import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MapPin, DollarSign, Loader2, CheckCircle, Calendar, Hourglass, Package, Car, Bike, Star, Route } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const RIDE_TYPE_DETAILS = {
  now: { label: 'Inmediato', icon: Car, color: 'bg-green-500' },
  scheduled: { label: 'Programado', icon: Calendar, color: 'bg-blue-500' },
  hourly: { label: 'Por Horas', icon: Hourglass, color: 'bg-purple-500' },
  package: { label: 'Paquetería', icon: Package, color: 'bg-orange-500' },
  default: { label: 'Viaje', icon: Car, color: 'bg-gray-500' },
};

const VehicleIcon = ({ vehicleName, className = "w-4 h-4" }) => {
  if (vehicleName === 'Moto') return <Bike className={className} />;
  return <Car className={className} />;
};

const DriverRideOfferCard = ({ ride, onAccept, isLoading }) => {
  const rideDetails = RIDE_TYPE_DETAILS[ride.ride_type] || RIDE_TYPE_DETAILS.default;
  const isLoadingThisRide = isLoading;

  const handleImageError = (e) => {
    e.target.onerror = null; 
    e.target.src = '/images/default-avatar.png';
  };
  
  const hasStops = ride.stops && ride.stops.length > 1;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="list-none"
    >
      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${rideDetails.color}`}>
              <rideDetails.icon className="w-3 h-3 mr-1.5" />
              {rideDetails.label}
            </span>
            {hasStops && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-amber-500">
                <Route className="w-3 h-3 mr-1.5" />
                Multi-parada
              </span>
            )}
            {ride.pickup_time && (
              <span className="text-xs text-gray-500">
                {format(new Date(ride.pickup_time), "d MMM, HH:mm'hs'", { locale: es })}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <Avatar className="w-8 h-8 mr-3">
              <AvatarImage src={ride.passenger_avatar_url || '/images/default-avatar.png'} alt={ride.passenger_name || 'Pasajero'} onError={handleImageError} />
              <AvatarFallback>{ride.passenger_name?.charAt(0) || 'P'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-gray-800">{ride.passenger_name || 'Pasajero'}</p>
              <div className="flex items-center text-xs text-gray-500">
                <Star className="w-3 h-3 text-yellow-400 mr-1" /> 
                <span>{ride.passenger_rating?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700">{ride.origin_address || 'Origen no especificado'}</p>
          </div>
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700">{ride.destination_address || 'Destino no especificado'}</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {ride.vehicle_type_name && (
              <span className="flex items-center font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-xs">
                <VehicleIcon vehicleName={ride.vehicle_type_name} className="w-4 h-4 mr-1.5" />
                <span>{ride.vehicle_type_name}</span>
              </span>
            )}
            <div className="text-lg font-bold text-green-600">
              {ride.formattedEstimatedPrice}
            </div>
          </div>
          <Button onClick={onAccept} className="bg-primary hover:bg-primary/90 text-white" size="sm" disabled={isLoadingThisRide}>
            {isLoadingThisRide ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {isLoadingThisRide ? '' : 'Aceptar'}
          </Button>
        </CardFooter>
      </Card>
    </motion.li>
  );
};

export default DriverRideOfferCard;