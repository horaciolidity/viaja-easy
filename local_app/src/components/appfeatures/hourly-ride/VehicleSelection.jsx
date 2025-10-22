
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Car, Bike } from 'lucide-react';

const VehicleSelection = ({ vehicleTypes, selectedVehicleTypeId, onSelectVehicle }) => {
  return (
    <motion.div
      id="vehicle-selection-hourly"
      className="bg-white p-6 rounded-2xl shadow-lg dark:bg-slate-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <h2 className="text-lg font-semibold text-slate-800 mb-4 dark:text-slate-100">Elige un vehículo</h2>
      <div className="grid grid-cols-2 gap-4">
        {vehicleTypes.map((vt) => (
          <Button
            key={vt.id}
            variant={selectedVehicleTypeId === vt.id ? 'default' : 'outline'}
            className="h-20 flex flex-col"
            onClick={() => onSelectVehicle(vt.id)}
          >
            {vt.name === 'Auto' ? <Car /> : <Bike />}
            <span>{vt.name}</span>
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

export default VehicleSelection;
  