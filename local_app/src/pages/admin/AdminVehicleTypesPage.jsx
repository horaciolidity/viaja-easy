import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Edit2, Trash2, Users, DollarSign, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getVehicleTypes, createVehicleType, updateVehicleType, deleteVehicleType } from '@/services/vehicleTypeService';
import { formatCurrencyARS } from '@/utils/mercadoPago.js';

const AdminVehicleTypesPage = () => {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentVehicleType, setCurrentVehicleType] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', capacity: 1, icon_url: '', is_active: true });

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const data = await getVehicleTypes();
      setVehicleTypes(data);
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los tipos de vehículo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const resetForm = () => {
    setShowForm(false);
    setCurrentVehicleType(null);
    setFormData({ name: '', description: '', capacity: 1, icon_url: '', is_active: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { base_fare, price_per_km, price_per_minute, ...dataToUpsert } = formData;
      if (currentVehicleType) {
        await updateVehicleType(currentVehicleType.id, dataToUpsert);
        toast({ title: "Tipo de Vehículo Actualizado", description: `El tipo "${formData.name}" ha sido actualizado.` });
      } else {
        await createVehicleType(dataToUpsert);
        toast({ title: "Tipo de Vehículo Creado", description: `El nuevo tipo "${formData.name}" ha sido agregado.` });
      }
      resetForm();
      await fetchTypes();
    } catch(error) {
      toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (vt) => {
    setCurrentVehicleType(vt);
    setFormData({ ...vt });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este tipo de vehículo?')) {
      try {
        await deleteVehicleType(id);
        toast({ title: "Tipo de Vehículo Eliminado", variant: "destructive" });
        await fetchTypes();
      } catch(error) {
        toast({ title: "Error al Eliminar", description: error.message, variant: "destructive" });
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">Gestión de Tipos de Vehículo</h2>
        <Button onClick={() => { setShowForm(true); resetForm(); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nuevo Tipo de Vehículo
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
          <h3 className="text-lg font-medium text-slate-700">{currentVehicleType ? 'Editar' : 'Nuevo'} Tipo de Vehículo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-600">Nombre</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Auto, Moto" className="mt-1 border-slate-300" required />
            </div>
            <div>
              <Label htmlFor="capacity" className="text-sm font-medium text-slate-600">Capacidad (Pasajeros)</Label>
              <Input id="capacity" name="capacity" type="number" value={formData.capacity} onChange={handleInputChange} placeholder="Ej: 4" className="mt-1 border-slate-300" required />
            </div>
          </div>
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-slate-600">Descripción</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Breve descripción del tipo de vehículo" className="mt-1 border-slate-300" rows={2} />
          </div>
          <div>
            <Label htmlFor="icon_url" className="text-sm font-medium text-slate-600">Identificador de Ícono (ej: car_icon, moto_icon)</Label>
            <Input id="icon_url" name="icon_url" value={formData.icon_url} onChange={handleInputChange} placeholder="car_icon" className="mt-1 border-slate-300" />
          </div>
          <div className="flex items-center space-x-4">
            <Label htmlFor="is_active" className="text-sm font-medium text-slate-600">Estado</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Switch id="is_active" name="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleSwitchChange('is_active', checked)} />
              <span className="text-sm text-slate-500">{formData.is_active ? 'Habilitado' : 'Deshabilitado'}</span>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={resetForm} className="border-slate-300 text-slate-700" disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </motion.form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicleTypes.map((vt) => (
          <motion.div 
            key={vt.id}
            className={`rounded-lg border p-5 shadow-sm transition-all hover:shadow-md ${vt.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-70'}`}
            layout
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-slate-800">{vt.name}</h3>
              {vt.is_active ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-xs text-slate-500 mb-3 h-10 overflow-hidden">{vt.description}</p>
            <div className="space-y-1.5 text-sm mb-4">
              <div className="flex items-center text-slate-600">
                <Users className="w-4 h-4 mr-2 text-blue-500" /> Capacidad: {vt.capacity} pasajeros
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(vt)} className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100">
                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(vt.id)} className="text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Eliminar
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
      {vehicleTypes.length === 0 && !loading && (
        <p className="text-center py-8 text-slate-500">No hay tipos de vehículo configurados.</p>
      )}
    </motion.div>
  );
};

export default AdminVehicleTypesPage;