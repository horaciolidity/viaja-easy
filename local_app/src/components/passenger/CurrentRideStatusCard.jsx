import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Car, MapPin, Loader2, Flag, User, AlertTriangle, Clock, Navigation, Star, ShieldCheck, Timer } from 'lucide-react';
    import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
    import PassengerValidationInfo from '@/components/tracking/PassengerValidationInfo';
    import { useLocation } from '@/contexts/LocationContext';
    import { formatDuration } from '@/utils/geolocation';

    const statusInfo = {
      searching: { icon: Loader2, text: "Buscando conductor...", color: "text-amber-500", bgColor: "bg-amber-50 border-amber-200", animate: true },
      pending: { icon: Loader2, text: "Buscando conductor...", color: "text-amber-500", bgColor: "bg-amber-50 border-amber-200", animate: true },
      driver_assigned: { icon: Car, text: "Tu conductor está en camino.", color: "text-blue-500", bgColor: "bg-blue-50 border-blue-200" },
      accepted: { icon: Car, text: "Tu conductor está en camino.", color: "text-blue-500", bgColor: "bg-blue-50 border-blue-200" },
      driver_arriving: { icon: Navigation, text: "Tu conductor está llegando.", color: "text-orange-500", bgColor: "bg-orange-50 border-orange-200" },
      driver_arrived: { icon: User, text: "Tu conductor ha llegado.", color: "text-green-500", bgColor: "bg-green-50 border-green-200" },
      in_progress: { icon: Flag, text: "Viaje en curso. ¡Disfruta!", color: "text-purple-500", bgColor: "bg-purple-50 border-purple-200" },
      cancelled: { icon: AlertTriangle, text: "El viaje fue cancelado.", color: "text-red-500", bgColor: "bg-red-50 border-red-200" },
      cancelled_by_driver: { icon: AlertTriangle, text: "El viaje fue cancelado por el conductor.", color: "text-red-500", bgColor: "bg-red-50 border-red-200" },
      cancelled_by_passenger: { icon: AlertTriangle, text: "Has cancelado el viaje.", color: "text-red-500", bgColor: "bg-red-50 border-red-200" },
    };

    const DriverInfo = ({ driver, eta }) => {
      if (!driver) return null;
      const vehicle = driver.vehicle_info || {};
      
      const handleImageError = (e) => {
        e.target.onerror = null; 
        e.target.src = '/images/default-avatar.png';
      };

      return (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Avatar className="w-16 h-16 border-4 border-white shadow-lg dark:border-slate-800">
            <AvatarImage src={driver.avatar_url || '/images/default-avatar.png'} alt={driver.full_name || 'Conductor'} onError={handleImageError} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
              {driver.full_name?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <p className="font-bold text-slate-800 dark:text-slate-100">{driver.full_name}</p>
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <Star className="w-4 h-4 text-yellow-400 mr-1" />
              <span>{driver.rating?.toFixed(1) || 'Nuevo'}</span>
            </div>
            {eta && (
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <Timer className="w-4 h-4 text-blue-500 mr-1" />
                    <span>Llega en {formatDuration(eta * 60)}</span>
                </div>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{vehicle.brand} {vehicle.model}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{vehicle.color}</p>
            {vehicle.plate && <p className="text-sm font-mono bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded mt-1">{vehicle.plate}</p>}
          </div>
        </div>
      );
    };

    const CurrentRideStatusCard = ({ ride }) => {
      const navigate = useNavigate();
      const { calculateRoute } = useLocation();
      const [eta, setEta] = useState(null);

      useEffect(() => {
        const fetchETA = async () => {
          if (ride?.driver_last_location && ride?.origin_lat && ['driver_assigned', 'accepted'].includes(ride.status)) {
            try {
              const routeInfo = await calculateRoute(
                { lat: ride.driver_last_location.lat, lng: ride.driver_last_location.lng },
                { lat: ride.origin_lat, lng: ride.origin_lng }
              );
              if (routeInfo && routeInfo.duration) {
                setEta(routeInfo.duration);
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
        const interval = setInterval(fetchETA, 30000); // Recalculate every 30 seconds
        return () => clearInterval(interval);

      }, [ride?.driver_last_location, ride?.origin_lat, ride?.status, calculateRoute]);

      if (!ride) return null;

      const { icon: Icon, text, color, bgColor, animate } = statusInfo[ride.status] || { 
        icon: MapPin, 
        text: "Estado desconocido", 
        color: "text-gray-500", 
        bgColor: "bg-gray-50 border-gray-200" 
      };

      const driver = ride.driver;
      const showValidation = ride.driver_id && ['driver_assigned', 'driver_arriving', 'driver_arrived', 'accepted'].includes(ride.status);

      const titleOrigen = ride.origin_address ?? '—';
      const titleDestino = ride.destination_address ?? '—';

      return (
        <motion.div
          layout
          initial={{ opacity: 0, y: 50, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 50, height: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={`${bgColor} rounded-2xl shadow-xl p-6 border-2 dark:bg-slate-800 dark:border-slate-700`}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className={`p-3 rounded-full ${bgColor.replace('50', '100')} dark:bg-slate-700 shadow-md`}
                >
                  <Icon className={`w-8 h-8 ${color} ${animate ? 'animate-spin' : ''}`} />
                </motion.div>
                <div>
                  <div className={`flex items-center gap-2 text-xl font-bold ${color} mb-1`}>
                    <span>{text}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate(`/tracking/${ride.id}`)} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Ver en Mapa
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-600">
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>Origen: {titleOrigen?.split(',')[0]}</span>
                </div>
                <div className="flex items-center">
                  <Flag className="w-4 h-4 mr-1" />
                  <span>Destino: {titleDestino?.split(',')[0]}</span>
                </div>
              </div>
            </div>

            {driver && <DriverInfo driver={driver} eta={eta}/>}
            {showValidation && <PassengerValidationInfo ride={ride} />}
          </div>
        </motion.div>
      );
    };

    export default CurrentRideStatusCard;