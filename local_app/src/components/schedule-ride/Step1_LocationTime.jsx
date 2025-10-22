import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, X } from 'lucide-react';
import LocationInput from '@/components/common/LocationInput';

const Step1_LocationTime = ({
  origin,
  onOriginSelect,
  stops,
  onStopSelect,
  onAddStop,
  onRemoveStop,
  maxStops,
  pickupTime,
  onPickupTimeChange,
  minPickupDateTime,
}) => {
  const destination = stops[stops.length - 1];

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-xl text-gray-800">¿A dónde y cuándo?</h2>

      <div id="origin-input-schedule">
        <LocationInput
          label="Origen"
          value={origin}
          onLocationSelect={onOriginSelect}
          placeholder="Buscar dirección de origen"
        />
      </div>

      {stops.map((stop, index) => (
        <div key={stop.id} className="flex items-center gap-2">
          <div className="w-full">
            <LocationInput
              value={stop.location}
              onLocationSelect={(loc) => onStopSelect(index, loc)}
              placeholder={index === stops.length - 1 ? '¿A dónde vas?' : `Parada ${index + 1}`}
              disabled={!origin}
            />
          </div>
          {stops.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveStop(index)}
              className="flex-shrink-0 mt-6"
            >
              <X className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      ))}

      {stops.length - 1 < maxStops && (
        <Button variant="outline" onClick={onAddStop} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          Añadir parada
        </Button>
      )}

      <div className="grid grid-cols-1" id="pickup-time-schedule">
        <div>
          <Label htmlFor="pickupTime">Hora de recogida</Label>
          <Input
            id="pickupTime"
            type="datetime-local"
            value={pickupTime}
            onChange={(e) => onPickupTimeChange(e.target.value)}
            min={minPickupDateTime}
            className="mt-1"
            disabled={!origin || !destination.location}
          />
        </div>
      </div>
    </div>
  );
};

export default Step1_LocationTime;