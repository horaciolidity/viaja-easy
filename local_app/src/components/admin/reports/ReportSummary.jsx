// ReportSummary.jsx
import React from 'react';
const fmtARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(n || 0));

export default function ReportSummary({ summary, rowCount }) {
  if (!summary || !rowCount) return null;

  // Ingresos
  if ('totalIngresos' in summary) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl font-semibold text-slate-700">{summary.titulo || 'Reporte'}</h3>
          <p className="text-xs text-slate-500">Registros: {rowCount}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="Total Ingresos (App)" value={fmtARS(summary.totalIngresos)} />
          <Card label="Total Viajes" value={summary.totalViajes} />
          <Card label="Promedio por Viaje" value={fmtARS(summary.promedioPorViaje)} />
        </div>
      </div>
    );
  }

  // Total
  if ('totalPagado' in summary && 'totalApp' in summary) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl font-semibold text-slate-700">{summary.titulo || 'Reporte'}</h3>
          <p className="text-xs text-slate-500">Registros: {rowCount}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card label="Viajes Totales" value={summary.totalViajes} />
          <Card label="Completados" value={summary.completados} />
          <Card label="Cancelados" value={summary.cancelados} />
          <Card label="Activos" value={summary.activos} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card label="Total Pagado" value={fmtARS(summary.totalPagado)} />
          <Card label="Total App" value={fmtARS(summary.totalApp)} />
          <Card label="Total Conductores" value={fmtARS(summary.totalDriver)} />
          <Card label="Promedio Pagado" value={fmtARS(summary.promedioPagado)} />
        </div>
      </div>
    );
  }

  // Otros tipos ya existentes (conductores/pasajeros/…)
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xl font-semibold text-slate-700">{summary.titulo || 'Reporte'}</h3>
        <p className="text-xs text-slate-500">Registros: {rowCount}</p>
      </div>
      {/* si hay agregados (conductores / pasajeros) podés mantener tu render actual */}
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
      <p className="text-xs text-slate-500 uppercase">{label}</p>
      <p className="text-2xl font-semibold text-slate-700">{value}</p>
    </div>
  );
}
