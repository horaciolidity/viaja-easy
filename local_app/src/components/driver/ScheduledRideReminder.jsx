import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduledRide } from '@/contexts/ScheduledRideContext';
import { useHourlyRide } from '@/contexts/HourlyRideContext';
import { differenceInMinutes, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRide } from '@/contexts/RideContext';

const ScheduledRideReminder = () => {
  const { profile } = useAuth();
  const { allUserRides } = useRide();
  const [upcomingRide, setUpcomingRide] = useState(null);
  const navigate = useNavigate();

  const getUpcomingRides = useCallback(() => {
    if (!allUserRides) return [];
    return allUserRides.filter(r => 
      (r.ride_type === 'scheduled' || r.ride_type === 'hourly') && 
      (r.status === 'accepted' || r.status === 'scheduled') &&
      r.driver_id === profile?.id
    ).sort((a, b) => new Date(a.scheduled_pickup_time || a.start_datetime) - new Date(b.scheduled_pickup_time || b.start_datetime));
  }, [allUserRides, profile]);

  useEffect(() => {
    if (profile?.user_type !== 'driver') return;

    const checkUpcomingRides = () => {
      const upcomingRidesList = getUpcomingRides();
      const nextRide = upcomingRidesList[0];

      if (nextRide) {
        const pickupTime = parseISO(nextRide.scheduled_pickup_time || nextRide.start_datetime);
        const minutesToPickup = differenceInMinutes(pickupTime, new Date());

        if (minutesToPickup > 0 && minutesToPickup <= 35) {
          setUpcomingRide({
            ...nextRide,
            minutesToPickup,
          });
        } else {
          setUpcomingRide(null);
        }
      } else {
        setUpcomingRide(null);
      }
    };

    const interval = setInterval(checkUpcomingRides, 60000); // Check every minute
    checkUpcomingRides(); // Initial check

    return () => clearInterval(interval);
  }, [getUpcomingRides, profile]);

  if (!upcomingRide) {
    return null;
  }

  const handleGoToRide = () => {
    navigate(`/tracking/${upcomingRide.id}`);
    setUpcomingRide(null);
  };

  return (
    <AlertDialog open={!!upcomingRide} onOpenChange={() => setUpcomingRide(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl">Recordatorio de Viaje</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base text-slate-600">
            Tienes un viaje programado en aproximadamente <span className="font-bold">{upcomingRide.minutesToPickup} minutos</span>.
            <br />
            Por favor, conéctate y prepárate para el viaje.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel onClick={() => setUpcomingRide(null)}>Descartar</AlertDialogCancel>
          <AlertDialogAction onClick={handleGoToRide} className="bg-primary hover:bg-primary/90">
            Ver Viaje
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ScheduledRideReminder;