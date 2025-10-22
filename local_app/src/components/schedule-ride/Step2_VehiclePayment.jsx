import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Car, Bike, Wallet as WalletIcon } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago';

const VISIBLE_METHODS = [
  { id: 'cash', type: 'cash', name: 'Efectivo' },
  { id: 'wallet', type: 'wallet', name: 'Billetera' },
];
const keyOf = (m) => (typeof m === 'string' ? m : (m?.type || m?.id || 'cash')).toString().toLowerCase();

const Step2_VehiclePayment = ({
  loadingPrerequisites,
  vehicleTypes,
  selectedVehicle,
  onVehicleSelect,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  loadingFare,
  estimatedFare,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="font-bold text-xl">Elige tu viaje</h2>

      <div className="grid grid-cols-2 gap-4" id="vehicle-selection-schedule">
        {loadingPrerequisites ? (
          <Loader2 className="animate-spin" />
        ) : vehicleTypes.length > 0 ? (
          vehicleTypes.map((vt) => (
            <Button
              key={vt.id}
              variant={selectedVehicle?.id === vt.id ? 'default' : 'outline'}
              className="h-24 flex flex-col justify-center items-center"
              onClick={() => onVehicleSelect(vt)}
            >
              {vt.name?.toLowerCase?.().includes('moto') ? (
                <Bike className="w-8 h-8 mb-2" />
              ) : (
                <Car className="w-8 h-8 mb-2" />
              )}
              <span className="font-semibold">{vt.name}</span>
            </Button>
          ))
        ) : (
          <p>No hay vehículos disponibles.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-1">
        {VISIBLE_METHODS.map((m) => {
          const k = keyOf(m);
          const selected = keyOf(selectedPaymentMethod) === k;
          return (
            <Button
              key={m.id}
              variant={selected ? 'default' : 'outline'}
              onClick={() => onPaymentMethodSelect(m)}
              className="h-14 flex-col text-xs"
            >
              <WalletIcon className="w-5 h-5 mb-1" />
              {m.name}
            </Button>
          );
        })}
      </div>

      {loadingFare && (
        <div className="flex items-center justify-center">
          <Loader2 className="animate-spin mr-2" /> Calculando tarifa...
        </div>
      )}

      <div className="text-center font-bold text-2xl">
        {formatCurrencyARS(estimatedFare || 0)}
      </div>
    </div>
  );
};

export default Step2_VehiclePayment;