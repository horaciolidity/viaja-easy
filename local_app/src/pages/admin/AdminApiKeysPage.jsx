import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit2, Trash2, KeyRound, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState([
    { id: 'KEY001', name: 'Servicio de Mapas (Google Maps)', key: 'AIzaSyC...exampleKey...w5c', status: 'Activa', creationDate: '2024-01-15', lastUsed: '2025-06-08' },
    { id: 'KEY002', name: 'Pasarela de Pagos (MercadoPago)', key: 'APP_USR-123...example...XYZ', status: 'Activa', creationDate: '2024-02-01', lastUsed: '2025-06-09' },
    { id: 'KEY003', name: 'Notificaciones Push (Firebase)', key: 'AAAA987...example...DEF', status: 'Revocada', creationDate: '2023-11-10', lastUsed: '2025-03-01' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [currentKey, setCurrentKey] = useState(null);
  const [formData, setFormData] = useState({ name: '', key: '', status: 'Activa' });
  const [showKeyValue, setShowKeyValue] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentKey) {
      setApiKeys(apiKeys.map(k => k.id === currentKey.id ? { ...k, ...formData, lastUsed: k.lastUsed, creationDate: k.creationDate } : k));
      toast({ title: "Clave API Actualizada" });
    } else {
      const newKey = { 
        id: `KEY${String(apiKeys.length + 1).padStart(3, '0')}`, 
        ...formData, 
        creationDate: new Date().toISOString().split('T')[0],
        lastUsed: 'Nunca'
      };
      setApiKeys([...apiKeys, newKey]);
      toast({ title: "Clave API Creada" });
    }
    setShowForm(false);
    setCurrentKey(null);
    setFormData({ name: '', key: '', status: 'Activa' });
  };

  const handleEdit = (key) => {
    setCurrentKey(key);
    setFormData({ name: key.name, key: key.key, status: key.status });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
    toast({ title: "Clave API Eliminada", variant: "destructive" });
  };

  const toggleShowKey = (id) => {
    setShowKeyValue(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "La clave API ha sido copiada al portapapeles." });
  };
  
  const getStatusBadge = (status) => {
    if (status === 'Activa') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Revocada') return 'bg-red-100 text-red-700 border-red-200';
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
        <h2 className="text-2xl font-semibold text-slate-800">Gestión de Claves API</h2>
        <Button onClick={() => { setShowForm(true); setCurrentKey(null); setFormData({ name: '', key: '', status: 'Activa' }); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nueva Clave API
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
          <h3 className="text-lg font-medium text-slate-700">{currentKey ? 'Editar' : 'Nueva'} Clave API</h3>
          <div><Label htmlFor="apiKeyName">Nombre / Descripción</Label><Input id="apiKeyName" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Google Maps Geocoding API" className="mt-1" required /></div>
          <div><Label htmlFor="apiKeyValue">Valor de la Clave</Label><Input id="apiKeyValue" name="key" value={formData.key} onChange={handleInputChange} placeholder="Pegar clave aquí" className="mt-1" required /></div>
          <div>
            <Label htmlFor="apiKeyStatus">Estado</Label>
            <select id="apiKeyStatus" name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              <option value="Activa">Activa</option>
              <option value="Revocada">Revocada</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentKey(null); }}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Guardar Clave</Button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <motion.div key={apiKey.id} layout className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h4 className="text-md font-semibold text-slate-800">{apiKey.name}</h4>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border mt-1 sm:mt-0 ${getStatusBadge(apiKey.status)}`}>
                {apiKey.status}
              </span>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <Input 
                type={showKeyValue[apiKey.id] ? "text" : "password"} 
                value={apiKey.key} 
                readOnly 
                className="text-xs text-slate-600 border-none p-0 h-auto bg-transparent flex-grow focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button variant="ghost" size="sm" onClick={() => toggleShowKey(apiKey.id)} className="p-1 h-auto text-slate-500 hover:bg-slate-100">
                {showKeyValue[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiKey.key)} className="p-1 h-auto text-slate-500 hover:bg-slate-100">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-xs text-slate-500">
              <p>Creada: {apiKey.creationDate}</p>
              <p>Último Uso: {apiKey.lastUsed}</p>
            </div>
            <div className="mt-3 flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(apiKey)} className="text-xs"><Edit2 className="w-3.5 h-3.5 mr-1" /> Editar</Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(apiKey.id)} className="text-xs text-red-600 border-red-300 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>
            </div>
          </motion.div>
        ))}
      </div>
      {apiKeys.length === 0 && <p className="text-center py-8 text-slate-500">No hay claves API configuradas.</p>}
    </motion.div>
  );
};

export default AdminApiKeysPage;