import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Edit2, Trash2, Smartphone, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminAppVersionsPage = () => {
  const [versions, setVersions] = useState([
    { id: 'VER001', platform: 'Android Pasajero', version: '1.5.2', releaseDate: '2025-06-01', status: 'Publicada', notes: 'Corrección de errores menores y mejoras de rendimiento.', forceUpdate: false },
    { id: 'VER002', platform: 'iOS Pasajero', version: '1.5.1', releaseDate: '2025-05-20', status: 'Publicada', notes: 'Nueva función de compartir viaje.', forceUpdate: false },
    { id: 'VER003', platform: 'Android Conductor', version: '1.2.0', releaseDate: '2025-06-05', status: 'Publicada', notes: 'Mejoras en la interfaz de navegación.', forceUpdate: true },
    { id: 'VER004', platform: 'iOS Conductor', version: '1.1.5', releaseDate: '2025-05-15', status: 'Desaprobada', notes: 'Versión anterior, reemplazada por 1.2.0 (simulado).', forceUpdate: false },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [formData, setFormData] = useState({ platform: 'Android Pasajero', version: '', releaseDate: '', status: 'Publicada', notes: '', forceUpdate: false });

  const platforms = ['Android Pasajero', 'iOS Pasajero', 'Android Conductor', 'iOS Conductor'];
  const statuses = ['Desarrollo', 'Pruebas', 'Publicada', 'Desaprobada'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentVersion) {
      setVersions(versions.map(v => v.id === currentVersion.id ? { ...v, ...formData } : v));
      toast({ title: "Versión de App Actualizada" });
    } else {
      const newVersion = { id: `VER${String(versions.length + 1).padStart(3, '0')}`, ...formData };
      setVersions([...versions, newVersion]);
      toast({ title: "Versión de App Agregada" });
    }
    setShowForm(false);
    setCurrentVersion(null);
    setFormData({ platform: 'Android Pasajero', version: '', releaseDate: '', status: 'Publicada', notes: '', forceUpdate: false });
  };

  const handleEdit = (version) => {
    setCurrentVersion(version);
    setFormData({ ...version });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setVersions(versions.filter(v => v.id !== id));
    toast({ title: "Versión Eliminada", variant: "destructive" });
  };

  const getStatusBadge = (status) => {
    if (status === 'Publicada') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Desarrollo') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status === 'Pruebas') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (status === 'Desaprobada') return 'bg-red-100 text-red-700 border-red-200';
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
        <h2 className="text-2xl font-semibold text-slate-800">Gestión de Versiones de Aplicación</h2>
        <Button onClick={() => { setShowForm(true); setCurrentVersion(null); setFormData({ platform: 'Android Pasajero', version: '', releaseDate: '', status: 'Publicada', notes: '', forceUpdate: false }); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nueva Versión
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
          <h3 className="text-lg font-medium text-slate-700">{currentVersion ? 'Editar' : 'Nueva'} Versión</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appPlatform">Plataforma</Label>
              <select id="appPlatform" name="platform" value={formData.platform} onChange={handleInputChange} className="mt-1 block w-full input-class">
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><Label htmlFor="appVersion">Número de Versión</Label><Input id="appVersion" name="version" value={formData.version} onChange={handleInputChange} placeholder="Ej: 1.0.0" className="mt-1" required /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="appReleaseDate">Fecha de Lanzamiento</Label><Input id="appReleaseDate" name="releaseDate" type="date" value={formData.releaseDate} onChange={handleInputChange} className="mt-1" required /></div>
            <div>
              <Label htmlFor="appStatus">Estado</Label>
              <select id="appStatus" name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full input-class">
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><Label htmlFor="appNotes">Notas de la Versión</Label><Textarea id="appNotes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Nuevas funciones, correcciones, etc." className="mt-1" rows={3} /></div>
          <div>
            <Label htmlFor="appForceUpdate">Forzar Actualización</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Switch id="appForceUpdate" name="forceUpdate" checked={formData.forceUpdate} onCheckedChange={(checked) => handleSwitchChange('forceUpdate', checked)} />
              <span className="text-sm">{formData.forceUpdate ? 'Sí, los usuarios deben actualizar' : 'No, es opcional'}</span>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentVersion(null); }}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Guardar Versión</Button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {versions.map((v) => (
          <motion.div key={v.id} layout className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h4 className="text-md font-semibold text-slate-800">{v.platform} - v{v.version}</h4>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border mt-1 sm:mt-0 ${getStatusBadge(v.status)}`}>
                {v.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{v.notes}</p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-500">
              <div>Lanzamiento: {v.releaseDate}</div>
              <div className="flex items-center">
                {v.forceUpdate ? <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-500" /> : <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />}
                Forzar Actualización: {v.forceUpdate ? 'Sí' : 'No'}
              </div>
            </div>
            <div className="mt-3 flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(v)} className="text-xs"><Edit2 className="w-3.5 h-3.5 mr-1" /> Editar</Button>
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:bg-blue-50"><Download className="w-3.5 h-3.5 mr-1" /> Descargar (Sim.)</Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(v.id)} className="text-xs text-red-600 border-red-300 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>
            </div>
          </motion.div>
        ))}
      </div>
      {versions.length === 0 && <p className="text-center py-8 text-slate-500">No hay versiones de aplicación registradas.</p>}
    </motion.div>
  );
};

export default AdminAppVersionsPage;