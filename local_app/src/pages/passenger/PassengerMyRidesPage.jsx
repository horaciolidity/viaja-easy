import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2, Filter, ChevronDown, X,
  MapPin, Flag, Calendar, DollarSign, Route as RouteIcon, Timer,
  User, Shield, FileText, Hourglass, AlertTriangle, XCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { formatDistance, formatDuration } from '@/utils/geolocation';
import PassengerValidationInfo from '@/components/tracking/PassengerValidationInfo';

const statusConfig = {
  searching: { text: 'Buscando', color: 'bg-yellow-500', icon: <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> },
  driver_assigned: { text: 'Conductor asignado', color: 'bg-blue-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  accepted: { text: 'Conductor asignado', color: 'bg-blue-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  driver_arriving: { text: 'En camino', color: 'bg-blue-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  driver_arrived: { text: 'Conductor en puerta', color: 'bg-indigo-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  in_progress: { text: 'En curso', color: 'bg-purple-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  completed: { text: 'Completado', color: 'bg-green-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  cancelled_by_passenger: { text: 'Cancelado por ti', color: 'bg-red-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  cancelled_by_driver: { text: 'Cancelado por conductor', color: 'bg-red-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  cancelled: { text: 'Cancelado', color: 'bg-red-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  pending: { text: 'Pendiente', color: 'bg-orange-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  scheduled: { text: 'Programado', color: 'bg-cyan-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  confirmed: { text: 'Confirmado', color: 'bg-cyan-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
  default: { text: 'Desconocido', color: 'bg-gray-500', icon: <span className="inline-block w-3 h-3 mr-1.5" /> },
};

const RideTypeBadge = ({ type }) => {
  const map = {
    now: { text: 'Inmediato', className: 'bg-blue-100 text-blue-800' },
    ride: { text: 'Inmediato', className: 'bg-blue-100 text-blue-800' },
    scheduled: { text: 'Programado', className: 'bg-purple-100 text-purple-800' },
    hourly: { text: 'Por Hora', className: 'bg-orange-100 text-orange-800' },
    package: { text: 'Envío', className: 'bg-emerald-100 text-emerald-800' },
    shared: { text: 'Compartido', className: 'bg-teal-100 text-teal-800' },
  };
  const cfg = map[type] || { text: type, className: 'bg-slate-100 text-slate-800' };
  return <Badge variant="outline" className={`border-0 ${cfg.className}`}>{cfg.text}</Badge>;
};

const FILTER_TYPES = [
  { key: 'all', label: 'Todos' },
  { key: 'now', label: 'Inmediato' },
  { key: 'scheduled', label: 'Programado' },
  { key: 'hourly', label: 'Por Hora' },
  { key: 'package', label: 'Envíos' },
  { key: 'shared', label: 'Compartidos' },
];
const FILTER_STATUS = [
  { key: 'any', label: 'Cualquier estado' },
  { key: 'active', label: 'Activos' },
  { key: 'completed', label: 'Completados' },
  { key: 'cancelled', label: 'Cancelados' },
];

const nz = (v) => (v === undefined ? null : v);

function statusMatchesFilter(status, filterKey) {
  if (filterKey === 'any') return true;
  if (filterKey === 'completed') return status === 'completed';
  if (filterKey === 'cancelled') return (status?.startsWith('cancelled') || status === 'cancelled');
  if (filterKey === 'active') return !['completed', 'cancelled', 'cancelled_by_driver', 'cancelled_by_passenger'].includes(status);
  return true;
}

function isDriverVisible(ride) {
  const visibleStatuses = ['driver_assigned', 'accepted', 'driver_arriving', 'driver_arrived', 'in_progress'];
  if (visibleStatuses.includes(ride.status)) return true;
  if (ride.ride_type === 'scheduled' && ride.driver_id) return true;
  return false;
}

function normalizeNow(row) {
  return {
    id: row.id, ride_type: 'now', status: row.status ?? 'pending',
    origin_address: row.origin_address ?? '—', destination_address: row.destination_address ?? '—',
    created_at: row.created_at,
    estimated_distance_km: nz(row.estimated_distance_km ?? row.estimated_distance),
    estimated_duration_min: nz(row.estimated_duration_min ?? row.estimated_duration),
    actual_distance_km: nz(row.actual_distance_km ?? row.actual_distance),
    actual_duration_min: nz(row.actual_duration_min ?? row.actual_duration),
    fare_estimated: nz(row.fare_estimated), actual_fare: nz(row.actual_fare),
    driver_id: row.driver_id, driver: row.driver || null,
  };
}
function normalizeScheduled(row) {
  return {
    id: row.id, ride_type: 'scheduled', status: row.status ?? 'scheduled',
    origin_address: row.origin_address ?? '—', destination_address: row.destination_address ?? '—',
    scheduled_pickup_time: row.scheduled_pickup_time, created_at: row.created_at,
    estimated_distance_km: nz(row.estimated_distance ?? row.estimated_distance_km),
    estimated_duration_min: nz(row.estimated_duration ?? row.estimated_duration_min),
    fare_estimated: nz(row.fare_estimated), actual_fare: nz(row.actual_fare),
    driver_id: row.driver_id, driver: row.driver || null,
  };
}
function normalizeHourly(row) {
  return {
    id: row.id, ride_type: 'hourly', status: row.status ?? 'pending',
    origin_address: row.start_location_address ?? '—', destination_address: row.destination_address ?? '—',
    start_datetime: row.start_datetime, created_at: row.created_at,
    estimated_distance_km: nz(row.estimated_distance_km), actual_distance_km: nz(row.actual_distance_km),
    actual_duration_min: nz(row.actual_duration_min), total_fare: nz(row.total_fare),
    driver_id: row.driver_id, driver: row.driver || null,
  };
}
function normalizePackage(row) {
  return {
    id: row.id, ride_type: 'package', status: row.status ?? 'pending',
    origin_address: row.pickup_address ?? '—', destination_address: row.delivery_address ?? '—',
    created_at: row.created_at, fare_estimated: nz(row.fare_estimated),
    driver_id: row.driver_id, driver: row.driver || null,
  };
}
function normalizeShared(res, rideMap) {
  const sr = rideMap.get(res.shared_ride_id) || {};
  return {
    id: res.id, ride_type: 'shared', status: res.status ?? 'pending',
    origin_address: sr.origin_address ?? '—', destination_address: sr.destination_address ?? '—',
    departure_time: sr.departure_time, created_at: res.created_at,
    total_paid: res.total_paid, driver_id: sr.driver_id ?? null, driver: res.driver || null,
  };
}

const RideCard = ({ ride, onCancelled }) => {
  const navigate = useNavigate();
  const { text, color, icon } = statusConfig[ride.status] || statusConfig.default;
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  const terminalStatuses = ['completed', 'cancelled', 'cancelled_by_driver', 'cancelled_by_passenger'];
  const handleClick = () => {
    if (ride.ride_type === 'shared' && !terminalStatuses.includes(ride.status)) {
      navigate(`/ride/shared/${ride.id}`); return;
    }
    if (terminalStatuses.includes(ride.status)) {
      const type = ride.ride_type || 'now';
      navigate(`/ride-history/${type}/${ride.id}`); return;
    }
    navigate(`/ride/${ride.ride_type || 'now'}/${ride.id}`);
  };

  const fare = (ride.total_fare ?? ride.actual_fare ?? ride.fare_estimated ?? ride.total_paid ?? 0);
  const distance = ride.actual_distance_km ?? ride.estimated_distance_km ?? ride.actual_distance ?? ride.estimated_distance;
  const duration = ride.actual_duration_min ?? ride.estimated_duration_min ?? ride.actual_duration ?? ride.estimated_duration;
  const vehicle = ride.driver?.vehicle_info;
  const pickupTime = ride.created_at || ride.scheduled_pickup_time || ride.departure_time || ride.start_datetime;

  const canShowDriver = isDriverVisible(ride);
  const canCancel = !terminalStatuses.includes(ride.status);

  const cancelRide = async (e) => {
    e.stopPropagation();
    if (!canCancel) return;
    try {
      setCancelling(true);
      const { error } = await supabase.rpc('cancel_ride', {
        p_ride_id: ride.id,
        p_ride_type: ride.ride_type, // Pass the actual ride_type
        p_reason: 'Cancelado por pasajero'
      });
      if (error) throw error;
      toast({ title: 'Viaje cancelado', description: 'Se devolvió el saldo a tu billetera.' });
      onCancelled();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'No se pudo cancelar el viaje.', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow" onClick={handleClick}>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center text-sm text-slate-500 gap-2">
              <Calendar className="w-4 h-4" />
              <span>{pickupTime ? new Date(pickupTime).toLocaleString('es-AR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Fecha desconocida'}</span>
              <RideTypeBadge type={ride.ride_type} />
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${color} text-white text-xs`}>{icon}{text}</Badge>
              {canCancel && (
                <Button size="sm" variant="destructive" className="gap-1" onClick={cancelRide} disabled={cancelling}>
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 text-green-500 shrink-0" />
              <span className="text-slate-700">{ride.origin_address ?? '—'}</span>
            </div>
            <div className="flex items-start">
              <Flag className="w-4 h-4 mr-2 mt-0.5 text-red-500 shrink-0" />
              <span className="text-slate-700">{ride.destination_address ?? '—'}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-green-500" />{formatCurrencyARS(fare)}</div>
              {distance != null && <div className="flex items-center gap-1"><RouteIcon className="w-3 h-3 text-blue-500" />{formatDistance(distance)}</div>}
              {duration != null && <div className="flex items-center gap-1"><Timer className="w-3 h-3 text-purple-500" />{formatDuration(duration)}</div>}
            </div>

            {canShowDriver && ride.driver && (
              <div className="flex items-center justify-between text-xs text-slate-700 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span className="font-medium">{ride.driver.full_name}</span>
                </div>
                {vehicle && (
                  <div className="flex items-center gap-2 font-medium">
                    <Shield className="w-3 h-3" />
                    <span>{`${vehicle.brand ?? ''} ${vehicle.model ?? ''}`.trim()} {vehicle?.plate && <em className="not-italic text-slate-500">- ***{String(vehicle.plate).slice(-3)}</em>}</span>
                  </div>
                )}
              </div>
            )}

            {canShowDriver && ['driver_assigned', 'driver_arriving', 'driver_arrived', 'accepted'].includes(ride.status) && (
              <div onClick={(e) => e.stopPropagation()} className="pt-2">
                <PassengerValidationInfo ride={ride} />
              </div>
            )}

            {(ride.cancel_penalty > 0 || ride.wait_fee > 0) && (
              <div className="flex items-center justify-between text-xs text-orange-600 pt-2 border-t border-slate-100">
                {ride.cancel_penalty > 0 && <div className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /><span>Penalización: {formatCurrencyARS(ride.cancel_penalty)}</span></div>}
                {ride.wait_fee > 0 && <div className="flex items-center gap-1.5"><Hourglass className="w-3 h-3" /><span>Espera: {formatCurrencyARS(ride.wait_fee)}</span></div>}
              </div>
            )}

            {ride.cancel_reason && (
              <div className="flex items-start text-xs text-slate-500 pt-2">
                <FileText className="w-3 h-3 mr-1.5 mt-0.5 shrink-0" />
                <p className="italic">Motivo: {ride.cancel_reason}</p>
              </div>
            )}
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PassengerMyRidesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openFilters, setOpenFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('any');

  const resetFilters = () => { setTypeFilter('all'); setStatusFilter('any'); };

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const qNow = supabase.from('rides').select('*, driver:profiles!rides_driver_id_fkey(full_name, avatar_url, avatar_path, vehicle_info)').eq('passenger_id', user.id);
      const qScheduled = supabase.from('scheduled_rides').select('*, driver:profiles!scheduled_rides_driver_id_fkey(full_name, avatar_url, avatar_path, vehicle_info)').eq('passenger_id', user.id);
      const qHourly = supabase.from('hourly_bookings').select('*, driver:profiles!hourly_bookings_driver_id_fkey(full_name, avatar_url, avatar_path, vehicle_info)').eq('passenger_id', user.id);
      const qPackage = supabase.from('package_deliveries').select('*, driver:profiles!package_deliveries_user_id_fkey(full_name, avatar_url, avatar_path, vehicle_info)').eq('passenger_id', user.id);
      const qSharedRes = supabase.from('shared_ride_reservations').select('*, shared_ride:shared_rides(*)').eq('passenger_id', user.id);

      const [r1, r2, r3, r4, r5] = await Promise.all([qNow, qScheduled, qHourly, qPackage, qSharedRes]);
      for (const r of [r1, r2, r3, r4, r5]) if (r.error) throw r.error;

      let sharedRideMap = new Map();
      if ((r5.data || []).length) {
        const ids = Array.from(new Set((r5.data || []).map((x) => x.shared_ride_id).filter(Boolean)));
        if (ids.length) {
          const rSR = await supabase.from('shared_rides').select('*, driver:profiles!shared_rides_driver_id_fkey(full_name, avatar_url, avatar_path, vehicle_info)').in('id', ids);
          if (rSR.error) throw rSR.error;
          sharedRideMap = new Map((rSR.data || []).map((x) => [x.id, x]));
        }
      }

      const merged = [
        ...(r1.data || []).map(normalizeNow),
        ...(r2.data || []).map(normalizeScheduled),
        ...(r3.data || []).map(normalizeHourly),
        ...(r4.data || []).map(normalizePackage),
        ...(r5.data || []).map((res) => {
          const it = normalizeShared(res, sharedRideMap);
          it.driver = sharedRideMap.get(res.shared_ride_id)?.driver || null;
          return it;
        }),
      ].sort((a, b) => {
        const aT = new Date(a.created_at || a.scheduled_pickup_time || a.departure_time || a.start_datetime || 0).getTime();
        const bT = new Date(b.created_at || b.scheduled_pickup_time || b.departure_time || b.start_datetime || 0).getTime();
        return bT - aT;
      });

      setItems(merged);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error al cargar viajes', description: 'No se pudieron cargar tus viajes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('passenger-my-rides')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides', filter: `passenger_id=eq.${user.id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_rides', filter: `passenger_id=eq.${user.id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hourly_bookings', filter: `passenger_id=eq.${user.id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'package_deliveries', filter: `passenger_id=eq.${user.id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_ride_reservations', filter: `passenger_id=eq.${user.id}` }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchAll]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const typeOK = typeFilter === 'all' ? true : it.ride_type === typeFilter || (typeFilter === 'now' && it.ride_type === 'ride');
      const statusOK = statusMatchesFilter(it.status, statusFilter);
      return typeOK && statusOK;
    });
  }, [items, typeFilter, statusFilter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Mis Viajes</h1>
        <Button variant="outline" size="sm" onClick={() => setOpenFilters(v => !v)} className="gap-1">
          <Filter className="w-4 h-4" /> Filtros <ChevronDown className={`w-4 h-4 transition-transform ${openFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {openFilters && (
        <Card className="p-3">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {FILTER_TYPES.map((t) => (
              <Button key={t.key} size="sm" variant={typeFilter === t.key ? 'default' : 'outline'} onClick={() => setTypeFilter(t.key)}>{t.label}</Button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {FILTER_STATUS.map((s) => (
              <Button key={s.key} size="sm" variant={statusFilter === s.key ? 'default' : 'outline'} onClick={() => setStatusFilter(s.key)}>{s.label}</Button>
            ))}
            <Button size="sm" variant="ghost" onClick={resetFilters}><X className="w-4 h-4 mr-1" />Quitar filtros</Button>
          </div>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <div className="flex justify-center items-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredItems.map((ride) => (
              <RideCard key={`${ride.ride_type}-${ride.id}`} ride={ride} onCancelled={fetchAll} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-slate-500">No hay viajes que coincidan con el filtro.</p>
          <Button className="mt-3" variant="outline" onClick={resetFilters}>Quitar filtros</Button>
        </div>
      )}
    </div>
  );
};

export default PassengerMyRidesPage;