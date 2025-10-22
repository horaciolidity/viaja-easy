
import React from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock } from 'lucide-react';

const ServiceDetails = ({ startDate, setStartDate, startTime, setStartTime, description, setDescription }) => {
  return (
    <motion.div
      id="service-details-hourly"
      className="bg-white p-6 rounded-2xl shadow-lg space-y-4 dark:bg-slate-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Detalles del Servicio</h2>
      <div>
        <Label htmlFor="start-date" className="flex items-center mb-2 text-slate-600 dark:text-slate-300">
          <Calendar className="w-4 h-4 mr-2" />
          Fecha de Inicio
        </Label>
        <Input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
      <div>
        <Label htmlFor="start-time" className="flex items-center mb-2 text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 mr-2" />
          Hora de Inicio
        </Label>
        <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="description" className="mb-2 text-slate-600 dark:text-slate-300">Descripción del Servicio</Label>
        <Textarea
          id="description"
          placeholder="Ej: Viaje fuera de la ciudad, tour por puntos turísticos, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </motion.div>
  );
};

export default ServiceDetails;
  