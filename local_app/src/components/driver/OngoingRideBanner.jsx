import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { MapPin, Navigation } from 'lucide-react';

    const OngoingRideBanner = ({ ride }) => {
      const navigate = useNavigate();

      if (!ride) {
        return null;
      }

      const handleNavigateToRide = () => {
        const trackingPath = ride.ride_type === 'package' 
          ? `/tracking/package/${ride.id}` 
          : `/tracking/${ride.id}`;
        navigate(trackingPath, { state: { rideType: ride.ride_type || 'now' } });
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-primary-foreground border border-blue-200 rounded-lg shadow-lg p-4 mb-6 flex items-center justify-between"
        >
          <div className="flex items-center">
            <div className="bg-primary text-white rounded-full p-3 mr-4">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-lg text-slate-800">¡Viaje en curso!</p>
              <p className="text-sm text-slate-600">Tienes un viaje activo en este momento.</p>
            </div>
          </div>
          <Button onClick={handleNavigateToRide} className="bg-primary hover:bg-primary/90 text-white">
            <Navigation className="mr-2 h-4 w-4" />
            Volver a la Navegación
          </Button>
        </motion.div>
      );
    };

    export default OngoingRideBanner;