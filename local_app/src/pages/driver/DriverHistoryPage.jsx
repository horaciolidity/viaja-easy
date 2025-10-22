import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import {
  Loader2, Car, Calendar, MapPin, Star, Clock, User, DollarSign,
  Route as RouteIcon, Timer, Bike, XCircle
} from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { formatDistance, formatDuration } from '@/utils/geolocation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const RideStatusBadge = ({ status }) => {
  const statusStyles = {
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    cancelled_by_passenger: 'bg-yellow-100 text-yellow-800',
    cancelled_by_driver: 'bg-red-100 text-red-800',
    searching: 'bg-yellow-100 text-yellow-800',
    driver_assigned: 'bg-blue-100 text-blue-800',
    accepted: 'bg-blue-100 text-blue-800',
    driver_arriving: 'bg-orange-100 text-orange-800',
    driver_arrived: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
  };
  const statusText = {
    completed: 'Completado',
    cancelled: 'Cancelado',
    cancelled_by_passenger: 'Cancelado (Pasajero)',
    cancelled_by_driver: 'Cancelado por Mí',
    searching: 'Buscando Conductor',
    driver_assigned: 'Asignado',
    accepted: 'Aceptado',
    driver_arriving: 'En camino',
    driver_arrived: 'En el origen',
    in_progress: 'En progreso',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {statusText[status] || status}
    </span>
  );
};

const VehicleIcon = ({ vehicleName }) =>
  (vehicleName === 'Moto' ? <Bike className="w-4 h-4 text-slate-500" /> : <Car className="w-4 h-4 text-slate-500" />);

const ACTIVE_STATUS = ['driver_assigned', 'accepted', 'driver_arriving', 'driver_arrived', 'in_progress'];

const RideCard = ({ ride, onCancelled }) => {
  const distance = ride.actual_distance || ride.estimated_distance;
  const duration = ride.actual_duration || ride.estimated_duration;
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  const showPassenger = ACTIVE_STATUS.includes(ride.status);

  const canCancel = !['completed', 'cancelled', 'cancelled_by_passenger', 'cancelled_by_driver'].includes(ride.status);

  const cancelRide = async () => {
    if (!canCancel) return;
    try {
      setCancelling(true);
      const { error } = await supabase.rpc('driver_cancel_ride_and_refund', {
        p_source_table: 'rides',
        p_ride_id: ride.id,
        p_reason: 'Cancelado por conductor'
      });
      if (error) throw error;
      toast({ title: 'Viaje cancelado', description: 'Se devolvió el saldo a la billetera del pasajero.' });
      onCancelled();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'No se pudo cancelar el viaje.', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <div className="flex items-center mb-2 sm:mb-0">
          <Calendar className="w-4 h-4 mr-2 text-slate-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {new Date(ride.created_at || ride.start_datetime || ride.scheduled_pickup_time).toLocaleString('es-AR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <RideStatusBadge status={ride.status} />
          {canCancel && (
            <Button size="sm" variant="destructive" onClick={cancelRide} disabled={cancelling} className="gap-1">
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {showPassenger ? (
              <>
                <User className="w-4 h-4 mr-2 text-slate-500" />
                <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                  Pasajero: {ride.passenger?.full_name || 'N/A'}
                </span>
              </>
            ) : (
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-slate-500" />
                <span className="text-sm text-slate-500">Pasajero</span>
              </div>
            )}
          </div>
          {ride.vehicle_types?.name && (
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
              <VehicleIcon vehicleName={ride.vehicle_types.name} />
              <span className="ml-1.5">{ride.vehicle_types.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-start">
          <MapPin className="w-4 h-4 mt-0.5 mr-2 text-green-500" />
          <span className="text-sm text-slate-600 dark:text-slate-300">{ride.origin_address || ride.start_location_address || ride.pickup_address}</span>
        </div>
        <div className="flex items-start">
          <MapPin className="w-4 h-4 mt-0.5 mr-2 text-red-500" />
          <span className="text-sm text-slate-600 dark:text-slate-300">{ride.destination_address || ride.description || ride.delivery_address}</span>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 mt-3 pt-3 flex justify-between items-center">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-green-500" /> {formatCurrencyARS(ride.driver_earnings || 0)} (Ganancia)</div>
          <div className="flex items-center gap-1"><RouteIcon className="w-4 h-4 text-blue-500" /> {formatDistance(distance)}</div>
          <div className="flex items-center gap-1"><Timer className="w-4 h-4 text-purple-500" /> {formatDuration(duration)}</div>
        </div>
        {ride.status === 'completed' ? (
          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
            <span className="text-sm">Calificación:</span>
            {ride.passenger_rating ? (
              <div className="flex items-center font-semibold">
                <Star className="w-5 h-5 mr-1 text-amber-400 fill-current" />
                <span>{ride.passenger_rating.toFixed(1)}</span>
              </div>
            ) : <span className="text-sm text-slate-400">N/A</span>}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

const DriverHistoryPage = () => {
  const { user } = useAuth();
  const { allUserRides, loading, loadUserRides } = useRide();

  useEffect(() => { if (user) loadUserRides(); }, [user, loadUserRides]);

  const { activeRides, historicalRides } = useMemo(() => {
    if (!user || !allUserRides) return { activeRides: [], historicalRides: [] };
    const active = allUserRides.filter((r) => !['completed', 'cancelled', 'cancelled_by_passenger', 'cancelled_by_driver'].includes(r.status));
    const history = allUserRides.filter((r) => ['completed', 'cancelled', 'cancelled_by_passenger', 'cancelled_by_driver'].includes(r.status));
    return { activeRides: active, historicalRides: history };
  }, [user, allUserRides]);

  const refresh = () => loadUserRides();

  if (loading && allUserRides.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Mis Viajes</h1>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Activos ({activeRides.length})</TabsTrigger>
          <TabsTrigger value="history">Historial ({historicalRides.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="pt-4">
          <div className="space-y-4">
            {activeRides.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm">
                <Car className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
                <h3 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-200">No tienes viajes activos</h3>
              </div>
            ) : activeRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} onCancelled={refresh} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <div className="space-y-4">
            {historicalRides.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm">
                <Car className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" />
                <h3 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-200">No hay viajes en tu historial</h3>
              </div>
            ) : historicalRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} onCancelled={refresh} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default DriverHistoryPage;