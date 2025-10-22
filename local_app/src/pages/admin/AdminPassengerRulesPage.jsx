import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Edit2, Trash2, UserCog, ShieldAlert, ListChecks } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminPassengerRulesPage = () => {
  const [rules, setRules] = useState([
    { id: 'RULE001', title: 'Uso Obligatorio de Cinturón de Seguridad', description: 'Todos los pasajeros deben usar el cinturón de seguridad durante todo el viaje.', category: 'Seguridad', severity: 'Alta', isActive: true },
    { id: 'RULE002', title: 'No Fumar ni Vapear', description: 'Está prohibido fumar o vapear dentro del vehículo.', category: 'Comportamiento', severity: 'Alta', isActive: true },
    { id: 'RULE003', title: 'Respeto al Conductor y Vehículo', description: 'Tratar al conductor y al vehículo con respeto. No dañar la propiedad.', category: 'Comportamiento', severity: 'Media', isActive: true },
    { id: 'RULE004', title: 'Máximo Número de Pasajeros', description: 'No exceder la capacidad máxima de pasajeros del vehículo.', category: 'Seguridad', severity: 'Alta', isActive: true },
    { id: 'RULE005', title: 'Cancelaciones y Cargos', description: 'Consultar política de cancelación para evitar cargos.', category: 'Pagos', severity: 'Baja', isActive: false },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Comportamiento', severity: 'Media', isActive: true });

  const categories = ['Seguridad', 'Comportamiento', 'Pagos', 'General'];
  const severities = ['Baja', 'Media', 'Alta'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentRule) {
      setRules(rules.map(r => r.id === currentRule.id ? { ...r, ...formData } : r));
      toast({ title: "Regla Actualizada" });
    } else {
      const newRule = { id: `RULE${String(rules.length + 1).padStart(3, '0')}`, ...formData };
      setRules([...rules, newRule]);
      toast({ title: "Regla Creada" });
    }
    setShowForm(false);
    setCurrentRule(null);
    setFormData({ title: '', description: '', category: 'Comportamiento', severity: 'Media', isActive: true });
  };

  const handleEdit = (rule) => {
    setCurrentRule(rule);
    setFormData({ ...rule });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setRules(rules.filter(r => r.id !== id));
    toast({ title: "Regla Eliminada", variant: "destructive" });
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'Alta') return 'bg-red-100 text-red-700 border-red-200';
    if (severity === 'Media') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (severity === 'Baja') return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">Reglas y Políticas para Pasajeros</h2>
        <Button onClick={() => { setShowForm(true); setCurrentRule(null); setFormData({ title: '', description: '', category: 'Comportamiento', severity: 'Media', isActive: true }); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nueva Regla
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
          <div><Label htmlFor="ruleTitle">Título de la Regla</Label><Input id="ruleTitle" name="title" value={formData.title} onChange={handleInputChange} placeholder="Ej: Uso de Cinturón" className="mt-1" required /></div>
          <div><Label htmlFor="ruleDescription">Descripción Detallada</Label><Textarea id="ruleDescription" name="description" value={formData.description} onChange={handleInputChange} placeholder="Explicación de la regla" className="mt-1" rows={3} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ruleCategory">Categoría</Label>
              <select id="ruleCategory" name="category" value={formData.category} onChange={handleInputChange} className="mt-1 block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="ruleSeverity">Severidad</Label>
              <select id="ruleSeverity" name="severity" value={formData.severity} onChange={handleInputChange} className="mt-1 block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                {severities.map(sev => <option key={sev} value={sev}>{sev}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="ruleIsActive">Activa</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Switch id="ruleIsActive" name="isActive" checked={formData.isActive} onCheckedChange={(checked) => handleSwitchChange('isActive', checked)} />
              <span className="text-sm">{formData.isActive ? 'Vigente' : 'No Vigente'}</span>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentRule(null); }}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Guardar Regla</Button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {rules.map((rule) => (
          <motion.div key={rule.id} layout className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h4 className="text-md font-semibold text-slate-800">{rule.title}</h4>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border mt-1 sm:mt-0 ${rule.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {rule.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{rule.description}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <div className="flex items-center"><ListChecks className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Categoría: {rule.category}</div>
              <div className="flex items-center">
                <ShieldAlert className={`w-3.5 h-3.5 mr-1.5 ${getSeverityBadge(rule.severity).split(' ')[1]}`} /> Severidad: 
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityBadge(rule.severity)}`}>{rule.severity}</span>
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(rule)} className="text-xs"><Edit2 className="w-3.5 h-3.5 mr-1" /> Editar</Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(rule.id)} className="text-xs text-red-600 border-red-300 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>
            </div>
          </motion.div>
        ))}
      </div>
      {rules.length === 0 && <p className="text-center py-8 text-slate-500">No hay reglas para pasajeros configuradas.</p>}
    </motion.div>
  );
};

export default AdminPassengerRulesPage;