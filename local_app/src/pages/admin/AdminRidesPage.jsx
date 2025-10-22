import React, { useState, useEffect, useMemo, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { AlertTriangle, Search, ChevronDown, ChevronUp, Loader2, Calendar, Car, Users, Clock, Package, XCircle, Trash2 } from 'lucide-react';
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

    const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);
    const initialLetter = (name) => (name?.trim()?.[0] || '•').toUpperCase();
    async function signedAvatar(urlOrPath) {
      if (!urlOrPath) return null;
      if (isUrl(urlOrPath)) return urlOrPath;
      const { data, error } = await supabase.storage.from('avatars').createSignedUrl(urlOrPath, 3600);
      if (error) { console.warn('Signed URL error:', error); return null; }
      return data?.signedUrl || null;
    }

    const rideTypeMap = {
      rides: { label: 'Inmediato', icon: <Car className="w-4 h-4 mr-2" /> },
      scheduled_rides: { label: 'Programado', icon: <Calendar className="w-4 h-4 mr-2" /> },
      hourly_bookings: { label: 'Por Hora', icon: <Clock className="w-4 h-4 mr-2" /> },
      package_deliveries: { label: 'Paquetería', icon: <Package className="w-4 h-4 mr-2" /> },
      shared_rides: { label: 'Compartido', icon: <Users className="w-4 h-4 mr-2" /> },
    };

    const statusMap = {
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      searching: { label: 'Buscando', className: 'bg-blue-100 text-blue-800' },
      accepted: { label: 'Aceptado', className: 'bg-green-100 text-green-800' },
      driver_arriving: { label: 'Llegando', className: 'bg-indigo-100 text-indigo-800' },
      driver_arrived: { label: 'Conductor en Puerta', className: 'bg-purple-100 text-purple-800' },
      in_progress: { label: 'En Curso', className: 'bg-teal-100 text-teal-800' },
      completed: { label: 'Completado', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Anulado', className: 'bg-red-100 text-red-800' },
      cancelled_by_driver: { label: 'Anulado por Conductor', className: 'bg-red-100 text-red-800' },
      cancelled_by_passenger: { label: 'Anulado por Pasajero', className: 'bg-yellow-100 text-yellow-800' },
      scheduled: { label: 'Programado', className: 'bg-cyan-100 text-cyan-800' },
      collecting_passengers: { label: 'Recogiendo Pasajeros', className: 'bg-orange-100 text-orange-800' },
      picking_up: { label: 'Recogida de Pasajeros', className: 'bg-orange-100 text-orange-800' },
    };

    const AdminRidesPage = () => {
      const [rides, setRides] = useState([]);
      const [loading, setLoading] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
      const [filters, setFilters] = useState({ status: 'all', ride_type: 'all' });
      const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
      const [dialogState, setDialogState] = useState({ isOpen: false, type: null, ride: null });

      const getRideTypeLabel = (ride) => rideTypeMap[ride.source_table] || { label: 'Desconocido', icon: <Car className="w-4 h-4 mr-2" /> };

      const fetchRides = useCallback(async () => {
        setLoading(true);
        try {
          const qRides = supabase.from('rides').select('*, passenger:profiles!rides_passenger_id_fkey(full_name, phone, avatar_url, avatar_path), driver:profiles!rides_driver_id_fkey(full_name, phone, avatar_url, avatar_path, vehicle_info), origin_address, destination_address');
          const qScheduled = supabase.from('scheduled_rides').select('*, passenger:profiles!scheduled_rides_passenger_id_fkey(full_name, phone, avatar_url, avatar_path), driver:profiles!scheduled_rides_driver_id_fkey(full_name, phone, avatar_url, avatar_path, vehicle_info), origin_address, destination_address');
          const qHourly = supabase.from('hourly_bookings').select('*, passenger:profiles!hourly_bookings_passenger_id_fkey(full_name, phone, avatar_url, avatar_path), driver:profiles!hourly_bookings_driver_id_fkey(full_name, phone, avatar_url, avatar_path, vehicle_info), start_location_address, description, created_at');
          const qPackage = supabase.from('package_deliveries').select('*, passenger:profiles!package_deliveries_user_id_fkey(full_name, phone, avatar_url, avatar_path), driver:profiles!package_deliveries_driver_id_fkey(full_name, phone, avatar_url, avatar_path, vehicle_info), pickup_address, delivery_address, created_at');
          const qShared = supabase.from('shared_rides').select('*, driver:profiles!shared_rides_driver_id_fkey(full_name, phone, avatar_url, avatar_path, vehicle_info), origin_address, destination_address, departure_time, seat_price');

          const [r1, r2, r3, r4, r5] = await Promise.all([qRides, qScheduled, qHourly, qPackage, qShared]);

          const all = [];
          if (!r1.error && r1.data) all.push(...r1.data.map(r => ({ ...r, source_table: 'rides' })));
          if (!r2.error && r2.data) all.push(...r2.data.map(r => ({ ...r, source_table: 'scheduled_rides' })));
          if (!r3.error && r3.data) all.push(...r3.data.map(r => ({ ...r, source_table: 'hourly_bookings', origin_address: r.start_location_address, destination_address: r.description })));
          if (!r4.error && r4.data) all.push(...r4.data.map(r => ({ ...r, source_table: 'package_deliveries', origin_address: r.pickup_address, destination_address: r.delivery_address })));
          if (!r5.error && r5.data) all.push(...r5.data.map(r => ({ ...r, source_table: 'shared_rides', created_at: r.departure_time, fare_estimated: r.seat_price })));

          const withAvatars = await Promise.all(all.map(async (it) => {
            const pRaw = it.passenger?.avatar_path || it.passenger?.avatar_url;
            const dRaw = it.driver?.avatar_path || it.driver?.avatar_url;
            const [pUrl, dUrl] = await Promise.all([signedAvatar(pRaw), signedAvatar(dRaw)]);
            return {
              ...it,
              passenger: it.passenger ? { ...it.passenger, avatar_signed_url: pUrl } : null,
              driver: it.driver ? { ...it.driver, avatar_signed_url: dUrl } : null,
            };
          }));

          withAvatars.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setRides(withAvatars);
        } catch (error) {
          console.error("Error fetching rides:", error);
          toast({ title: "Error al cargar los viajes", description: "Hubo un problema al obtener los datos de los viajes.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }, []);

      useEffect(() => { fetchRides(); }, [fetchRides]);

      const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
      };

      const sortedAndFilteredRides = useMemo(() => {
        let filtered = rides.filter(ride => {
          const s = searchTerm.toLowerCase();
          const match =
            (ride.id?.toString() || '').toLowerCase().includes(s) ||
            (ride.passenger?.full_name || '').toLowerCase().includes(s) ||
            (ride.passenger?.phone || '').toLowerCase().includes(s) ||
            (ride.driver?.full_name || '').toLowerCase().includes(s) ||
            (ride.driver?.phone || '').toLowerCase().includes(s) ||
            (ride.origin_address || '').toLowerCase().includes(s) ||
            (ride.destination_address || '').toLowerCase().includes(s);

          const statusOk = filters.status === 'all' || ride.status === filters.status;
          const typeOk = filters.ride_type === 'all' || ride.source_table === filters.ride_type;
          return match && statusOk && typeOk;
        });

        return filtered.sort((a, b) => {
          const aV = a[sortConfig.key];
          const bV = b[sortConfig.key];
          if (aV == null) return 1;
          if (bV == null) return -1;
          if (aV < bV) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aV > bV) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }, [rides, searchTerm, filters, sortConfig]);

      const getStatusBadge = (status) => {
        const info = statusMap[status || ''] || { label: status?.replace(/_/g, ' ') || 'Desconocido', className: 'bg-gray-200 text-gray-800' };
        return <Badge className={`${info.className} py-1 px-3 text-xs capitalize`}>{info.label}</Badge>;
      };

      const AvatarCell = ({ user }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-600 text-sm font-semibold">
            {user?.avatar_signed_url
              ? <img src={user.avatar_signed_url} alt="avatar" className="w-full h-full object-cover" />
              : initialLetter(user?.full_name)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.full_name || 'N/A'}</span>
            {user?.phone && <span className="text-[11px] text-slate-500">{user.phone}</span>}
          </div>
        </div>
      );

      // --- acciones admin ---
      const [workingId, setWorkingId] = useState(null);

      const handleConfirmAction = async () => {
        const { type, ride } = dialogState;
        if (!type || !ride) return;
    
        if (type === 'cancel') {
          await adminCancel(ride);
        } else if (type === 'delete') {
          await adminDelete(ride);
        }
        setDialogState({ isOpen: false, type: null, ride: null });
      };

      const adminCancel = async (ride) => {
        try {
          setWorkingId(`${ride.source_table}-${ride.id}`);
          const { error } = await supabase.rpc('core_cancel_or_delete_and_refund', {
            p_source_table: ride.source_table,
            p_ride_id: ride.id,
            p_reason: 'Cancelado por admin',
            p_actor: 'admin',
            p_hard_delete: false,
          });
          if (error) throw error;
          toast({ title: 'Viaje cancelado', description: 'Se devolvió el saldo a la billetera.' });
          fetchRides();
        } catch (err) {
          toast({ title: 'Error', description: err.message || 'No se pudo cancelar el viaje.', variant: 'destructive' });
        } finally {
          setWorkingId(null);
        }
      };

      const adminDelete = async (ride) => {
        try {
          setWorkingId(`${ride.source_table}-${ride.id}`);
          const { error } = await supabase.rpc('core_cancel_or_delete_and_refund', {
            p_source_table: ride.source_table,
            p_ride_id: ride.id,
            p_reason: 'Borrado por admin',
            p_actor: 'admin',
            p_hard_delete: true,
          });
          if (error) throw error;
          toast({ title: 'Viaje borrado', description: 'Saldo devuelto y registro eliminado.' });
          fetchRides();
        } catch (err) {
          toast({ title: 'Error', description: err.message || 'No se pudo borrar el viaje.', variant: 'destructive' });
        } finally {
          setWorkingId(null);
        }
      };

      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Historial de Viajes</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input placeholder="Buscar por ID, nombre, teléfono..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64" />
              </div>
              <Select value={filters.status} onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(statusMap).map(([k, { label }]) => (<SelectItem key={k} value={k}>{label}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filters.ride_type} onValueChange={(value) => setFilters(f => ({ ...f, ride_type: value }))}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo de Viaje" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {Object.entries(rideTypeMap).map(([k, { label }]) => (<SelectItem key={k} value={k}>{label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: 'created_at', label: 'Fecha' },
                    { key: 'id', label: 'ID Viaje' },
                    { key: 'source_table', label: 'Tipo' },
                    { key: 'passenger_id', label: 'Pasajero' },
                    { key: 'driver_id', label: 'Conductor' },
                    { key: 'origin_address', label: 'Origen' },
                    { key: 'destination_address', label: 'Destino' },
                    { key: 'fare_estimated', label: 'Tarifa' },
                    { key: 'status', label: 'Estado' },
                    { key: 'actions', label: 'Acciones' },
                  ].map(({ key, label }) => (
                    <TableHead key={key} className={key !== 'actions' ? 'cursor-pointer' : ''} onClick={() => key !== 'actions' && handleSort(key)}>
                      <div className="flex items-center gap-2">
                        {label}
                        {sortConfig.key === key && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></TableCell></TableRow>
                ) : sortedAndFilteredRides.map(ride => {
                  const key = `${ride.source_table}-${ride.id}`;
                  const canOperate = !['completed', 'cancelled', 'cancelled_by_driver', 'cancelled_by_passenger'].includes(ride.status);
                  return (
                    <TableRow key={key}>
                      <TableCell>{new Date(ride.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{String(ride.id).slice(0, 8)}</TableCell>
                      <TableCell><span className='flex items-center'>{getRideTypeLabel(ride).icon}{getRideTypeLabel(ride).label}</span></TableCell>
                      <TableCell><AvatarCell user={ride.passenger} /></TableCell>
                      <TableCell><AvatarCell user={ride.driver} /></TableCell>
                      <TableCell className="max-w-xs truncate">{ride.origin_address || '—'}</TableCell>
                      <TableCell className="max-w-xs truncate">{ride.destination_address || '—'}</TableCell>
                      <TableCell>
                        {(ride.fare_estimated ?? ride.total_fare) != null
                          ? (ride.fare_estimated ?? ride.total_fare).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(ride.status)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => setDialogState({ isOpen: true, type: 'cancel', ride })} disabled={workingId === key || !canOperate}>
                            {workingId === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Cancelar
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1"
                            onClick={() => setDialogState({ isOpen: true, type: 'delete', ride })} disabled={workingId === key}>
                            {workingId === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Borrar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && sortedAndFilteredRides.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center py-10 text-slate-500">No se encontraron viajes con los filtros actuales.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <AlertDialog open={dialogState.isOpen} onOpenChange={(isOpen) => !isOpen && setDialogState({ isOpen: false, type: null, ride: null })}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {dialogState.type === 'cancel' ? '¿Cancelar Viaje?' : '¿Borrar Viaje?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {dialogState.type === 'cancel'
                    ? 'Esta acción cancelará el viaje y devolverá cualquier saldo prepagado a la billetera del pasajero. Esta acción no se puede deshacer.'
                    : 'Esta acción eliminará permanentemente el registro del viaje. El saldo (si corresponde) será devuelto. Esta acción es irreversible.'
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cerrar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAction} className={dialogState.type === 'delete' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
                  Confirmar {dialogState.type === 'cancel' ? 'Cancelación' : 'Eliminación'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      );
    };

    export default AdminRidesPage;