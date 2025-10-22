import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Filter } from 'lucide-react';

const LiveRidesHeader = ({ lastUpdate, loading, filters, onFilterChange, onUpdate }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Viajes en Vivo</h2>
        <p className="text-sm text-slate-600">
          Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
          {loading && <RefreshCw className="inline w-4 h-4 ml-2 animate-spin" />}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <Input
            placeholder="Filtrar por ciudad..."
            value={filters.city}
            onChange={(e) => onFilterChange(prev => ({ ...prev, city: e.target.value }))}
            className="w-40"
          />
          <select
            value={filters.status}
            onChange={(e) => onFilterChange(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="searching">Buscando</option>
            <option value="driver_assigned">Asignado</option>
            <option value="driver_arriving">En Camino</option>
            <option value="driver_arrived">Llegó</option>
            <option value="in_progress">En Progreso</option>
            <option value="available">Disponible</option>
            <option value="on_trip">En Viaje</option>
          </select>
        </div>
        
        <Button
          onClick={onUpdate}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
    </div>
  );
};

export default LiveRidesHeader;