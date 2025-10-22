import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Car, Bike, Loader2 } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago.js';

const iconMap = {
  car_icon: <Car />,
  moto_icon: <Bike />,
  default: <Car />,
};

const getIcon = (iconUrl) => iconMap[iconUrl] || iconMap.default;

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  route,
  originInputText,
  destinationInputText,
  selectedVehicleType,
  numPassengers,
  estimatedFareDetails
}) => {
  if (!isOpen || !estimatedFareDetails || !route || !selectedVehicleType) return null;

  const finalFare = estimatedFareDetails.total;

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {React.cloneElement(getIcon(selectedVehicleType.icon_url), { className: "w-14 h-14 mx-auto text-blue-600 mb-3" })}
        <h2 className="text-lg font-bold text-gray-900 mb-2">Confirmar tu viaje</h2>
        <p className="text-sm text-gray-600 mb-0.5">Origen: <span className="font-medium text-gray-700">{route.origin?.address || originInputText}</span></p>
        <p className="text-sm text-gray-600 mb-0.5">Destino: <span className="font-medium text-gray-700">{route.destination?.address || destinationInputText}</span></p>
        <p className="text-sm text-gray-600 mb-0.5">Tipo: <span className="font-medium text-gray-700">{selectedVehicleType.name}</span></p>
        <p className="text-sm text-gray-600 mb-3">Pasajeros: <span className="font-medium text-gray-700">{numPassengers[0]}</span></p>
        <p className="text-2xl font-bold price-highlight mb-5">{formatCurrencyARS(finalFare)}</p>
        <div className="space-y-2.5">
          <Button onClick={onConfirm} disabled={isLoading} className="w-full gradient-success text-white h-11 rounded-lg text-base">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Confirmando...</> : 'Sí, confirmar'}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full h-11 rounded-lg text-base text-gray-700 hover:bg-gray-100">
            Cancelar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmationModal;