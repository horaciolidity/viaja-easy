import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Flag, DollarSign, Route as RouteIcon, Timer, User, Shield, Loader2 } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { formatDistance, formatDuration } from '@/utils/geolocation';
import { toast } from '@/components/ui/use-toast';

// Mapeo simple para mostrar estados bonitos
const statusView = {
  searching: { text: 'Buscando', variant: 'secondary' },
  pending: { text: 'Pendiente', variant: 'secondary' },
  accepted: { text: 'Conductor asignado', variant: 'secondary' },
  driver_assigned: { text: 'Conductor asignado', variant: 'secondary' },
  driver_arriving: { text: 'En camino', variant: 'secondary' },
  driver_arrived: { text: 'Conductor en puerta', variant: 'secondary' },
  in_progress: { text: 'En curso', variant: 'secondary' },
  completed: { text: 'Completado', variant: 'default' },
  cancelled: { text: 'Cancelado', variant: 'destructive' },
  cancelled_by_driver: { text: 'Cancelado por conductor', variant: 'destructive' },
  cancelled_by_passenger: { text: 'Cancelado por ti', variant: 'destructive' },
};

const typeBadge = (t) => {
  const map = {
    now: { text: 'Inmediato' },
    ride: { text: 'Inmediato' },
    scheduled: { text: 'Programado' },
    hourly: { text: 'Por Hora' },
    package: { text: 'Envío' },
    shared: { text: 'Compartido' },
  };
  return map[t] ? map[t].text : t;
};

export default function RideHistoryPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState(null);

  // Trae el viaje según el tipo
  useEffect(() => {
    let cancelled = false;

    const fetchRide = async () => {
      setLoading(true);
      try {
        let query, table = null;

        switch ((type || '').toLowerCase()) {
          case 'now':
          case 'ride':
            table = 'rides';
            query = supabase
              .from('rides')
              .select('*, driver:profiles!rides_driver_id_fkey(full_name, vehicle_info)')
              .eq('id', id)
              .single();
            break;

          case 'scheduled':
            table = 'scheduled_rides';
            query = supabase
              .from('scheduled_rides')
              .select('*, driver:profiles!scheduled_rides_driver_id_fkey(full_name, vehicle_info)')
              .eq('id', id)
              .single();
            break;

          case 'hourly':
            table = 'hourly_bookings';
            query = supabase
              .from('hourly_bookings')
              .select('*, driver:profiles!hourly_bookings_driver_id_fkey(full_name, vehicle_info)')
              .eq('id', id)
              .single();
            break;

          case 'package':
            table = 'package_deliveries';
            query = supabase
              .from('package_deliveries')
              .select('*, driver:profiles!package_deliveries_driver_id_fkey(full_name, vehicle_info)')
              .eq('id', id)
              .single();
            break;

          case 'shared':
            // Historico del asiento reservado; si prefieres la publicación de viaje compartido, ajusta este select
            table = 'shared_ride_reservations';
            query = supabase
              .from('shared_ride_reservations')
              .select(`
                *,
                shared_ride:shared_rides(*),
                driver:profiles!shared_rides_driver_id_fkey(full_name, vehicle_info)
              `)
              .eq('id', id)
              .single();
            break;

          default:
            throw new Error('Tipo de viaje desconocido');
        }

        const { data, error } = await query;
        if (error) throw error;
        if (cancelled) return;

        // Normaliza algunos campos para reuso del UI
        const r = normalizeForView(type, data);
        setRide(r);
      } catch (e) {
        console.error(e);
        toast({
          title: 'No se pudo cargar el viaje',
          description: e.message || 'Intenta nuevamente.',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRide();
    return () => { cancelled = true; };
  }, [type, id]);

  const statusMeta = useMemo(() => {
    if (!ride) return { text: '—', variant: 'secondary' };
    return statusView[ride.status] || { text: ride.status || '—', variant: 'secondary' };
  }, [ride]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="p-4 md:p-6 text-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <p>No se encontró el viaje.</p>
      </div>
    );
  }

  const vehicle = ride.driver?.vehicle_info;
  const partialPlate = vehicle?.plate?.slice(-3);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <Badge variant={statusMeta.variant}>{statusMeta.text}</Badge>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            <span>
              {ride.pickup_time
                ? new Date(ride.pickup_time).toLocaleString('es-AR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
                : new Date(ride.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </span>
            <Badge variant="outline" className="ml-2">{typeBadge(ride.ride_type)}</Badge>
          </div>

          {/* Origen / destino */}
          <div className="space-y-2">
            {ride.origin_address && (
              <div className="flex items-start text-sm">
                <MapPin className="h-4 w-4 mr-2 text-green-600" />
                <span>{ride.origin_address}</span>
              </div>
            )}
            {ride.destination_address && (
              <div className="flex items-start text-sm">
                <Flag className="h-4 w-4 mr-2 text-red-600" />
                <span>{ride.destination_address}</span>
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-2">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">{formatCurrencyARS(ride.fare_total)}</span>
            </div>
            {ride.distance_km != null && (
              <div className="flex items-center gap-1">
                <RouteIcon className="h-4 w-4 text-sky-600" />
                <span>{formatDistance(ride.distance_km)}</span>
              </div>
            )}
            {ride.duration_min != null && (
              <div className="flex items-center gap-1">
                <Timer className="h-4 w-4 text-violet-600" />
                <span>{formatDuration(ride.duration_min)}</span>
              </div>
            )}
          </div>

          {/* Conductor */}
          {ride.driver && (
            <div className="border-t pt-3 mt-2 text-sm text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Conductor: <strong>{ride.driver.full_name}</strong></span>
              </div>
              {vehicle && (
                <div className="flex items-center gap-2 font-mono">
                  <Shield className="h-4 w-4" />
                  <span>{vehicle.brand} {vehicle.model} • ***{partialPlate}</span>
                </div>
              )}
            </div>
          )}

          {/* Observaciones / motivo de cancelación */}
          {ride.cancel_reason && (
            <div className="border-t pt-3 mt-2 text-xs text-slate-500">
              Motivo: <em>{ride.cancel_reason}</em>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Normaliza cada tabla a un objeto con campos comunes que pintamos arriba */
function normalizeForView(type, raw) {
  const t = (type || '').toLowerCase();
  if (t === 'now' || t === 'ride') {
    return {
      id: raw.id,
      ride_type: 'now',
      status: raw.status,
      created_at: raw.created_at,
      pickup_time: raw.request_time,
      origin_address: raw.origin_address,
      destination_address: raw.destination_address,
      fare_total: Number(raw.actual_fare ?? raw.fare_estimated ?? 0),
      distance_km: Number(raw.actual_distance_km ?? raw.estimated_distance_km ?? raw.actual_distance ?? raw.estimated_distance ?? 0),
      duration_min: Number(raw.actual_duration_min ?? raw.estimated_duration_min ?? raw.actual_duration ?? raw.estimated_duration ?? 0),
      cancel_reason: raw.cancel_reason,
      driver: raw.driver,
    };
  }

  if (t === 'scheduled') {
    return {
      id: raw.id,
      ride_type: 'scheduled',
      status: raw.status,
      created_at: raw.created_at,
      pickup_time: raw.scheduled_pickup_time,
      origin_address: raw.origin_address,
      destination_address: raw.destination_address,
      fare_total: Number(raw.actual_fare ?? raw.fare_estimated ?? 0),
      distance_km: Number(raw.estimated_distance ?? 0),
      duration_min: Number(raw.estimated_duration ?? 0),
      cancel_reason: raw.cancel_reason,
      driver: raw.driver,
    };
  }

  if (t === 'hourly') {
    return {
      id: raw.id,
      ride_type: 'hourly',
      status: raw.status,
      created_at: raw.created_at,
      pickup_time: raw.start_datetime,
      origin_address: raw.start_location_address,
      destination_address: null,
      fare_total: Number(raw.total_fare ?? 0),
      distance_km: Number(raw.actual_distance_km ?? raw.estimated_distance_km ?? 0),
      duration_min: Number(raw.actual_duration_min ?? 60 * (raw.booked_hours ?? 0)),
      cancel_reason: raw.cancel_reason,
      driver: raw.driver,
    };
  }

  if (t === 'package') {
    return {
      id: raw.id,
      ride_type: 'package',
      status: raw.status,
      created_at: raw.created_at,
      pickup_time: raw.created_at,
      origin_address: raw.pickup_address,
      destination_address: raw.delivery_address,
      fare_total: Number(raw.fare_estimated ?? 0),
      distance_km: Number(raw.estimated_distance_km ?? 0),
      duration_min: null,
      cancel_reason: null,
      driver: raw.driver,
    };
  }

  if (t === 'shared') {
    const sr = raw.shared_ride || {};
    return {
      id: raw.id,
      ride_type: 'shared',
      status: raw.status,
      created_at: raw.created_at,
      pickup_time: sr.departure_time || raw.created_at,
      origin_address: sr.origin_address,
      destination_address: sr.destination_address,
      fare_total: Number(raw.total_paid ?? sr.seat_price ?? 0),
      distance_km: null,
      duration_min: null,
      cancel_reason: null,
      driver: raw.driver,
    };
  }

  return raw;
}