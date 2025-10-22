import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Edit2, Trash2, FileCheck2, ShieldCheck, CalendarDays, Car } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminDriverRequirementsPage = () => {
  const [requirements, setRequirements] = useState([
    { id: 'REQ001', name: 'Licencia de Conducir Vigente', description: 'Clase D (Profesional). Mínimo 2 años de antigüedad.', documentType: 'Licencia de Conducir', isMandatory: true, checkFrequencyMonths: 12 },
    { id: 'REQ002', name: 'Cédula de Identificación del Vehículo', description: 'Cédula verde o azul a nombre del conductor o autorizado.', documentType: 'Cédula Vehicular', isMandatory: true, checkFrequencyMonths: 0 },
    { id: 'REQ003', name: 'Seguro del Automotor Vigente', description: 'Cobertura de Responsabilidad Civil como mínimo.', documentType: 'Póliza de Seguro', isMandatory: true, checkFrequencyMonths: 6 },
    { id: 'REQ004', name: 'Certificado de Antecedentes Penales', description: 'Emitido por el Registro Nacional de Reincidencia. No mayor a 30 días.', documentType: 'Cert. Antecedentes', isMandatory: true, checkFrequencyMonths: 12 },
    { id: 'REQ005', name: 'Vehículo Modelo 2010 en adelante', description: 'El vehículo debe tener una antigüedad máxima de 15 años.', documentType: 'Inspección Vehicular', isMandatory: true, checkFrequencyMonths: 0 },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [currentRequirement, setCurrentRequirement] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', documentType: '', isMandatory: true, checkFrequencyMonths: 0 });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value) }));
  };
  
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentRequirement) {
      setRequirements(requirements.map(r => r.id === currentRequirement.id ? { ...r, ...formData } : r));
      toast({ title: "Requisito Actualizado" });
    } else {
      const newRequirement = { id: `REQ${String(requirements.length + 1).padStart(3, '0')}`, ...formData };
      setRequirements([...requirements, newRequirement]);
      toast({ title: "Requisito Creado" });
    }
    setShowForm(false);
    setCurrentRequirement(null);
    setFormData({ name: '', description: '', documentType: '', isMandatory: true, checkFrequencyMonths: 0 });
  };

  const handleEdit = (req) => {
    setCurrentRequirement(req);
    setFormData({ ...req });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setRequirements(requirements.filter(r => r.id !== id));
    toast({ title: "Requisito Eliminado", variant: "destructive" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">Requisitos para Conductores</h2>
        <Button onClick={() => { setShowForm(true); setCurrentRequirement(null); setFormData({ name: '', description: '', documentType: '', isMandatory: true, checkFrequencyMonths: 0 }); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nuevo Requisito
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
          <h3 className="text-lg font-medium text-slate-700">{currentRequirement ? 'Editar' : 'Nuevo'} Requisito</h3>
          <div><Label htmlFor="reqName">Nombre del Requisito</Label><Input id="reqName" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Licencia de Conducir Vigente" className="mt-1" required /></div>
          <div><Label htmlFor="reqDescription">Descripción Detallada</Label><Textarea id="reqDescription" name="description" value={formData.description} onChange={handleInputChange} placeholder="Detalles específicos del requisito" className="mt-1" rows={3} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="reqDocType">Tipo de Documento Asociado</Label><Input id="reqDocType" name="documentType" value={formData.documentType} onChange={handleInputChange} placeholder="Ej: Licencia, Cédula, Seguro" className="mt-1" /></div>
            <div><Label htmlFor="reqCheckFreq">Frecuencia de Verificación (Meses, 0 si no aplica)</Label><Input id="reqCheckFreq" name="checkFrequencyMonths" type="number" value={formData.checkFrequencyMonths} onChange={handleInputChange} placeholder="Ej: 12" className="mt-1" /></div>
          </div>
          <div>
            <Label htmlFor="reqIsMandatory">Obligatorio</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Switch id="reqIsMandatory" name="isMandatory" checked={formData.isMandatory} onCheckedChange={(checked) => handleSwitchChange('isMandatory', checked)} />
              <span className="text-sm">{formData.isMandatory ? 'Sí, es obligatorio' : 'No, es opcional'}</span>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentRequirement(null); }}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Guardar Requisito</Button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {requirements.map((req) => (
          <motion.div key={req.id} layout className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h4 className="text-md font-semibold text-slate-800">{req.name}</h4>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border mt-1 sm:mt-0 ${req.isMandatory ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                {req.isMandatory ? 'Obligatorio' : 'Opcional'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{req.description}</p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
              <div className="flex items-center"><FileCheck2 className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Documento: {req.documentType || 'N/A'}</div>
              <div className="flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-1.5 text-green-500" /> Verif. cada: {req.checkFrequencyMonths > 0 ? `${req.checkFrequencyMonths} meses` : 'Una vez'}</div>
            </div>
            <div className="mt-3 flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(req)} className="text-xs"><Edit2 className="w-3.5 h-3.5 mr-1" /> Editar</Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(req.id)} className="text-xs text-red-600 border-red-300 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>
            </div>
          </motion.div>
        ))}
      </div>
      {requirements.length === 0 && <p className="text-center py-8 text-slate-500">No hay requisitos para conductores configurados.</p>}
    </motion.div>
  );
};

export default AdminDriverRequirementsPage;