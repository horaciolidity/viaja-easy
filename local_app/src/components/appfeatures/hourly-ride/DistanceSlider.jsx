
import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const DistanceSlider = ({ estimatedDistance, setEstimatedDistance }) => {
  return (
    <motion.div
      id="distance-slider-hourly"
      className="bg-white p-6 rounded-2xl shadow-lg dark:bg-slate-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-lg font-semibold text-slate-800 mb-4 dark:text-slate-100">Estimación de distancia</h2>
      <p className="text-3xl font-bold text-primary mb-2">{estimatedDistance} km</p>
      <p className="text-xs text-slate-500 mb-4 dark:text-slate-400">Ajusta la distancia total que planeas recorrer.</p>
      <Slider min={5} max={200} step={5} value={[estimatedDistance]} onValueChange={(v) => setEstimatedDistance(v[0])} />
      <div className="flex justify-between text-xs text-slate-500 mt-2 dark:text-slate-400">
        <span>5 km</span>
        <span>200 km</span>
      </div>
    </motion.div>
  );
};

export default DistanceSlider;
  