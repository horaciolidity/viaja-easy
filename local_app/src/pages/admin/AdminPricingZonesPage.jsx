import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit2, Trash2, MapPin, DollarSign, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminPricingZonesPage = () => {
  const [zones, setZones] = useState([
    { id: 'ZONE001', name: 'Centro Ciudad', description: 'Área céntrica principal.', baseFareModifier: 1.1, perKmModifier: 1.05, isActive: true, areaCoordinates: 'POLYGON((...))' },
    { id: 'ZONE002', name: 'Aeropuerto', description: 'Zona del aeropuerto y alrededores.', baseFareModifier: 1.5, perKmModifier: 1.2, isActive: true, areaCoordinates: 'POLYGON((...))' },
    { id: 'ZONE003', name: 'Zona Residencial Norte', description: 'Barrios residenciales del norte.', baseFareModifier: 1.0, perKmModifier: 1.0, isActive: false, areaCoordinates: 'POLYGON((...))' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [currentZone, setCurrentZone] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', baseFareModifier: 1.0, perKmModifier: 1.0, isActive: true, areaCoordinates: '' });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentZone) {
      setZones(zones.map(z => z.id === currentZone.id ? { ...z, ...formData } : z));
      toast({ title: "Zona de Precios Actualizada" });
    } else {
      const newZone = { id: `ZONE${String(zones.length + 1).padStart(3, '0')}`, ...formData };
      setZones([...zones, newZone]);
      toast({ title: "Zona de Precios Creada" });
    }
    setShowForm(false);
    setCurrentZone(null);
    setFormData({ name: '', description: '', baseFareModifier: 1.0, perKmModifier: 1.0, isActive: true, areaCoordinates: '' });
  };

  const handleEdit = (zone) => {
    setCurrentZone(zone);
    setFormData({ ...zone });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setZones(zones.filter(z => z.id !== id));
    toast({ title: "Zona de Precios Eliminada", variant: "destructive" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">Gestión de Zonas de Precios</h2>
        <Button onClick={() => { setShowForm(true); setCurrentZone(null); setFormData({ name: '', description: '', baseFareModifier: 1.0, perKmModifier: 1.0, isActive: true, areaCoordinates: '' }); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nueva Zona de Precios
        </Button>
      </div>

      {showForm && (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: '2rem' }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="p-6 border border-slate-200 rounded-lg bg-slate-50 space-y-4"
        >
          <h3 className="text-lg font-medium text-slate-700">{currentZone ? 'Editar' : 'Nueva'} Zona de Precios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zoneName">Nombre de la Zona</Label>
              <Input id="zoneName" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Centro Ciudad" className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="zoneDescription">Descripción</Label>
              <Input id="zoneDescription" name="description" value={formData.description} onChange={handleInputChange} placeholder="Breve descripción" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zoneBaseFareModifier">Modificador Tarifa Base (ej: 1.1 para +10%)</Label>
              <Input id="zoneBaseFareModifier" name="baseFareModifier" type="number" step="0.01" value={formData.baseFareModifier} onChange={handleInputChange} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="zonePerKmModifier">Modificador Precio/Km (ej: 1.05 para +5%)</Label>
              <Input id="zonePerKmModifier" name="perKmModifier" type="number" step="0.01" value={formData.perKmModifier} onChange={handleInputChange} className="mt-1" required />
            </div>
          </div>
          <div>
            <Label htmlFor="zoneAreaCoordinates">Coordenadas del Área (Ej: POLYGON(...))</Label>
            <Textarea id="zoneAreaCoordinates" name="areaCoordinates" value={formData.areaCoordinates} onChange={handleInputChange} placeholder="Formato GeoJSON o WKT para el polígono" className="mt-1" rows={3} />
            <p className="text-xs text-slate-500 mt-1">Usar un formato estándar para definir el polígono de la zona.</p>
          </div>
          <div>
            <Label htmlFor="zoneIsActive">Activa</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input type="checkbox" id="zoneIsActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-4 w-4" />
              <span className="text-sm">{formData.isActive ? 'Habilitada' : 'Deshabilitada'}</span>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentZone(null); }}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Guardar Zona</Button>
          </div>
        </motion.form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Nombre</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Mod. Tarifa Base</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Mod. Precio/Km</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Estado</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {zones.map((zone) => (
              <tr key={zone.id} className="hover:bg-slate-50/50">
                <td className="py-3.5 px-4">
                  <p className="font-medium text-slate-800">{zone.name}</p>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{zone.description}</p>
                </td>
                <td className="py-3.5 px-4 text-slate-600">{zone.baseFareModifier}x</td>
                <td className="py-3.5 px-4 text-slate-600">{zone.perKmModifier}x</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${zone.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {zone.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex space-x-1.5">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(zone)} className="text-blue-600 hover:bg-blue-100 p-1.5 h-auto">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(zone.id)} className="text-red-600 hover:bg-red-100 p-1.5 h-auto">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {zones.length === 0 && <p className="text-center py-8 text-slate-500">No hay zonas de precios configuradas.</p>}
    </motion.div>
  );
};

export default AdminPricingZonesPage;