import React from 'react';
import { User, Star, MapPin, DollarSign, Route as RouteIcon, Clock } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago.js';
import { formatDistance, formatDuration } from '@/utils/geolocation.js';

const TripInfoCard = ({ ride, otherUser, isDriver }) => {
  if (!ride) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
      {otherUser && (
        <div className="flex items-center space-x-4 pb-4 border-b mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <img  
              src={otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name || 'U')}&background=random`} 
              alt={otherUser.name || 'Usuario'} 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
            <p className="text-sm text-gray-500">
              {isDriver ? 'Pasajero' : 'Conductor'}
            </p>
            <div className="flex items-center mt-1">
              <Star className="w-4 h-4 text-yellow-400 mr-1" />
              <span className="text-sm text-gray-600">{otherUser.rating || 'N/A'}</span>
            </div>
          </div>
          
          {!isDriver && ride.driver?.vehicle && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {ride.driver.vehicle.make} {ride.driver.vehicle.model}
              </p>
              <p className="text-sm text-gray-500">{ride.driver.vehicle.plate}</p>
              <p className="text-xs text-gray-400">{ride.driver.vehicle.color}</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-green-500 mt-1" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Origen</p>
            <p className="text-sm font-medium text-gray-800">{ride.origin?.address || 'No especificado'}</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-red-500 mt-1" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Destino</p>
            <p className="text-sm font-medium text-gray-800">{ride.destination?.address || 'No especificado'}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-around mt-4 pt-4 border-t">
        <div className="text-center">
          <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-sm font-bold text-green-700">{ride.formattedPrice || formatCurrencyARS(ride.price || 0)}</p>
          <p className="text-xs text-gray-500">Tarifa</p>
        </div>
        
        <div className="text-center">
          <RouteIcon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-sm font-bold text-blue-700">{formatDistance(ride.distance || 0)}</p>
          <p className="text-xs text-gray-500">Distancia</p>
        </div>
        
        <div className="text-center">
          <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-sm font-bold text-purple-700">{formatDuration(ride.duration || 0)}</p>
          <p className="text-xs text-gray-500">Tiempo est.</p>
        </div>
      </div>
    </div>
  );
};

export default TripInfoCard;