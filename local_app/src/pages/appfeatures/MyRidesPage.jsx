import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListChecks, Clock } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';

const MyRidesPage = () => {
  const navigate = useNavigate();

  const scheduledRides = [
    { id: 1, to: "Aeroparque", date: "2025-06-15", time: "10:00", type: "Agendado" },
    { id: 2, to: "Oficina", date: "2025-06-12", time: "08:30", type: "Recurrente" },
  ];

  const activeHourlyRides = [
    { id: 3, driver: "Laura P.", remaining: "45 mins", vehicle: "Renault Sandero", type: "Por Hora" }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="passenger-dashboard-header sticky top-0 z-10">
        <div className="status-bar-overlay">
          <span>9:41 AM</span>
          <span className="font-semibold">Mis Viajes</span>
          <ListChecks className="w-4 h-4" />
        </div>
        <div className="pt-2 pb-4 px-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2 text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">Mis Viajes Programados</h1>
        </div>
      </header>

      <main className="flex-grow p-4 space-y-6 overflow-y-auto pb-24">
        <Section title="Viajes Agendados">
          {scheduledRides.length > 0 ? (
            scheduledRides.map((ride) => <RideItem key={ride.id} ride={ride} />)
          ) : (
            <EmptyState message="No tienes viajes agendados." />
          )}
        </Section>

        <Section title="Viajes por Hora Activos">
          {activeHourlyRides.length > 0 ? (
            activeHourlyRides.map((ride) => <RideItem key={ride.id} ride={ride} />)
          ) : (
            <EmptyState message="No tienes viajes por hora activos." />
          )}
        </Section>
      </main>

      <BottomNavBar userType="passenger" />
    </div>
  );
};

const Section = ({ title, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ staggerChildren: 0.1 }}
  >
    <h2 className="text-lg font-semibold text-gray-800 mb-3 px-1">{title}</h2>
    <div className="space-y-3">{children}</div>
  </motion.section>
);

const RideItem = ({ ride }) => (
  <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-center mb-1">
      <p className="text-sm font-medium text-gray-700">
        {ride.to
          ? `Destino: ${ride.to}`
          : `Conductor: ${ride.driver}`}
      </p>
      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
        {ride.type}
      </span>
    </div>

    <div className="flex items-center text-xs text-gray-500">
      <Clock className="w-3 h-3 mr-1" />
      {ride.date && ride.time
        ? `${ride.date} a las ${ride.time}`
        : `Restante: ${ride.remaining}`}
      {ride.vehicle && <span className="ml-2">({ride.vehicle})</span>}
    </div>

    <Button
      variant="outline"
      size="sm"
      className="mt-2 w-full border-primary/50 text-primary/80 hover:bg-primary/5 rounded-md text-xs"
    >
      Ver Detalles / Modificar
    </Button>
  </div>
);

const EmptyState = ({ message }) => (
  <p className="text-center text-gray-500 py-4 text-sm">{message}</p>
);

export default MyRidesPage;