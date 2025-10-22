import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';

const ScheduleRidePage = () => {
  const navigate = useNavigate();
  // Basic state for date and time, you'd use a proper date/time picker in a real app
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="passenger-dashboard-header sticky top-0 z-10">
        <div className="status-bar-overlay">
          <span>4:42</span>
          <span>Agendar Viaje</span>
          <Calendar className="w-4 h-4" />
        </div>
        <div className="pt-2 pb-4 px-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 text-white hover:bg-white/20 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">Agendar un Viaje</h1>
        </div>
      </header>

      <main className="flex-grow p-6 space-y-6 overflow-y-auto">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona Fecha y Hora</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="ride-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input 
                type="date" 
                id="ride-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="ride-time" className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input 
                type="time" 
                id="ride-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ingresa Origen y Destino</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Origen" className="w-full h-11 px-3 rounded-lg border border-gray-300" />
            <input type="text" placeholder="Destino" className="w-full h-11 px-3 rounded-lg border border-gray-300" />
          </div>
        </motion.div>
        
        <Button 
          className="w-full h-12 text-base gradient-primary text-white rounded-lg shadow-md"
          onClick={() => alert('Funcionalidad "Agendar Viaje" en desarrollo.')}
        >
          Confirmar Agendamiento
        </Button>
      </main>
      <BottomNavBar userType="passenger" />
    </div>
  );
};

export default ScheduleRidePage;