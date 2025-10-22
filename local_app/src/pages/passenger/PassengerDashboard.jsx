
import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { MapPin, Car, Clock, Shield, AlertTriangle } from 'lucide-react';
    import LocationInput from '@/components/common/LocationInput';
    import SavedPlaces from '@/components/passenger/SavedPlaces';
    import { Button } from '@/components/ui/button';
    import { useAuth } from '@/contexts/AuthContext';
    import { useLocation } from '@/contexts/LocationContext';
    import { useRide } from '@/contexts/RideContext';
    import SuspendedAccountNotice from '@/components/common/SuspendedAccountNotice';
    import { formatCurrencyARS } from '@/utils/mercadoPago';
    
    const PassengerDashboard = () => {
      const navigate = useNavigate();
      const { profile } = useAuth();
      const { setDestinationForRoute } = useLocation();
      const { currentRide } = useRide();
    
      const [destination, setDestination] = useState(null);
    
      const handleSelectDestination = (place) => {
        setDestination(place);
      };
    
      const handleConfirmDestination = () => {
        if (destination) {
          setDestinationForRoute(destination);
          navigate('/booking');
        }
      };

      if (profile?.accountBlocked || profile?.status === 'suspended') {
        return <SuspendedAccountNotice />;
      }
    
      if(currentRide && !['completed', 'cancelled', 'cancelled_by_driver', 'cancelled_by_passenger'].includes(currentRide.status)) {
        navigate(`/tracking/${currentRide.id}`);
        return null;
      }
    
      return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
          <div className="flex-grow p-4 md:p-6 lg:p-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 md:p-8 shadow-2xl text-white"
            >
              <h1 className="text-2xl md:text-3xl font-bold mb-2">¡Hola, {profile?.full_name?.split(' ')[0] || 'Pasajero'}!</h1>
              <p className="text-lg opacity-90 mb-6">¿Listo para tu próximo viaje?</p>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-inner">
                <LocationInput
                  onLocationSelect={handleSelectDestination}
                  placeholder="¿A dónde vamos hoy?"
                  isOrigin={false}
                />
                <Button onClick={handleConfirmDestination} disabled={!destination} className="w-full mt-4 h-12 text-base font-bold">
                  Buscar Viaje
                </Button>
              </div>
            </motion.div>

            {profile?.pending_debt > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg"
                >
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-3" />
                        <div>
                            <h3 className="font-bold">Tenés una deuda pendiente</h3>
                            <p className="text-sm">
                                Tu deuda de {formatCurrencyARS(profile.pending_debt)} se sumará al costo de tu próximo viaje.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
    
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ServiceCard 
                    icon={<Car className="w-6 h-6 text-blue-500" />}
                    title="Viaje Inmediato"
                    description="Pedí un auto ahora y llegá a tu destino."
                    onClick={() => navigate('/booking')}
                />
                <ServiceCard 
                    icon={<Clock className="w-6 h-6 text-purple-500" />}
                    title="Viaje Programado"
                    description="Agendá tu viaje con anticipación."
                    onClick={() => navigate('/schedule-ride')}
                />
                <ServiceCard 
                    icon={<MapPin className="w-6 h-6 text-green-500" />}
                    title="Viaje por Horas"
                    description="Reservá un auto por el tiempo que necesites."
                    onClick={() => navigate('/hourly-ride')}
                />
                <ServiceCard 
                    icon={<Shield className="w-6 h-6 text-orange-500" />}
                    title="Más Servicios"
                    description="Paquetería, viajes compartidos y más."
                    onClick={() => navigate('/services')}
                />
            </div>
    
            <SavedPlaces onSelectPlace={(place) => {
              setDestinationForRoute(place);
              navigate('/booking');
            }} />
          </div>
        </div>
      );
    };

    const ServiceCard = ({ icon, title, description, onClick }) => (
        <motion.div
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 flex flex-col items-start cursor-pointer shadow-md"
            onClick={onClick}
        >
            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full mb-4">
                {icon}
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex-grow">{description}</p>
        </motion.div>
    )
    
    export default PassengerDashboard;
