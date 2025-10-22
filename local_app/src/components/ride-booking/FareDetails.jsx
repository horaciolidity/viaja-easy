import React from 'react';
import { CreditCard, Navigation, Clock } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago.js';

const FareDetails = ({ route, fare, selectedVehicleType, paymentMethod }) => {
  if (!route || !fare || !selectedVehicleType) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center text-gray-600"><Navigation className="w-4 h-4 mr-2" /> Distancia</div>
        <div className="font-medium text-gray-800">{route.distance.toFixed(1)} km</div>
      </div>
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center text-gray-600"><Clock className="w-4 h-4 mr-2" /> Duración</div>
        <div className="font-medium text-gray-800">~{Math.round(route.duration)} min</div>
      </div>
      <div className="border-t border-gray-200 my-2"></div>
      <div className="flex justify-between items-center">
        <span className="text-md font-semibold text-gray-800">Tarifa Estimada ({selectedVehicleType.name}):</span>
        <span className="text-xl font-bold text-black">{formatCurrencyARS(fare.total)}</span>
      </div>
      {paymentMethod && (
        <div className="flex items-center text-xs text-gray-600 pt-1">
          <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Se cobrará a {paymentMethod.name}
        </div>
      )}
    </div>
  );
};

export default FareDetails;