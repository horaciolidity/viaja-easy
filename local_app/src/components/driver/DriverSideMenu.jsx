import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Car } from 'lucide-react';
import DriverRideOfferCard from './DriverRideOfferCard';

const DriverSideMenu = () => {
  const { profile, user } = useAuth();
  const { availableRides, acceptRide, loading: isAccepting, loadAvailableRides } = useRide();
  const navigate = useNavigate();

  const isOnline = profile?.status === 'available';

  const handleAcceptRide = async (ride) => {
    if (!user || isAccepting) return;
    try {
      const acceptedRide = await acceptRide(ride);
      if (acceptedRide) {
        toast({ title: "Viaje Aceptado", description: "Dirígete al punto de recogida.", className: "bg-green-500 text-white" });
        const trackingPath = ride.ride_type === 'package' ? `/tracking/package/${acceptedRide.id}` : `/tracking/${acceptedRide.id}`;
        navigate(trackingPath);
      }
    } catch (error) {
      loadAvailableRides();
    }
  };

  const categorizedRides = useMemo(() => {
    return {
      now: availableRides.filter(r => r.ride_type === 'now'),
      scheduled: availableRides.filter(r => r.ride_type === 'scheduled'),
      hourly: availableRides.filter(r => r.ride_type === 'hourly'),
      package: availableRides.filter(r => r.ride_type === 'package'),
    };
  }, [availableRides]);

  const renderRideList = (rides) => {
    if (isAccepting && rides.length === 0) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Buscando viajes...</span>
        </div>
      );
    }

    if (rides.length === 0) {
      return (
        <div className="text-center py-8 px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">No hay viajes de este tipo por ahora</p>
          <p className="text-sm text-gray-400">Los nuevos viajes aparecerán aquí</p>
        </div>
      );
    }

    return (
      <motion.ul layout className="space-y-4">
        <AnimatePresence>
          {rides.map((ride, index) => (
            <DriverRideOfferCard
              key={ride.id}
              ride={ride}
              onAccept={() => handleAcceptRide(ride)}
              isLoading={isAccepting}
            />
          ))}
        </AnimatePresence>
      </motion.ul>
    );
  };

  if (!isOnline) {
    return (
      <aside className="hidden md:flex flex-col w-80 bg-white border-l border-gray-200 p-4">
        <div className="flex-1 flex items-center justify-center text-center text-gray-500">
          <p>Conéctate para ver las ofertas de viajes.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-96 bg-white border-l border-gray-200">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold text-gray-800">Viajes Disponibles</h2>
        <p className="text-sm text-gray-500">Nuevas ofertas aparecerán aquí.</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="now" className="w-full p-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-xl shadow-inner">
            <TabsTrigger value="now">Ahora ({categorizedRides.now.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Prog. ({categorizedRides.scheduled.length})</TabsTrigger>
            <TabsTrigger value="hourly">Horas ({categorizedRides.hourly.length})</TabsTrigger>
            <TabsTrigger value="packages">Paq. ({categorizedRides.package.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="now" className="mt-4">
            {renderRideList(categorizedRides.now)}
          </TabsContent>
          <TabsContent value="scheduled" className="mt-4">
            {renderRideList(categorizedRides.scheduled)}
          </TabsContent>
          <TabsContent value="hourly" className="mt-4">
            {renderRideList(categorizedRides.hourly)}
          </TabsContent>
          <TabsContent value="packages" className="mt-4">
            {renderRideList(categorizedRides.package)}
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
};

export default DriverSideMenu;