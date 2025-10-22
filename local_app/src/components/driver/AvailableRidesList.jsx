import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Car, Calendar, Hourglass, Bike, Star, Route, Package, X } from 'lucide-react';
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

const RideCard = ({ ride, onAccept, isAccepting, index }) => {
  const rideDetails = RIDE_TYPE_DETAILS[ride.ride_type] || RIDE_TYPE_DETAILS.default;
  const isLoadingThisRide = isAccepting === ride.id;

  const handleImageError = (e) => {
    e.target.onerror = null; 
    e.target.src = '/images/default-avatar.png';
  };
  
  const hasStops = ride.stops && ride.stops.length > 1;

  return (
    <motion.li
      layout
      key={ride.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white list-none"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${rideDetails.color}`}>
              <rideDetails.icon className="w-3 h-3 mr-1.5" />
              {rideDetails.label}
            </span>
            {hasStops && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-orange-500">
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
          <div className="flex items-center mb-2">
            <MapPin className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 truncate">
              {ride.origin_address || 'Origen no especificado'}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-red-500 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">
              {ride.destination_address || 'Destino no especificado'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <Avatar className="w-6 h-6 mr-2">
              <AvatarImage src={ride.passenger_avatar_url || '/images/default-avatar.png'} alt={ride.passenger_name || 'Pasajero'} onError={handleImageError} />
              <AvatarFallback>{ride.passenger_name?.charAt(0) || 'P'}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{ride.passenger_name || 'Pasajero'}</span>
            <Star className="w-3 h-3 text-yellow-400 ml-1.5 mr-0.5" /> 
            <span className="text-xs">({ride.passenger_rating?.toFixed(1) || 'N/A'})</span>
          </span>
          {ride.vehicle_type_name && (
            <span className="hidden sm:flex items-center font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
              <VehicleIcon vehicleName={ride.vehicle_type_name} className="w-5 h-5 mr-2" />
              <span>{ride.vehicle_type_name}</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {ride.formattedEstimatedPrice}
            </div>
          </div>
          <Button onClick={() => onAccept && onAccept(ride)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2" disabled={!!isAccepting}>
            {isLoadingThisRide ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aceptar'}
          </Button>
        </div>
      </div>
    </motion.li>
  );
};

const AvailableRidesList = ({ rides, onAccept, isAccepting, isLoading, isOnline }) => {
  if (!isOnline) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">Conéctate para ver viajes disponibles</p>
      </div>
    );
  }

  if (isLoading && rides.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Buscando viajes...</span>
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-2">No hay viajes de este tipo por ahora</p>
        <p className="text-sm text-gray-400">Los nuevos viajes aparecerán aquí</p>
      </div>
    );
  }

  return (
    <motion.ul
      layout
      className="space-y-4 max-h-[32rem] overflow-y-auto pr-2"
    >
      {rides.map((ride, index) => (
        <RideCard 
          key={ride.id}
          ride={ride}
          onAccept={onAccept}
          isAccepting={isAccepting}
          index={index}
        />
      ))}
    </motion.ul>
  );
};

export default AvailableRidesList;