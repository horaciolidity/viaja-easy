import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Edit2, Trash2, Zap, Clock, Percent, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminSurgePricingPage = () => {
  const [surgeRules, setSurgeRules] = useState([
    { id: 'SRG001', name: 'Horas Pico Mañana', timeStart: '07:00', timeEnd: '09:00', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], multiplier: 1.5, zoneId: 'ZONE001', isActive: true },
    { id: 'SRG002', name: 'Noche Fin de Semana', timeStart: '22:00', timeEnd: '04:00', days: ['Viernes', 'Sábado'], multiplier: 1.8, zoneId: 'ALL', isActive: true },
    { id: 'SRG003', name: 'Evento Especial Estadio', timeStart: '18:00', timeEnd: '23:00', days: ['Sábado'], multiplier: 2.0, zoneId: 'ZONE004', isActive: false },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [formData, setFormData] = useState({ name: '', timeStart: '', timeEnd: '', days: [], multiplier: 1.2, zoneId: 'ALL', isActive: true });

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value) }));
  };

  const handleDaysChange = (day) => {
    setFormData(prev => {
      const newDays = prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day];
      return { ...prev, days: newDays };
    });
  };
  
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentRule) {
      setSurgeRules(surgeRules.map(r => r.id === currentRule.id ? { ...r, ...formData } : r));
      toast({ title: "Regla de Tarifa Dinámica Actualizada" });
    } else {
      const newRule = { id: `SRG${String(surgeRules.length + 1).padStart(3, '0')}`, ...formData };
      setSurgeRules([...surgeRules, newRule]);
      toast({ title: "Regla de Tarifa Dinámica Creada" });
    }
    setShowForm(false);
    setCurrentRule(null);
    setFormData({ name: '', timeStart: '', timeEnd: '', days: [], multiplier: 1.2, zoneId: 'ALL', isActive: true });
  };

  const handleEdit = (rule) => {
    setCurrentRule(rule);
    setFormData({ ...rule });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setSurgeRules(surgeRules.filter(r => r.id !== id));
    toast({ title: "Regla Eliminada", variant: "destructive" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">Gestión de Tarifas Dinámicas (Surge)</h2>
        <Button onClick={() => { setShowForm(true); setCurrentRule(null); setFormData({ name: '', timeStart: '', timeEnd: '', days: [], multiplier: 1.2, zoneId: 'ALL', isActive: true }); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nueva Regla de Tarifa Dinámica
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
          <h3 className="text-lg font-medium text-slate-700">{currentRule ? 'Editar' : 'Nueva'} Regla</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="ruleName">Nombre de la Regla</Label><Input id="ruleName" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Pico Mañana Centro" className="mt-1" required /></div>
            <div><Label htmlFor="ruleZoneId">ID de Zona (o 'ALL')</Label><Input id="ruleZoneId" name="zoneId" value={formData.zoneId} onChange={handleInputChange} placeholder="Ej: ZONE001 o ALL" className="mt-1" required /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label htmlFor="ruleTimeStart">Hora Inicio</Label><Input id="ruleTimeStart" name="timeStart" type="time" value={formData.timeStart} onChange={handleInputChange} className="mt-1" required /></div>
            <div><Label htmlFor="ruleTimeEnd">Hora Fin</Label><Input id="ruleTimeEnd" name="timeEnd" type="time" value={formData.timeEnd} onChange={handleInputChange} className="mt-1" required /></div>
            <div><Label htmlFor="ruleMultiplier">Multiplicador</Label><Input id="ruleMultiplier" name="multiplier" type="number" step="0.1" value={formData.multiplier} onChange={handleInputChange} placeholder="Ej: 1.5" className="mt-1" required /></div>
          </div>
          <div>
            <Label>Días de la Semana</Label>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {daysOfWeek.map(day => (
                <Button key={day} type="button" variant={formData.days.includes(day) ? "default" : "outline"} onClick={() => handleDaysChange(day)} className={`text-xs ${formData.days.includes(day) ? 'bg-blue-500 text-white' : 'border-slate-300'}`}>{day.substring(0,3)}</Button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="ruleIsActive">Activa</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Switch id="ruleIsActive" name="isActive" checked={formData.isActive} onCheckedChange={(checked) => handleSwitchChange('isActive', checked)} />
              <span className="text-sm">{formData.isActive ? 'Habilitada' : 'Deshabilitada'}</span>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentRule(null); }}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Guardar Regla</Button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {surgeRules.map((rule) => (
          <motion.div key={rule.id} layout className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h4 className="text-md font-semibold text-slate-800">{rule.name}</h4>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border mt-1 sm:mt-0 ${rule.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {rule.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-slate-600">
              <div className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> {rule.timeStart} - {rule.timeEnd}</div>
              <div className="flex items-center col-span-2 sm:col-span-1"><Zap className="w-3.5 h-3.5 mr-1.5 text-yellow-500" /> Multiplicador: {rule.multiplier}x</div>
              <div className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Zona: {rule.zoneId}</div>
            </div>
            <p className="mt-1 text-xs text-slate-500">Días: {rule.days.join(', ') || 'Ninguno seleccionado'}</p>
            <div className="mt-3 flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(rule)} className="text-xs"><Edit2 className="w-3.5 h-3.5 mr-1" /> Editar</Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(rule.id)} className="text-xs text-red-600 border-red-300 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>
            </div>
          </motion.div>
        ))}
      </div>
      {surgeRules.length === 0 && <p className="text-center py-8 text-slate-500">No hay reglas de tarifa dinámica configuradas.</p>}
    </motion.div>
  );
};

export default AdminSurgePricingPage;