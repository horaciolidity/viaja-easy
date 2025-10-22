import { useCallback } from 'react';

const fmtARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(n || 0));

export default function ReportTable({ rows }) {
  const copy = useCallback((txt) => {
    if (!txt) return;
    navigator.clipboard?.writeText(String(txt));
  }, []);

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 max-h-96">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 sticky top-0">
          <tr>
            {['Fecha', 'ID Viaje', 'Tipo', 'Estado', 'Origen', 'Destino', 'Pasajero', 'Conductor', 'App $', 'Driver $', 'Pagado $'].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 font-medium text-slate-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => {
            const idShort = r.ride_id ? String(r.ride_id).slice(0, 8) : '-';
            const when = (r.finished_at || r.created_at) ? new Date(r.finished_at || r.created_at).toLocaleString() : '-';
            return (
              <tr key={`${r.ride_table}-${r.ride_id}`} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-slate-600">{when}</td>
                <td className="py-2.5 px-3">
                  <button className="text-blue-600 hover:underline" onClick={() => copy(r.ride_id)} title="Copiar ID completo">
                    {idShort}
                  </button>
                </td>
                <td className="py-2.5 px-3">{r.ride_label}</td>
                <td className="py-2.5 px-3">{r.status}</td>
                <td className="py-2.5 px-3">{r.origin_address || '-'}</td>
                <td className="py-2.5 px-3">{r.destination_address || '-'}</td>
                <td className="py-2.5 px-3">{r.passenger_name || r.passenger_id?.slice(0, 8)}</td>
                <td className="py-2.5 px-3">{r.driver_name || r.driver_id?.slice(0, 8)}</td>
                <td className="py-2.5 px-3">{fmtARS(r.app_earnings)}</td>
                <td className="py-2.5 px-3">{fmtARS(r.driver_earnings)}</td>
                <td className="py-2.5 px-3">{fmtARS(r.fare_paid)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
