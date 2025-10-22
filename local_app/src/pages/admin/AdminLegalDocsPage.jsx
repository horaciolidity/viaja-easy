import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit2, Trash2, FileBadge, CalendarDays, Eye } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AdminLegalDocsPage = () => {
  const [documents, setDocuments] = useState([
    { id: 'LEGAL001', title: 'Términos y Condiciones del Servicio', version: '2.1', lastUpdated: '2025-05-15', status: 'Publicado', contentPreview: 'Estos términos rigen el uso de la plataforma UberApp...' },
    { id: 'LEGAL002', title: 'Política de Privacidad', version: '1.5', lastUpdated: '2025-04-20', status: 'Publicado', contentPreview: 'Nos comprometemos a proteger su privacidad y datos personales...' },
    { id: 'LEGAL003', title: 'Acuerdo con Conductores', version: '1.0', lastUpdated: '2025-03-01', status: 'Borrador', contentPreview: 'Este acuerdo establece los términos para los conductores...' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [formData, setFormData] = useState({ title: '', version: '', content: '', status: 'Borrador' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    if (currentDoc) {
      setDocuments(documents.map(d => d.id === currentDoc.id ? { ...d, ...formData, lastUpdated: today, contentPreview: formData.content.substring(0, 100) + '...' } : d));
      toast({ title: "Documento Legal Actualizado" });
    } else {
      const newDoc = { 
        id: `LEGAL${String(documents.length + 1).padStart(3, '0')}`, 
        ...formData, 
        lastUpdated: today,
        contentPreview: formData.content.substring(0, 100) + '...'
      };
      setDocuments([...documents, newDoc]);
      toast({ title: "Documento Legal Creado" });
    }
    setShowForm(false);
    setCurrentDoc(null);
    setFormData({ title: '', version: '', content: '', status: 'Borrador' });
  };

  const handleEdit = (doc) => {
    setCurrentDoc(doc);
    setFormData({ title: doc.title, version: doc.version, content: doc.contentPreview.endsWith('...') ? 'Contenido completo aquí...' : doc.contentPreview, status: doc.status });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDocuments(documents.filter(d => d.id !== id));
    toast({ title: "Documento Legal Eliminado", variant: "destructive" });
  };
  
  const getStatusBadge = (status) => {
    if (status === 'Publicado') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Borrador') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (status === 'Archivado') return 'bg-slate-100 text-slate-700 border-slate-200';
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
        <h2 className="text-2xl font-semibold text-slate-800">Gestión de Documentos Legales</h2>
        <Button onClick={() => { setShowForm(true); setCurrentDoc(null); setFormData({ title: '', version: '', content: '', status: 'Borrador' }); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nuevo Documento Legal
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
          <h3 className="text-lg font-medium text-slate-700">{currentDoc ? 'Editar' : 'Nuevo'} Documento</h3>
          <div><Label htmlFor="docTitle">Título del Documento</Label><Input id="docTitle" name="title" value={formData.title} onChange={handleInputChange} placeholder="Ej: Términos y Condiciones" className="mt-1" required /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label htmlFor="docVersion">Versión</Label><Input id="docVersion" name="version" value={formData.version} onChange={handleInputChange} placeholder="Ej: 1.0" className="mt-1" required /></div>
            <div>
              <Label htmlFor="docStatus">Estado</Label>
              <select id="docStatus" name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="Borrador">Borrador</option>
                <option value="Publicado">Publicado</option>
                <option value="Archivado">Archivado</option>
              </select>
            </div>
          </div>
          <div><Label htmlFor="docContent">Contenido del Documento (Markdown o HTML)</Label><Textarea id="docContent" name="content" value={formData.content} onChange={handleInputChange} placeholder="Escriba o pegue el contenido completo aquí..." className="mt-1 min-h-[200px]" rows={10} /></div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentDoc(null); }}>Cancelar</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Guardar Documento</Button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {documents.map((doc) => (
          <motion.div key={doc.id} layout className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h4 className="text-md font-semibold text-slate-800">{doc.title} (v{doc.version})</h4>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border mt-1 sm:mt-0 ${getStatusBadge(doc.status)}`}>
                {doc.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 truncate">{doc.contentPreview}</p>
            <div className="mt-2 text-xs text-slate-500">
              <CalendarDays className="w-3.5 h-3.5 mr-1.5 inline-block" /> Última Actualización: {doc.lastUpdated}
            </div>
            <div className="mt-3 flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(doc)} className="text-xs"><Edit2 className="w-3.5 h-3.5 mr-1" /> Editar</Button>
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:bg-blue-50"><Eye className="w-3.5 h-3.5 mr-1" /> Ver Completo</Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(doc.id)} className="text-xs text-red-600 border-red-300 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar</Button>
            </div>
          </motion.div>
        ))}
      </div>
      {documents.length === 0 && <p className="text-center py-8 text-slate-500">No hay documentos legales configurados.</p>}
    </motion.div>
  );
};

export default AdminLegalDocsPage;