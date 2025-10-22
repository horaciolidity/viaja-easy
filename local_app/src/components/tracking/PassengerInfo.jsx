import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Car, Clock, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

const PassengerInfo = ({ status }) => {
  let title = '';
  let message = '';
  let icon = null;
  let bgColor = '';
  let textColor = '';

  switch (status) {
    case 'searching':
      title = 'Buscando conductor...';
      message = 'Estamos encontrando el mejor conductor para vos.';
      icon = Loader2;
      bgColor = 'bg-blue-50 dark:bg-blue-900/20';
      textColor = 'text-blue-800 dark:text-blue-200';
      break;
    case 'driver_assigned':
      title = '¡Conductor asignado!';
      message = 'Tu conductor está en camino.';
      icon = Car;
      bgColor = 'bg-green-50 dark:bg-green-900/20';
      textColor = 'text-green-800 dark:text-green-200';
      break;
    case 'driver_arriving':
      title = 'Tu conductor está llegando';
      message = 'Preparate para el viaje.';
      icon = Clock;
      bgColor = 'bg-orange-50 dark:bg-orange-900/20';
      textColor = 'text-orange-800 dark:text-orange-200';
      break;
    case 'driver_arrived':
      title = 'Tu conductor ha llegado';
      message = 'Por favor, encontrate con tu conductor.';
      icon = MapPin;
      bgColor = 'bg-purple-50 dark:bg-purple-900/20';
      textColor = 'text-purple-800 dark:text-purple-200';
      break;
    case 'in_progress':
      title = 'Viaje en curso';
      message = 'Disfrutá tu viaje. Podés ver la ruta en el mapa.';
      icon = Car;
      bgColor = 'bg-indigo-50 dark:bg-indigo-900/20';
      textColor = 'text-indigo-800 dark:text-indigo-200';
      break;
    case 'completed':
      title = 'Viaje completado';
      message = '¡Gracias por viajar con nosotros!';
      icon = CheckCircle;
      bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
      textColor = 'text-emerald-800 dark:text-emerald-200';
      break;
    case 'cancelled':
      title = 'Viaje cancelado';
      message = 'El viaje ha sido cancelado.';
      icon = AlertTriangle;
      bgColor = 'bg-red-50 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-200';
      break;
    default:
      title = 'Buscando conductor...';
      message = 'Aguardá un momento.';
      icon = Loader2;
      bgColor = 'bg-gray-50 dark:bg-gray-900/20';
      textColor = 'text-gray-800 dark:text-gray-200';
  }

  const IconComponent = icon;

  return (
    <motion.div 
      className={`${bgColor} rounded-2xl p-6 text-center mt-4 border-2 border-opacity-20 shadow-lg`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex justify-center mb-4"
      >
        <div className={`p-3 rounded-full ${bgColor.replace('50', '100').replace('900/20', '800/30')} shadow-md`}>
          <IconComponent 
            className={`w-8 h-8 ${textColor} ${status === 'searching' ? 'animate-spin' : ''}`} 
          />
        </div>
      </motion.div>
      
      <motion.h3 
        className={`font-bold ${textColor} text-xl mb-2`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h3>
      
      <motion.p 
        className={`text-sm ${textColor.replace('800', '600').replace('200', '300')} leading-relaxed`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

export default PassengerInfo;