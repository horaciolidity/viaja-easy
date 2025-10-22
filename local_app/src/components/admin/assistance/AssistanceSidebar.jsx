import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const AssistanceSidebar = ({ filters, onFilterChange, searchTerm, onSearchChange }) => {
  return (
    <div className="p-4 border-b border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800">Mensajes por Asistencia</h2>
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, email, teléfono..."
          value={searchTerm}
          onChange={onSearchChange}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2 mt-2">
        <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Estados</SelectItem>
            <SelectItem value="open">Abiertos</SelectItem>
            <SelectItem value="in_review">En Revisión</SelectItem>
            <SelectItem value="closed">Cerrados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.role} onValueChange={(value) => onFilterChange('role', value)}>
          <SelectTrigger><SelectValue placeholder="Rol" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Roles</SelectItem>
            <SelectItem value="passenger">Pasajero</SelectItem>
            <SelectItem value="driver">Conductor</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AssistanceSidebar;