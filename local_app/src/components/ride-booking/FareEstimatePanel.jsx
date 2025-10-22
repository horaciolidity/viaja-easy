import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import RideOptions from './RideOptions';
import FareDetails from './FareDetails';

const FareEstimatePanel = ({
  route,
  fare,
  onConfirm,
  isLoading,
  paymentMethod,
  vehicleTypes,
  selectedVehicleTypeId,
  setSelectedVehicleTypeId,
  selectedVehicleType,
  numPassengers,
  setNumPassengers,
}) => {
  if (!route || !fare) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.1)] p-4 pb-safe-bottom"
    >
      <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
      <div className="space-y-4 mb-4">
        <RideOptions
          vehicleTypes={vehicleTypes}
          route={route}
          selectedVehicleTypeId={selectedVehicleTypeId}
          setSelectedVehicleTypeId={setSelectedVehicleTypeId}
          numPassengers={numPassengers}
          setNumPassengers={setNumPassengers}
        />
        <FareDetails
          route={route}
          fare={fare}
          selectedVehicleType={selectedVehicleType}
          paymentMethod={paymentMethod}
        />
      </div>
      <Button
        onClick={onConfirm}
        disabled={isLoading || !selectedVehicleType}
        className="w-full h-14 bg-black text-white text-lg font-bold rounded-lg hover:bg-gray-800 transition-colors"
      >
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirmar Viaje'}
      </Button>
    </motion.div>
  );
};

export default FareEstimatePanel;