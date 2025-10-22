// src/components/RideStatusIndicator.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Car, CheckCircle, MapPin, DollarSign, Route as RouteIcon, Timer, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { formatDistance, formatDuration } from '@/utils/geolocation';
import { formatCurrencyARS } from '@/utils/mercadoPago';

const TERMINAL = new Set(['completed', 'cancelled', 'cancelled_by_driver', 'cancelled_by_passenger']);
const SHOW_DRIVER_STATES = new Set(['accepted', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'in_progress', 'confirmed']);

const statusInfo = {
  searching: { icon: Loader2, text: 'Buscando un conductor...', color: 'text-amber-500', spin: true },
  accepted: { icon: Car, text: '¡Conductor aceptó! Preparando salida…', color: 'text-blue-500' },
  driver_assigned: { icon: Car, text: '¡Conductor asignado! En camino a buscarte.', color: 'text-blue-500' },
  driver_arriving: { icon: Car, text: 'Tu conductor está en camino.', color: 'text-blue-500' },
  driver_arrived: { icon: MapPin, text: '¡Tu conductor ha llegado!', color: 'text-green-500' },
  in_progress: { icon: Car, text: 'Viaje en progreso. ¡Disfrutá el recorrido!', color: 'text-purple-500' },
  scheduled: { icon: Car, text: 'Viaje programado.', color: 'text-cyan-600' },
  confirmed: { icon: Car, text: 'Viaje confirmado. Esperando salida.', color: 'text-emerald-600' },
  // Los terminales NO se muestran (el componente se oculta)
};

const tableByType = (t) => {
  switch ((t || 'now').toLowerCase()) {
    case 'now':
    case 'ride': return { table: 'rides', passengerKey: 'passenger_id' };
    case 'scheduled': return { table: 'scheduled_rides', passengerKey: 'passenger_id' };
    case 'hourly': return { table: 'hourly_bookings', passengerKey: 'passenger_id' };
    case 'package': return { table: 'package_deliveries', passengerKey: 'user_id' };
    default: return { table: 'rides', passengerKey: 'passenger_id' };
  }
};

const isHttp = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
async function signedAvatar(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (isHttp(pathOrUrl)) return pathOrUrl;
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(pathOrUrl, 3600);
  if (error) return null;
  return data?.signedUrl || null;
}
const maskPlate = (plate) => plate ? `***${String(plate).slice(-3)}` : '';
const brandModel = (vi) => {
  if (!vi) return '';
  const brand = vi.brand || vi.make || '';
  const model = vi.model || '';
  return [brand, model].filter(Boolean).join(' ');
};

const InfoRow = ({ icon, children }) => (
  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">{icon}{children}</div>
);

const RideStatusIndicator = ({ ride }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [driverAvatar, setDriverAvatar] = useState(null);

  // Definición de tabla/id según el tipo que recibas en la prop
  const meta = useMemo(() => {
    const base = tableByType(ride?.ride_type || 'now');
    return { ...base, id: ride?.id };
  }, [ride]);

  const load = useCallback(async () => {
    if (!meta.id) return;

    let select;
    if (meta.table === 'rides' || meta.table === 'scheduled_rides') {
      select = `*, passenger:${meta.passengerKey}(full_name, avatar_url, avatar_path),
                   driver:driver_id(full_name, avatar_url, avatar_path, vehicle_info)`;
    } else if (meta.table === 'hourly_bookings') {
      select = `*, origin_address:start_location_address, destination_address:description,
                   passenger:${meta.passengerKey}(full_name, avatar_url, avatar_path),
                   driver:driver_id(full_name, avatar_url, avatar_path, vehicle_info)`;
    } else { // package_deliveries
      select = `*, origin_address:pickup_address, destination_address:delivery_address,
                   passenger:${meta.passengerKey}(full_name, avatar_url, avatar_path),
                   driver:driver_id(full_name, avatar_url, avatar_path, vehicle_info)`;
    }

    const { data: row, error } = await supabase
      .from(meta.table)
      .select(select)
      .eq('id', meta.id)
      .single();

    if (error) return;

    // Si el viaje pasó a terminal, ocultamos el banner limpiando el estado
    if (TERMINAL.has(row.status)) {
      setData(null);
      setDriverAvatar(null);
      return;
    }

    // Cargar avatar firmado (si hay driver)
    const raw = row?.driver?.avatar_path || row?.driver?.avatar_url;
    setDriverAvatar(await signedAvatar(raw));
    setData(row);
  }, [meta]);

  // Carga inicial
  useEffect(() => { load(); }, [load]);

  // Suscripción en vivo
  useEffect(() => {
    if (!meta.id) return;
    const ch = supabase
      .channel(`passenger-banner-${meta.table}-${meta.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: meta.table, filter: `id=eq.${meta.id}` }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [meta, load]);

  const r = data || ride;
  if (!r || TERMINAL.has(r.status)) return null; // NO renderizar si está terminal

  const sCfg = statusInfo[r.status] || null;
  if (!sCfg) return null; // si no conocemos el estado, no mostramos nada

  const Icon = sCfg.icon || Car;

  const showDriver = !!r.driver_id && SHOW_DRIVER_STATES.has(r.status);

  const origin = r.origin_address || r.start_location_address || r.pickup_address || '—';
  const destination = r.destination_address || r.description || r.delivery_address || '—';

  const fare = r.actual_fare ?? r.fare_estimated ?? r.total_fare ?? r.total_paid ?? null;
  const dist = r.actual_distance_km ?? r.estimated_distance_km ?? r.actual_distance ?? r.estimated_distance ?? null;
  const dur = r.actual_duration_min ?? r.estimated_duration_min ?? r.actual_duration ?? r.estimated_duration ?? null;

  const vi = r?.driver?.vehicle_info || null;
  const vehicleText = vi ? `${brandModel(vi)}${vi.plate ? ` - ${maskPlate(vi.plate)}` : ''}` : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
        onClick={() => navigate(`/tracking/${r.id}`)}
      >
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Icon className={`w-8 h-8 ${sCfg.color} ${sCfg.spin ? 'animate-spin' : ''}`} />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{sCfg.text}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {origin} &nbsp;•&nbsp; {destination}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">Ver viaje</Button>
            </div>

            {/* Datos del viaje */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {fare != null && <InfoRow icon={<DollarSign className="w-4 h-4 text-emerald-600" />}>{formatCurrencyARS(fare)}</InfoRow>}
              {dist != null && <InfoRow icon={<RouteIcon className="w-4 h-4 text-blue-600" />}>{formatDistance(dist)}</InfoRow>}
              {dur != null && <InfoRow icon={<Timer className="w-4 h-4 text-purple-600" />}>{formatDuration(dur)}</InfoRow>}
            </div>

            {/* Conductor/vehículo: solo si hay driver asignado y estado acorde */}
            {showDriver && (
              <div className="mt-4 p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/30">
                <p className="text-xs font-medium text-slate-500 mb-2">Conductor y Vehículo</p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                      {driverAvatar
                        ? <img src={driverAvatar} alt="avatar" className="w-full h-full object-cover" />
                        : <User className="w-5 h-5" />}
                    </div>
                    <div className="leading-tight">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {r?.driver?.full_name || 'Conductor asignado'}
                      </div>
                      {vehicleText && (
                        <div className="text-xs text-slate-500">
                          {vehicleText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Teléfonos NUNCA se muestran aquí */}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RideStatusIndicator;