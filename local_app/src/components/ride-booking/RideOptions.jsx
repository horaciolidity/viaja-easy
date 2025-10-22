import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Car, Bike } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago.js';

const iconMap = {
  car_icon: <Car />,
  moto_icon: <Bike />,
  default: <Car />,
};

const getIcon = (iconUrl) => iconMap[iconUrl] || iconMap.default;

const calculateFareForType = (route, vehicleType) => {
    if (!route || !vehicleType) return { total: 0 };
    const { distance, duration } = route;
    const { base_fare, price_per_km, price_per_minute } = vehicleType;
    const total = parseFloat(base_fare) + (parseFloat(distance) * parseFloat(price_per_km)) + (parseFloat(duration) * parseFloat(price_per_minute || 0));
    return { total: Math.max(total, 0) };
};

const RideOptions = ({ 
    vehicleTypes, 
    route, 
    selectedVehicleTypeId, 
    setSelectedVehicleTypeId, 
    numPassengers, 
    setNumPassengers 
}) => {
  if (!route || !vehicleTypes || vehicleTypes.length === 0) return null;

  return (
    <>
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de Vehículo</Label>
        <div className="grid grid-cols-2 gap-2.5">
          {vehicleTypes.map(vt => {
            const fare = calculateFareForType(route, vt);
            const isDisabled = numPassengers[0] > vt.capacity;

            return (
              <Button
                key={vt.id}
                variant={selectedVehicleTypeId === vt.id ? 'default' : 'outline'}
                onClick={() => !isDisabled && setSelectedVehicleTypeId(vt.id)}
                className={`h-auto py-2.5 flex flex-col items-center justify-center rounded-lg transition-all duration-200 ${selectedVehicleTypeId === vt.id ? 'bg-black text-white ring-2 ring-black shadow-lg' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isDisabled}
                title={isDisabled ? `Capacidad máxima: ${vt.capacity} pasajeros` : ''}
              >
                {React.cloneElement(getIcon(vt.icon_url), { className: `w-6 h-6 mb-1 ${selectedVehicleTypeId === vt.id ? 'text-white' : 'text-gray-600'}` })}
                <span className="text-sm font-semibold">{vt.name}</span>
                <span className={`text-xs font-bold ${selectedVehicleTypeId === vt.id ? 'text-white/90' : 'text-gray-800'}`}>
                  {formatCurrencyARS(fare.total)}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
      <div>
        <Label htmlFor="passengers" className="text-sm font-medium text-gray-700">Pasajeros: {numPassengers[0]}</Label>
        <Slider
          id="passengers"
          min={1}
          max={4}
          step={1}
          value={numPassengers}
          onValueChange={setNumPassengers}
          className="mt-2 [&>span:first-child]:h-2 [&>span:first-child>span]:h-2 [&>span:first-child>span]:bg-black [&>span:last-child]:h-4 [&>span:last-child]:w-4 [&>span:last-child]:border-2 [&>span:last-child]:bg-white"
        />
      </div>
    </>
  );
};

export default RideOptions;