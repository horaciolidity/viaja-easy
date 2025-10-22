
import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

const InfoPanel = () => {
  return (
    <motion.div
      className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm flex items-start space-x-3 dark:bg-blue-900/20 dark:border-blue-700/50 dark:text-blue-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Info className="w-6 h-6 flex-shrink-0 mt-0.5" />
      <p>Podés hacer múltiples paradas. El costo final se ajustará según la distancia y tiempo reales.</p>
    </motion.div>
  );
};

export default InfoPanel;
  