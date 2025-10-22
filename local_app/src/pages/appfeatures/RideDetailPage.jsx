import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Clock, DollarSign, Hash, MapPin, Package, Users, Hourglass,
  User, Shield
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const rideTypeConfig = {
  now: { table: 'rides', title: 'Viaje Inmediato' },
  ride: { table: 'rides', title: 'Viaje Inmediato' },
  scheduled: { table: 'scheduled_rides', title: 'Viaje Programado' },
  hourly: { table: 'hourly_bookings', title: 'Reserva por Horas' },
  package: { table: 'package_deliveries', title: 'Envío de Paquete' },
  shared: { table: 'shared_ride_reservations', title: 'Viaje Compartido' },
};

const terminalStatuses = ['completed', 'cancelled', 'cancelled_by_driver', 'cancelled_by_passenger'];

const formatCurrency = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$ --';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
};
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return format(d, "d 'de' MMMM 'de' yyyy, HH:mm 'hs'", { locale: es });
};
const StatusBadge = ({ status }) => {
  const map = {
    pending: { variant: 'secondary', cls: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
    searching: { variant: 'secondary', cls: 'bg-yellow-100 text-yellow-800', label: 'Buscando' },
    accepted: { variant: 'secondary', cls: 'bg-emerald-100 text-emerald-800', label: 'Aceptado' },
    driver_assigned: { variant: 'secondary', cls: 'bg-emerald-100 text-emerald-800', label: 'Conductor Asignado' },
    driver_arriving: { variant: 'secondary', cls: 'bg-blue-100 text-blue-800', label: 'En Camino' },
    driver_arrived: { variant: 'secondary', cls: 'bg-blue-100 text-blue-800', label: 'Conductor en Puerta' },
    in_progress: { variant: 'secondary', cls: 'bg-indigo-100 text-indigo-800', label: 'En Progreso' },
    completed: { variant: 'default', cls: '', label: 'Completado' },
    delivered: { variant: 'default', cls: '', label: 'Entregado' },
    cancelled: { variant: 'destructive', cls: '', label: 'Cancelado' },
    cancelled_by_driver: { variant: 'destructive', cls: '', label: 'Cancelado por Conductor' },
    cancelled_by_passenger: { variant: 'destructive', cls: '', label: 'Cancelado por Pasajero' },
    scheduled: { variant: 'secondary', cls: 'bg-purple-100 text-purple-800', label: 'Programado' },
    confirmed: { variant: 'secondary', cls: 'bg-emerald-100 text-emerald-800', label: 'Confirmado' },
  };
  const conf = map[status] || { variant: 'outline', cls: '', label: status || '—' };
  return <Badge variant={conf.variant} className={conf.cls}>{conf.label}</Badge>;
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 w-6 h-6 text-gray-500">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

function canShowDriverBlock(ride) {
  if (!ride?.driver_id) return false;
  if (terminalStatuses.includes(ride.status)) return false;
  return ['driver_assigned', 'accepted', 'driver_arriving', 'driver_arrived', 'in_progress', 'scheduled', 'confirmed'].includes(ride.status);
}

function maskPlate3(plate) {
  if (!plate) return '';
  const s = String(plate);
  return `***${s.slice(-3)}`;
}

// --- helpers avatar (Supabase Storage: bucket 'avatars')
async function resolveAvatarSignedUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl; // ya es URL
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(pathOrUrl, 3600);
  if (error) {
    console.warn('signed url error', error);
    return null;
  }
  return data?.signedUrl || null;
}

const RideDetailPage = () => {
  const params = useParams();
  const type = (params.type || '').toLowerCase();
  const id = params.id;
  const navigate = useNavigate();

  const [rideData, setRideData] = useState(null);
  const [driver, setDriver] = useState(null); // { full_name, avatar_url, avatar_path, vehicle_info, avatar_signed_url }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = rideTypeConfig[type];

  const fetchDriver = async (driverId) => {
    if (!driverId) { setDriver(null); return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, avatar_path, vehicle_info')
      .eq('id', driverId)
      .single();
    if (!error && data) {
      const raw = data.avatar_path || data.avatar_url || null;
      const signed = await resolveAvatarSignedUrl(raw);
      setDriver({ ...data, avatar_signed_url: signed });
    } else {
      setDriver(null);
    }
  };

  const fetchData = useCallback(async () => {
    if (!config) {
      setError('Tipo de viaje no válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from(config.table)
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) { setError('Viaje no encontrado.'); setRideData(null); return; }

      let loaded = data;

      if (type === 'shared' && data.shared_ride_id) {
        const { data: sharedRideData, error: sharedRideError } = await supabase
          .from('shared_rides')
          .select('*')
          .eq('id', data.shared_ride_id)
          .single();
        if (sharedRideError) throw sharedRideError;
        loaded = { ...data, shared_ride_details: sharedRideData };
        await fetchDriver(sharedRideData?.driver_id);
      } else {
        await fetchDriver(data.driver_id);
      }

      setRideData(loaded);
    } catch (err) {
      console.error('Error fetching ride details:', err);
      setError('No se pudo cargar la información del viaje.');
    } finally {
      setLoading(false);
    }
  }, [type, id, config]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const renderRideDetails = () => {
    if (!rideData) return null;

    const isPackage = type === 'package';
    const isShared = type === 'shared';
    const isHourly = type === 'hourly';

    const origin = rideData.origin_address
      || rideData.pickup_address
      || rideData.start_location_address
      || rideData.shared_ride_details?.origin_address
      || 'No especificado';

    const destination = rideData.destination_address
      || rideData.delivery_address
      || rideData.shared_ride_details?.destination_address
      || (isHourly ? 'Servicio por horas' : 'No especificado');

    const date = rideData.created_at
      || rideData.scheduled_pickup_time
      || rideData.start_datetime
      || rideData.shared_ride_details?.departure_time;

    const fare = rideData.actual_fare
      || rideData.fare_estimated
      || rideData.total_fare
      || rideData.total_paid
      || 0;

    const showDriver = canShowDriverBlock(rideData);
    const vehicle = driver?.vehicle_info;
    const vehicleLabel = vehicle ? `${vehicle.brand ?? ''} ${vehicle.model ?? ''}`.trim() : '';
    const plateMasked = vehicle?.plate ? maskPlate3(vehicle.plate) : '';

    return (
      <>
        <DetailItem icon={<MapPin />} label="Origen" value={origin} />
        <DetailItem icon={<MapPin />} label="Destino" value={destination} />
        <DetailItem icon={<Clock />} label="Fecha" value={formatDate(date)} />
        <DetailItem icon={<DollarSign />} label="Monto" value={formatCurrency(fare)} />

        {isPackage && (
          <>
            <DetailItem icon={<Package />} label="Descripción" value={rideData.package_description || 'N/A'} />
            <DetailItem icon={<Users />} label="Recibe" value={rideData.recipient_name || 'N/A'} />
          </>
        )}
        {isShared && <DetailItem icon={<Users />} label="Asientos Reservados" value={rideData.seats_reserved ?? 'N/A'} />}
        {isHourly && <DetailItem icon={<Hourglass />} label="Horas Reservadas" value={rideData.booked_hours != null ? `${rideData.booked_hours} hs` : 'N/A'} />}

        {showDriver && (
          <div className="mt-4 p-4 rounded-xl border bg-sky-50">
            <p className="text-sm font-semibold text-sky-900 mb-3">Conductor y Vehículo</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-600 font-bold">
                {driver?.avatar_signed_url
                  ? <img src={driver.avatar_signed_url} alt="Conductor" className="w-full h-full object-cover" />
                  : (driver?.full_name ? driver.full_name.charAt(0) : 'C')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-slate-800">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold">{driver?.full_name || 'Conductor'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 mt-1">
                  <Shield className="w-4 h-4 text-slate-600" />
                  <span className="font-medium">{vehicleLabel || 'Vehículo'}</span>
                  {plateMasked && <em className="not-italic text-slate-500">— {plateMasked}</em>}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderSkeleton = () => (
    <div className="space-y-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/passenger/my-rides')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold ml-4">Detalle del Viaje</h1>
      </header>

      <main className="p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{rideTypeConfig[type]?.title || 'Detalle'}</CardTitle>
              {rideData && <StatusBadge status={rideData.status} />}
            </div>
            <div className="text-xs text-gray-400 flex items-center pt-1">
              <Hash className="w-3 h-3 mr-1" />
              <span>{id}</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              renderSkeleton()
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : rideData ? (
              <div className="space-y-6">{renderRideDetails()}</div>
            ) : (
              <div className="text-center text-gray-500 py-8">No se encontraron datos para este viaje.</div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RideDetailPage;