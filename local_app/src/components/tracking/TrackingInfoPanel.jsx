import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Star, Car, Bike, Flag, User, ChevronUp, AlertCircle, Timer, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import DriverActions from './DriverActions';
import WaitingTimer from './WaitingTimer';
import RideDetails from './RideDetails';
import PassengerValidationInfo from './PassengerValidationInfo';
import { useLocation } from '@/contexts/LocationContext';
import { formatDuration } from '@/utils/geolocation';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import CancelRideDialog from './CancelRideDialog';
import CancelRideButton from '@/components/rides/CancelRideButton';

const vehicleIcons = {
  'Moto': <Bike className="w-8 h-8 text-primary" />,
  'Auto': <Car className="w-8 h-8 text-primary" />
};

const CollapsiblePanel = ({ children, onToggle, isMinimized }) => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ y: isMinimized ? "calc(100% - 80px)" : "0%" });
  }, [isMinimized, controls]);

  return (
    <>
      <motion.div
        drag="y"
        onDragEnd={(event, info) => {
          if (info.offset.y > 50) onToggle(true);
          if (info.offset.y < -50) onToggle(false);
        }}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        initial={{ y: '100%' }}
        animate={controls}
        transition={{ type: 'spring', damping: 40, stiffness: 400 }}
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-700 z-40"
      >
        <div className="w-full cursor-grab active:cursor-grabbing" onClick={() => onToggle(!isMinimized)}>
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto my-4" />
        </div>
        <div className="p-6 pt-0 pb-safe-bottom">
          {children}
        </div>
      </motion.div>

      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => onToggle(false)}
              className="h-16 w-16 rounded-full bg-primary text-white shadow-lg"
              size="icon"
            >
              <ChevronUp className="h-8 w-8" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const SearchingPanel = ({ onCancel, isLoading, ride }) => (
  <motion.div
    initial={{ y: '100%' }}
    animate={{ y: 0 }}
    transition={{ type: 'spring', damping: 40, stiffness: 300 }}
    className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-700"
  >
    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto my-4" />
    <div className="p-6 pt-0 pb-safe-bottom flex flex-col items-center justify-center space-y-4">
      <div className="animate-pulse flex space-x-4 items-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Buscando un conductor...</h2>
      <p className="text-sm text-slate-500 text-center dark:text-slate-400">Estamos encontrando el viaje perfecto para ti. ¡Gracias por tu paciencia!</p>
      <CancelRideButton
        rideId={ride.id}
        rideType={ride.ride_type || 'now'}
        onDone={onCancel}
        variant="destructive"
        className="mt-4"
        disabled={isLoading}
      >
        Cancelar Búsqueda
      </CancelRideButton>
    </div>
  </motion.div>
);

const PassengerPanel = ({ ride, onCancel, onChat, isLoading }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [eta, setEta] = useState(null);
  const { calculateRoute } = useLocation();

  const otherUser = ride?.driver;
  const vehicle = ride?.driver?.vehicle_info;

  useEffect(() => {
    const fetchETA = async () => {
      if (ride?.driver_last_location && ride?.origin_lat && ['driver_assigned', 'accepted'].includes(ride.status)) {
        try {
          const routeInfo = await calculateRoute(
            { lat: ride.driver_last_location.lat, lng: ride.driver_last_location.lng },
            { lat: ride.origin_lat, lng: ride.origin_lng }
          );
          if (routeInfo && routeInfo.duration) {
            setEta(routeInfo.duration * 60);
          }
        } catch (error) {
          console.error("Error calculating ETA:", error);
          setEta(null);
        }
      } else {
        setEta(null);
      }
    };

    fetchETA();
    const interval = setInterval(fetchETA, 30000);
    return () => clearInterval(interval);
  }, [ride?.driver_last_location, ride?.origin_lat, ride?.status, calculateRoute]);

  const getPassengerStatusMessage = () => {
    if (!otherUser && ['driver_arriving', 'driver_arrived'].includes(ride.status)) {
      return 'Cargando información del conductor...';
    }
    switch (ride.status) {
      case 'driver_assigned': 
      case 'accepted': 
      case 'driver_arriving': return eta ? `Tu conductor llega en ${formatDuration(eta)}` : 'Tu conductor está en camino.';
      case 'driver_arrived': return `${otherUser?.full_name || 'Tu conductor'} ha llegado. ¡Encuéntralo!`;
      case 'in_progress': return `Viaje en curso.`;
      case 'completed': return '¡Viaje completado!';
      case 'cancelled_by_driver':
      case 'cancelled_by_passenger':
        return 'Viaje cancelado.';
      default: return 'Buscando conductor...';
    }
  };
  
  const getStatusIcon = () => {
    switch (ride.status) {
      case 'searching': return <Car className="w-5 h-5 text-primary animate-pulse" />;
      case 'driver_assigned':
      case 'accepted':
      case 'driver_arriving':
        return eta ? <Timer className="w-5 h-5 text-blue-500" /> : <Car className="w-5 h-5 text-green-500" />;
      case 'driver_arrived': return <User className="w-5 h-5 text-purple-500" />;
      case 'in_progress': return <Flag className="w-5 h-5 text-indigo-500" />;
      default: return <Car className="w-5 h-5 text-gray-500" />;
    }
  };

  const canCancel = !['completed', 'in_progress'].includes(ride.status) && !ride.status?.startsWith('cancelled');
  const showValidationInfo = ride.pin_code && ['driver_assigned', 'driver_arriving', 'driver_arrived', 'accepted'].includes(ride.status);
  const showWaitingTimer = ride.status === 'driver_arrived' && ride.arrived_at;
  const partialPlate = vehicle?.plate?.slice(-3);

  return (
    <CollapsiblePanel onToggle={setIsMinimized} isMinimized={isMinimized}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-4 border-white dark:border-slate-800 shadow-lg">
            <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.full_name} />
            <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {otherUser?.full_name?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-xl text-slate-800 dark:text-slate-100">{otherUser?.full_name || 'Cargando...'}</p>
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
              <Star className="w-4 h-4 text-yellow-400 mr-1.5" />
              <span>{otherUser?.rating?.toFixed(1) || 'Nuevo'}</span>
            </div>
          </div>
        </div>
        {vehicle && (
          <div className="text-right bg-slate-100 dark:bg-slate-800 p-3 rounded-xl flex flex-col items-center space-y-2">
            {vehicleIcons[ride.vehicle_type_id] || vehicleIcons['Auto']}
            {partialPlate && (
              <p className="text-sm bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full font-mono font-bold text-slate-700 dark:text-slate-200">
                ***{partialPlate}
              </p>
            )}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <RideDetails ride={ride} userType="passenger" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center mb-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center">
          {getStatusIcon()}
          <span className="ml-3 font-semibold text-lg text-slate-700 dark:text-slate-200">{getPassengerStatusMessage()}</span>
        </div>
      </div>
      
      {showWaitingTimer && <WaitingTimer arrivedAt={ride.arrived_at} />}
      {showValidationInfo && <PassengerValidationInfo ride={ride} />}

      <div className="flex space-x-4 mt-4">
        <Button variant="outline" className="h-14 w-full border-2 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800 flex-1" onClick={onChat}>
          <MessageSquare className="h-6 w-6 text-primary mr-2" />
          <span className="font-semibold text-base">Chatear</span>
        </Button>
        {canCancel && (
          <CancelRideButton
            rideId={ride.id}
            rideType={ride.ride_type || 'now'}
            onDone={onCancel}
            variant="destructive"
            size="icon" 
            className="h-14 w-14 shadow-lg" 
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </CancelRideButton>
        )}
      </div>
    </CollapsiblePanel>
  );
};

const DriverPanel = ({ ride, onAction, onCancel, onChat, isLoading }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  
  const otherUser = ride?.passenger;

  return (
    <CollapsiblePanel onToggle={setIsMinimized} isMinimized={isMinimized}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-primary-foreground shadow-lg">
            <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.full_name} />
            <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {otherUser?.full_name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-xl text-slate-800 dark:text-slate-100">{otherUser?.full_name || 'Cargando...'}</p>
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
              <Star className="w-4 h-4 text-yellow-400 mr-1.5" />
              <span>{otherUser?.rating?.toFixed(1) || 'Nuevo'}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-2 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800" onClick={onChat}>
          <MessageSquare className="h-6 w-6 text-primary" />
        </Button>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <RideDetails ride={ride} userType="driver" />
          </motion.div>
        )}
      </AnimatePresence>

      {ride.prepaid_amount > 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-3 rounded-r-lg mb-4 dark:bg-green-900/30 dark:text-green-300">
            <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <p className="text-sm font-medium">
                    Pago anticipado recibido: <span className="font-bold">{formatCurrencyARS(ride.prepaid_amount)}</span>
                </p>
            </div>
        </div>
      )}
      
      {/* 👇 Aquí la modificación: mostrar timer si el conductor ya llegó */}
      {ride.status === 'driver_arrived' && <WaitingTimer arrivedAt={ride.arrived_at} />}

      <DriverActions 
        ride={ride} 
        onStatusUpdate={onAction} 
        onCancel={onCancel}
        onComplete={(data) => onAction('completed', data)} 
      />

    </CollapsiblePanel>
  );
};

const TrackingInfoPanel = ({ ride, user, profile, onAction, onCancel, onChat, isLoading }) => {
  
  if (!ride || !user || !profile) {
    return <SearchingPanel onCancel={onCancel} isLoading={isLoading} ride={ride} />;
  }
  
  const isDriver = profile.user_type === 'driver';

  if (ride.status === 'searching' && !isDriver) {
     return <SearchingPanel onCancel={onCancel} isLoading={isLoading} ride={ride} />;
  }

  return (
    <ErrorBoundary>
      {isDriver ? (
        <DriverPanel ride={ride} onAction={onAction} onCancel={(reason) => onCancel(reason)} onChat={onChat} isLoading={isLoading} />
      ) : (
        <PassengerPanel ride={ride} onCancel={onCancel} onChat={onChat} isLoading={isLoading} />
      )}
    </ErrorBoundary>
  );
};

export default TrackingInfoPanel;