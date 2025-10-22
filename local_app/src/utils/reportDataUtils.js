// src/utils/reportDataUtils.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Fecha de la fila para filtrar por rango:
 * tomamos la primera que exista en orden de prioridad.
 */
function pickRowDate(r) {
  return (
    r.finished_at ||
    r.completed_at ||
    r.cancelled_at ||
    r.ended_at ||
    r.start_datetime ||
    r.started_at ||
    r.scheduled_pickup_time ||
    r.departure_time ||
    r.created_at ||
    null
  );
}

function toISOStart(d) {
  return new Date(`${d}T00:00:00Z`).toISOString();
}
function toISOEnd(d) {
  return new Date(`${d}T23:59:59Z`).toISOString();
}

/** Sinónimos tolerantes para ride_label en la vista */
const RIDE_LABEL_SYNONYMS = {
  inmediato: ['inmediato', 'now', 'ride', 'immediate'],
  programado: ['programado', 'scheduled'],
  por_hora: ['por_hora', 'hourly'],
  paqueteria: ['paqueteria', 'package', 'envio', 'envío'],
  compartido: ['compartido', 'shared'],
};

export async function fetchDataForReport(filters) {
  const {
    reportType,      // 'ingresos' | 'conductores' | 'pasajeros' | 'viajes_completados' | 'viajes_cancelados' | 'total'
    rideLabel,       // 'all' | 'inmediato' | 'programado' | 'por_hora' | 'paqueteria' | 'compartido'
    dateRange,       // { from, to } (YYYY-MM-DD)
    rideId,
    userId,
    userRole,        // 'passenger' | 'driver' | 'any'
    userEmail,       // si viene, IGNORAMOS rol y buscamos por ambas columnas
  } = filters;

  if (!dateRange?.from || !dateRange?.to) {
    return { rows: [], profiles: [], documents: [] };
  }
  const fromISO = toISOStart(dateRange.from);
  const toISO = toISOEnd(dateRange.to);

  // 1) Si hay email -> resolvemos IDs y NO usamos rol.
  let emailIds = null;
  const ignoreRole = Boolean(userEmail && userEmail.trim());
  if (ignoreRole) {
    const { data: profs, error } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', `%${userEmail.trim()}%`);
    if (error) throw error;
    emailIds = (profs || []).map(p => p.id);
    if (!emailIds.length) {
      return { rows: [], profiles: [], documents: [] };
    }
  }

  // 2) Base query SIN filtro de fecha (lo haremos en JS)
  let q = supabase.from('vw_admin_trips_report').select('*');

  // ride_label tolerante
  if (rideLabel && rideLabel !== 'all') {
    const synonyms = RIDE_LABEL_SYNONYMS[rideLabel] || [rideLabel];
    const ors = synonyms.map(v => `ride_label.eq.${v}`).join(',');
    q = q.or(ors);
  }

  if (rideId) q = q.eq('ride_id', rideId);

  // Usuario (por email -> ambos; por id -> según rol o en ambos con 'any')
  if (ignoreRole && emailIds?.length) {
    const list = emailIds.join(',');
    q = q.or(`passenger_id.in.(${list}),driver_id.in.(${list})`);
  } else if (userId) {
    if (userRole === 'driver') q = q.eq('driver_id', userId);
    else if (userRole === 'passenger') q = q.eq('passenger_id', userId);
    else /* any */                   q = q.or(`passenger_id.eq.${userId},driver_id.eq.${userId}`);
  }

  // Estado según tipo de reporte (en "total" no filtramos)
  if (reportType === 'viajes_completados') {
    q = q.eq('status', 'completed');
  } else if (reportType === 'viajes_cancelados') {
    q = q.in('status', ['cancelled', 'cancelled_by_driver', 'cancelled_by_passenger']);
  }

  // Orden por lo que seguro existe
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;

  const all = data || [];

  // 3) Filtro de fecha en JS: si CUALQUIERA de las fechas candidatas cae dentro del rango, pasa.
  const fromMs = new Date(fromISO).getTime();
  const toMs = new Date(toISO).getTime();

  const rows = all.filter(r => {
    const dt = pickRowDate(r);
    if (!dt) return false;
    const t = new Date(dt).getTime();
    return t >= fromMs && t <= toMs;
  });

  // 4) Perfiles + Documentos cuando hay usuario (por id o email)
  const idsToFetch = ignoreRole ? (emailIds || []) : (userId ? [userId] : []);
  let profiles = [], documents = [];

  if (idsToFetch.length) {
    // perfiles
    const { data: profs, error: e1 } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, user_type, verified, rating, total_completed_rides, member_since, avatar_url, avatar_path')
      .in('id', idsToFetch);
    if (e1) throw e1;
    profiles = profs || [];

    // documentos (tabla unificada user_documents)
    const { data: docs, error: e2 } = await supabase
      .from('user_documents')
      .select('id, user_id, kind, doc_type, stored_file_url, generated_public_url, file_url, status, reason, expires_at, created_at, updated_at')
      .in('user_id', idsToFetch)
      .order('created_at', { ascending: true });
    if (e2) throw e2;
    documents = docs || [];
  }

  return { rows, profiles, documents };
}

/** Resumen según tipo de reporte (incluye 'total') */
export function buildSummaryForReport(rows, reportType) {
  if (!rows || rows.length === 0) return {};

  if (reportType === 'ingresos' || reportType === 'total') {
    const totalIngresos = rows.reduce((s, r) => s + Number(r.app_earnings || 0), 0);
    const totalViajes = rows.length;
    const promedio = totalViajes ? totalIngresos / totalViajes : 0;

    const totalPagado = rows.reduce((s, r) => s + Number(r.fare_paid || r.total_amount || 0), 0);
    const totalDriver = rows.reduce((s, r) => s + Number(r.driver_earnings || 0), 0);

    return {
      titulo: reportType === 'total' ? 'Reporte Total (general)' : 'Reporte de Ingresos',
      totalIngresos,
      totalViajes,
      promedioPorViaje: promedio,
      totalPagado,
      totalDriver,
    };
  }

  if (reportType === 'conductores') {
    const byDriver = Object.values(rows.reduce((acc, r) => {
      const k = r.driver_id || 'sin_driver';
      if (!acc[k]) acc[k] = {
        driver_id: r.driver_id,
        driver_name: r.driver_name || '(sin conductor)',
        driver_phone: r.driver_phone || '',
        viajes: 0,
        app_earnings: 0,
        driver_earnings: 0,
      };
      acc[k].viajes += 1;
      acc[k].app_earnings += Number(r.app_earnings || 0);
      acc[k].driver_earnings += Number(r.driver_earnings || 0);
      return acc;
    }, {}));
    return { titulo: 'Rendimiento de Conductores', agregados: byDriver };
  }

  if (reportType === 'pasajeros') {
    const byPassenger = Object.values(rows.reduce((acc, r) => {
      const k = r.passenger_id || 'sin_pasajero';
      if (!acc[k]) acc[k] = {
        passenger_id: r.passenger_id,
        passenger_name: r.passenger_name || '(sin pasajero)',
        passenger_phone: r.passenger_phone || '',
        viajes: 0,
        gasto: 0,
      };
      acc[k].viajes += 1;
      acc[k].gasto += Number(r.fare_paid || r.total_amount || 0);
      return acc;
    }, {}));
    return { titulo: 'Actividad de Pasajeros', agregados: byPassenger };
  }

  return { titulo: reportType === 'viajes_cancelados' ? 'Viajes Cancelados' : 'Viajes Completados' };
}
