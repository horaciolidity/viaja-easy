import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Search, PlusCircle } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';

const SharedRidePage = () => {
  const navigate = useNavigate();

  // Placeholder data
  const availableSharedRides = [
    { id: 1, from: "Obelisco", to: "Aeroparque", time: "14:30", seats: 2, price: "ARS 800" },
    { id: 2, from: "Palermo", to: "Unicenter", time: "15:00", seats: 1, price: "ARS 950" },
    { id: 3, from: "Caballito", to: "Retiro", time: "16:15", seats: 3, price: "ARS 700" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
       <header className="passenger-dashboard-header sticky top-0 z-10">
        <div className="status-bar-overlay">
          <span>4:42</span>
          <span>Viaje Compartido</span>
          <Users className="w-4 h-4" />
        </div>
        <div className="pt-2 pb-4 px-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 text-white hover:bg-white/20 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">Viajes Compartidos</h1>
        </div>
      </header>

      <main className="flex-grow p-4 space-y-6 overflow-y-auto">
        <motion.div 
          className="flex space-x-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button className="flex-1 h-12 text-base gradient-primary text-white rounded-lg shadow-md">
            <Search className="w-5 h-5 mr-2" />
            Buscar un Viaje
          </Button>
          <Button variant="outline" className="flex-1 h-12 text-base border-primary text-primary hover:bg-primary/10 rounded-lg shadow-md">
            <PlusCircle className="w-5 h-5 mr-2" />
            Ofrecer mi Viaje
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Viajes disponibles cerca tuyo</h2>
          {availableSharedRides.length > 0 ? (
            <div className="space-y-3">
              {availableSharedRides.map(ride => (
                <div key={ride.id} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-700">{ride.from} → {ride.to}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{ride.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Salida: {ride.time}</span>
                    <span>Asientos: {ride.seats} disponibles</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-8">No hay viajes compartidos disponibles ahora.</p>
          )}
        </motion.div>
      </main>
      <BottomNavBar userType="passenger" />
    </div>
  );
};

export default SharedRidePage;