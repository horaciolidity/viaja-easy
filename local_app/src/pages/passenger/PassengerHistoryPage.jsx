
import React, { useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { useAuth } from '@/contexts/AuthContext';
    import { useRide } from '@/contexts/RideContext';
    import { Loader2, Car, Calendar, MapPin, Star, Meh, Frown, Smile } from 'lucide-react';
    import { formatCurrencyARS } from '@/utils/mercadoPago';

    const RideStatusBadge = ({ status }) => {
      const statusStyles = {
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
      };
      const statusText = {
        completed: 'Completado',
        cancelled: 'Cancelado',
      };
      return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
          {statusText[status] || status}
        </span>
      );
    };

    const RatingIcon = ({ rating }) => {
      if (rating >= 4) return <Smile className="w-5 h-5 text-green-500" />;
      if (rating >= 2) return <Meh className="w-5 h-5 text-amber-500" />;
      return <Frown className="w-5 h-5 text-red-500" />;
    };

    const PassengerHistoryPage = () => {
      const { user } = useAuth();
      const { rideHistory, loading } = useRide();

      const passengerRides = useMemo(() => {
        if (!user || !rideHistory) return [];
        return rideHistory
          .filter(ride => ride.passenger_id === user.id)
          .sort((a, b) => new Date(b.completed_at || b.cancelled_at) - new Date(a.completed_at || a.cancelled_at));
      }, [user, rideHistory]);

      if (loading) {
        return (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Mis Viajes</h1>
          
          {passengerRides.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm">
              <Car className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
              <h2 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-200">No has realizado viajes</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tu historial de viajes aparecerá aquí.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {passengerRides.map(ride => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {new Date(ride.completed_at || ride.cancelled_at).toLocaleDateString('es-ES', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <RideStatusBadge status={ride.status} />
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mt-1 mr-2 text-green-500" />
                      <div>
                        <p className="text-xs text-slate-500">Desde</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{ride.origin_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mt-1 mr-2 text-red-500" />
                      <div>
                        <p className="text-xs text-slate-500">Hasta</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{ride.destination_address}</p>
                      </div>
                    </div>
                  </div>
                  {ride.status === 'completed' && (
                    <div className="border-t border-slate-200 dark:border-slate-700 mt-3 pt-3 flex justify-between items-center">
                      <div className="font-bold text-lg text-green-600 dark:text-green-400">
                        {formatCurrencyARS(ride.actual_fare)}
                      </div>
                      <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                        <span className="text-sm">Tu calificación:</span>
                        {ride.driver_rating ? (
                           <div className="flex items-center font-semibold">
                             <Star className="w-5 h-5 mr-1 text-amber-400 fill-current" />
                             <span>{ride.driver_rating.toFixed(1)}</span>
                           </div>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      );
    };

    export default PassengerHistoryPage;
