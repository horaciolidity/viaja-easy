
import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const HoursSlider = ({ hours, setHours, settings }) => {
  return (
    <motion.div
      id="hours-slider"
      className="bg-white p-6 rounded-2xl shadow-lg dark:bg-slate-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-baseline">
        <h2 className="text-lg font-semibold text-slate-800 mb-2 dark:text-slate-100">¿Cuántas horas necesitas?</h2>
        <p className="text-3xl font-bold text-primary">{hours[0]} hora{hours[0] > 1 ? 's' : ''}</p>
      </div>
      <Slider
        min={Number(settings.min_hours ?? 1)}
        max={Number(settings.max_hours ?? Math.max(2, Number(settings.min_hours ?? 1) + 1))}
        step={1}
        value={hours}
        onValueChange={setHours}
        className="my-4"
      />
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{settings.min_hours}hr</span>
        <span>{settings.max_hours}hrs</span>
      </div>
    </motion.div>
  );
};

export default HoursSlider;
  