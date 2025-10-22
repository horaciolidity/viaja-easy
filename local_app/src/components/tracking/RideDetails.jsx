import React from 'react';
import { DollarSign, Route as RouteIcon, Timer, User, Phone, Car } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago.js';
import { formatDistance, formatDuration } from '@/utils/geolocation';

const RideDetails = ({ ride, userType }) => {
  if (!ride) return null;

  const otherUser = userType === 'driver' ? ride.passenger : ride.driver;
  const vehicle = ride.driver?.vehicle_info;
  const fare = ride.actual_fare ?? ride.fare_estimated;
  const distance = ride.actual_distance_km ?? ride.distance_km;
  const duration = ride.actual_duration_min ?? ride.duration_min;

  return (
    <div className="my-4 space-y-3 text-sm">
      <div className="flex justify-around items-center text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span className="font-bold">{formatCurrencyARS(fare || 0)}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <RouteIcon className="w-4 h-4 text-blue-500" />
          <span className="font-bold">{formatDistance(distance || 0)}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Timer className="w-4 h-4 text-purple-500" />
          <span className="font-bold">{formatDuration(duration || 0)}</span>
        </div>
      </div>
      {otherUser && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{userType === 'driver' ? 'Pasajero' : 'Conductor'}: {otherUser.full_name}</span>
          </div>
          {otherUser.phone && (
            <a href={`tel:${otherUser.phone}`} className="flex items-center gap-1 text-blue-500 hover:underline">
              <Phone className="w-3 h-3" />
              {otherUser.phone}
            </a>
          )}
        </div>
      )}
      {vehicle && userType === 'passenger' && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center font-mono">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            <span>{vehicle.brand} {vehicle.model}</span>
          </div>
          <span className="font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{vehicle.plate}</span>
        </div>
      )}
    </div>
  );
};

export default RideDetails;