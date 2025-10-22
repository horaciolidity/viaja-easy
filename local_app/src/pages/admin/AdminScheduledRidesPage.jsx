import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, MapPin, CalendarDays, Clock, Eye, Loader2, User, Car, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AdminScheduledRidesPage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchScheduledRides = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_rides')
        .select(`
          *,
          passenger:passenger_id ( full_name ),
          driver:driver_id ( full_name ),
          vehicle_type:vehicle_type_id ( name )
        `)
        .order('scheduled_pickup_time', { ascending: true });

      if (error) throw error;
      setRides(data);
    } catch (error) {
      console.error("Error fetching scheduled rides:", error);
      toast({ title: "Error al cargar viajes programados", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledRides();
  }, []);

  const handleCancelRide = async (rideId) => {
    const isConfirmed = window.confirm("¿Estás seguro de que quieres cancelar este viaje? Esta acción no se puede deshacer.");
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from('scheduled_rides')
        .update({ status: 'cancelled_by_admin' })
        .eq('id', rideId);

      if (error) throw error;
      toast({ title: "Viaje Cancelado", description: "El viaje programado ha sido cancelado por el administrador." });
      fetchScheduledRides(); // Refresh list
    } catch (error) {
      toast({ title: "Error", description: `No se pudo cancelar el viaje: ${error.message}`, variant: "destructive" });
    }
  };

  const filteredRides = rides.filter(ride =>
    ride.passenger?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.driver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.origin_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.destination_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusClasses = {
      scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
      accepted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      cancelled_by_passenger: 'bg-red-100 text-red-700 border-red-200',
      cancelled_by_driver: 'bg-red-100 text-red-700 border-red-200',
      cancelled_by_admin: 'bg-red-100 text-red-700 border-red-200',
      default: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    const statusText = {
      scheduled: 'Programado',
      accepted: 'Aceptado',
      completed: 'Completado',
      cancelled_by_passenger: 'Cancelado (Pasajero)',
      cancelled_by_driver: 'Cancelado (Conductor)',
      cancelled_by_admin: 'Cancelado (Admin)',
    };
    const className = statusClasses[status] || statusClasses.default;
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${className}`}>{statusText[status] || status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-slate-600">Cargando viajes programados...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">Viajes Programados</h2>
        <div className="relative w-full sm:w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <Input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Pasajero', 'Conductor', 'Ruta', 'Fecha y Hora', 'Vehículo', 'Estado', 'Acciones'].map(header => (
                <th key={header} className="text-left py-3 px-4 font-semibold text-slate-600">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRides.map((ride) => (
              <tr key={ride.id}>
                <td className="py-3 px-4 flex items-center gap-2"><User className="w-4 h-4 text-slate-500" />{ride.passenger?.full_name || 'N/A'}</td>
                <td className="py-3 px-4">{ride.driver?.full_name || <span className="text-slate-500 italic">Sin asignar</span>}</td>
                <td className="py-3 px-4 max-w-xs">
                  <p className="truncate" title={ride.origin_address}>De: {ride.origin_address}</p>
                  <p className="truncate" title={ride.destination_address}>A: {ride.destination_address}</p>
                </td>
                <td className="py-3 px-4">
                  {format(new Date(ride.scheduled_pickup_time), "dd/MM/yyyy HH:mm", { locale: es })}hs
                </td>
                <td className="py-3 px-4">{ride.vehicle_type?.name || 'N/A'}</td>
                <td className="py-3 px-4">{getStatusBadge(ride.status)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-200"><Eye className="w-4 h-4" /></Button>
                    {!ride.status.startsWith('cancelled') && ride.status !== 'completed' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={() => handleCancelRide(ride.id)}>
                            <XCircle className="w-4 h-4" />
                        </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredRides.length === 0 && <p className="text-center py-8 text-slate-500">No se encontraron viajes programados.</p>}
    </motion.div>
  );
};

export default AdminScheduledRidesPage;