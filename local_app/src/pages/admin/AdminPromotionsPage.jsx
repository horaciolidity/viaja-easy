import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit2, Trash2, Search, Filter, Percent, CalendarDays, DollarSign } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState([
    { id: 'PROMO001', name: 'Descuento de Bienvenida', code: 'BIENVENIDO25', type: 'Porcentaje', value: '25%', startDate: '2025-06-01', endDate: '2025-06-30', status: 'Activa' },
    { id: 'PROMO002', name: 'Viajes de Fin de Semana', code: 'FINDE100', type: 'Monto Fijo', value: '$100 ARS', startDate: '2025-07-01', endDate: '2025-07-31', status: 'Programada' },
    { id: 'PROMO003', name: 'Descuento Verano', code: 'VERANO20', type: 'Porcentaje', value: '20%', startDate: '2025-01-01', endDate: '2025-03-31', status: 'Expirada' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'Porcentaje', value: '', startDate: '', endDate: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentPromotion) {
      setPromotions(promotions.map(p => p.id === currentPromotion.id ? { ...p, ...formData, value: formData.type === 'Porcentaje' ? `${formData.value}%` : `$${formData.value} ARS` } : p));
      toast({ title: "Promoción Actualizada", description: "La promoción ha sido actualizada exitosamente." });
    } else {
      const newPromotion = {
        id: `PROMO${String(promotions.length + 1).padStart(3, '0')}`,
        ...formData,
        value: formData.type === 'Porcentaje' ? `${formData.value}%` : `$${formData.value} ARS`,
        status: new Date(formData.startDate) > new Date() ? 'Programada' : 'Activa' // Basic status logic
      };
      setPromotions([...promotions, newPromotion]);
      toast({ title: "Promoción Creada", description: "La nueva promoción ha sido creada exitosamente." });
    }
    setShowForm(false);
    setCurrentPromotion(null);
    setFormData({ name: '', code: '', type: 'Porcentaje', value: '', startDate: '', endDate: '' });
  };

  const handleEdit = (promo) => {
    const valueOnly = promo.value.replace('%', '').replace('$', '').replace(' ARS', '');
    setCurrentPromotion(promo);
    setFormData({ name: promo.name, code: promo.code, type: promo.type, value: valueOnly, startDate: promo.startDate, endDate: promo.endDate });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setPromotions(promotions.filter(p => p.id !== id));
    toast({ title: "Promoción Eliminada", description: "La promoción ha sido eliminada.", variant: "destructive" });
  };

  const getStatusBadge = (status) => {
    if (status === 'Activa') return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full border border-green-200">{status}</span>;
    if (status === 'Programada') return <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">{status}</span>;
    if (status === 'Expirada') return <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200">{status}</span>;
    return <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200">{status}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">Gestión de Promociones</h2>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Button onClick={() => { setShowForm(true); setCurrentPromotion(null); setFormData({ name: '', code: '', type: 'Porcentaje', value: '', startDate: '', endDate: '' }); }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle className="w-5 h-5 mr-2" />
            Crear Promoción
          </Button>
        </div>
      </div>

      {showForm && (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 p-6 border border-slate-200 rounded-lg bg-slate-50 space-y-4"
        >
          <h3 className="text-lg font-medium text-slate-700">{currentPromotion ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="promoName" className="text-sm font-medium text-slate-600">Nombre</Label>
              <Input id="promoName" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Descuento Verano" className="mt-1 border-slate-300" required />
            </div>
            <div>
              <Label htmlFor="promoCode" className="text-sm font-medium text-slate-600">Código</Label>
              <Input id="promoCode" name="code" value={formData.code} onChange={handleInputChange} placeholder="EJ: VERANO20" className="mt-1 border-slate-300" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="promoType" className="text-sm font-medium text-slate-600">Tipo</Label>
              <select id="promoType" name="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option>Porcentaje</option>
                <option>Monto Fijo</option>
              </select>
            </div>
            <div>
              <Label htmlFor="promoValue" className="text-sm font-medium text-slate-600">Valor</Label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {formData.type === 'Porcentaje' ? <Percent className="h-5 w-5 text-slate-400" /> : <DollarSign className="h-5 w-5 text-slate-400" />}
                </div>
                <Input id="promoValue" name="value" type="number" value={formData.value} onChange={handleInputChange} placeholder={formData.type === 'Porcentaje' ? "20" : "100"} className="pl-10 border-slate-300" required />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="promoStartDate" className="text-sm font-medium text-slate-600">Fecha de Inicio</Label>
              <Input id="promoStartDate" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} className="mt-1 border-slate-300" required />
            </div>
            <div>
              <Label htmlFor="promoEndDate" className="text-sm font-medium text-slate-600">Fecha de Fin</Label>
              <Input id="promoEndDate" name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} className="mt-1 border-slate-300" required />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentPromotion(null); }} className="border-slate-300 text-slate-700">Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Guardar Promoción</Button>
          </div>
        </motion.form>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-grow max-w-xs">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar promociones..."
            className="pl-10 pr-4 py-2.5 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
          />
        </div>
        <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-100">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Nombre</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Código</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Tipo</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Valor</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Fechas (Inicio - Fin)</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Estado</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promotions.map((promo) => (
              <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                <td className="py-3.5 px-4 font-medium text-slate-800">{promo.name}</td>
                <td className="py-3.5 px-4 text-slate-700">{promo.code}</td>
                <td className="py-3.5 px-4 text-slate-700">{promo.type}</td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">{promo.value}</td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center text-xs text-slate-600">
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {promo.startDate} - {promo.endDate}
                  </div>
                </td>
                <td className="py-3.5 px-4">{getStatusBadge(promo.status)}</td>
                <td className="py-3.5 px-4">
                  <div className="flex space-x-1.5">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(promo)} className="text-blue-600 hover:bg-blue-100 p-1.5 h-auto">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(promo.id)} className="text-red-600 hover:bg-red-100 p-1.5 h-auto">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {promotions.length === 0 && (
        <p className="text-center py-8 text-slate-500">No hay promociones creadas.</p>
      )}
    </motion.div>
  );
};

export default AdminPromotionsPage;