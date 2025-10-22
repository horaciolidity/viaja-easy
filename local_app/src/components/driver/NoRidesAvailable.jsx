import React from 'react';
import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

const NoRidesAvailable = () => {
  return (
    <motion.div
      className="px-6 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
    >
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay viajes disponibles
        </h3>
        <p className="text-gray-500">
          Mantente conectado, pronto aparecerán nuevos pasajeros
        </p>
      </div>
    </motion.div>
  );
};

export default NoRidesAvailable;