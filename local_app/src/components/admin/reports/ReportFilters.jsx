// src/components/admin/reports/ReportFilters.jsx
import React from 'react';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.jsx';

const ReportFilters = ({ filters, setFilters }) => {
  const set = (patch) => setFilters((prev) => ({ ...prev, ...patch }));

  const setDate = (key, value) =>
    set({ dateRange: { ...filters.dateRange, [key]: value } });

  return (
    <>
      {/* Tipo de Reporte */}
      <div>
        <Label className="text-sm font-medium text-slate-600 block mb-1.5">
          Tipo de Reporte
        </Label>
        <Select
          value={filters.reportType}
          onValueChange={(v) => set({ reportType: v })}
        >
          <SelectTrigger className="w-full bg-white border-slate-300">
            <SelectValue placeholder="Seleccionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ingresos">Ingresos</SelectItem>
            <SelectItem value="conductores">Rendimiento de Conductores</SelectItem>
            <SelectItem value="pasajeros">Actividad de Pasajeros</SelectItem>
            <SelectItem value="viajes_completados">Viajes Completados</SelectItem>
            <SelectItem value="viajes_cancelados">Viajes Cancelados</SelectItem>
            <SelectItem value="total">Total (general)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tipo de Viaje */}
      <div>
        <Label className="text-sm font-medium text-slate-600 block mb-1.5">
          Tipo de Viaje
        </Label>
        <Select
          value={filters.rideLabel}
          onValueChange={(v) => set({ rideLabel: v })}
        >
          <SelectTrigger className="w-full bg-white border-slate-300">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="inmediato">Inmediato</SelectItem>
            <SelectItem value="programado">Programado</SelectItem>
            <SelectItem value="por_hora">Por Hora</SelectItem>
            <SelectItem value="paqueteria">Paquetería</SelectItem>
            <SelectItem value="compartido">Compartido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desde */}
      <div>
        <Label className="text-sm font-medium text-slate-600 block mb-1.5">
          Desde
        </Label>
        <Input
          type="date"
          value={filters.dateRange.from || ''}
          onChange={(e) => setDate('from', e.target.value)}
          className="bg-white border-slate-300"
        />
      </div>

      {/* Hasta */}
      <div>
        <Label className="text-sm font-medium text-slate-600 block mb-1.5">
          Hasta
        </Label>
        <Input
          type="date"
          value={filters.dateRange.to || ''}
          onChange={(e) => setDate('to', e.target.value)}
          className="bg-white border-slate-300"
        />
      </div>

      {/* ID de Viaje */}
      <div>
        <Label className="text-sm font-medium text-slate-600 block mb-1.5">
          ID de Viaje (opcional)
        </Label>
        <Input
          placeholder="uuid del viaje"
          value={filters.rideId}
          onChange={(e) => set({ rideId: e.target.value })}
        />
      </div>

      {/* ID de Usuario */}
      <div>
        <Label className="text-sm font-medium text-slate-600 block mb-1.5">
          ID de Usuario (opcional)
        </Label>
        <Input
          placeholder="uuid del usuario"
          value={filters.userId}
          onChange={(e) => set({ userId: e.target.value })}
        />
      </div>

      {/* Correo */}
      <div>
        <Label className="text-sm font-medium text-slate-600 block mb-1.5">
          Correo del Usuario (opcional)
        </Label>
        <Input
          placeholder="usuario@correo.com"
          value={filters.userEmail}
          onChange={(e) => set({ userEmail: e.target.value })}
        />
        <p className="text-xs text-slate-500 mt-1">
          Si ingresás correo, se ignora el rol y se buscan coincidencias como pasajero o conductor.
        </p>
      </div>

      {/* Rol */}
      <div>
        <Label className="text-sm font-medium text-slate-600 block mb-1.5">
          Rol del Usuario
        </Label>
        <Select
          value={filters.userRole}
          onValueChange={(v) => set({ userRole: v })}
        >
          <SelectTrigger className="w-full bg-white border-slate-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passenger">Pasajero</SelectItem>
            <SelectItem value="driver">Conductor</SelectItem>
            <SelectItem value="any">Cualquiera</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 mt-1">
          Usá “Cualquiera” si filtrás por ID y querés buscar en passenger_id y driver_id.
        </p>
      </div>
    </>
  );
};

export default ReportFilters;
