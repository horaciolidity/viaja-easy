import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle, FileText, User, UserCheck, X } from 'lucide-react';
import { useUserDocuments } from '@/hooks/useUserDocuments';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { reviewDocument } from '@/services/documentService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';

const DocumentRow = ({ doc, onReview, onUserClick }) => (
  <tr className="hover:bg-slate-50 transition-colors duration-150">
    <td className="p-3">
      <button onClick={() => onUserClick(doc.user_id)} className="font-semibold text-blue-600 hover:underline">
        {doc.full_name}
      </button>
      <div className="text-xs text-slate-500">{doc.email}</div>
    </td>
    <td className="p-3">{doc.doc_type}</td>
    <td className="p-3">
      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
        Ver Documento
      </a>
    </td>
    <td className="p-3">{new Date(doc.created_at).toLocaleDateString('es-AR')}</td>
    <td className="p-3">
      <div className="flex gap-2">
        <button
          onClick={() => onReview(doc, 'approved', '')}
          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
        >
          Aprobar
        </button>
        <button
          onClick={() => {
            const reason = prompt("Motivo del rechazo:");
            if (reason) onReview(doc, 'rejected', reason);
          }}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Rechazar
        </button>
      </div>
    </td>
  </tr>
);

const DocumentsTable = ({ documents, onReview, onUserClick, filter }) => {
  const filteredDocs = documents.filter(doc => 
    doc.full_name?.toLowerCase().includes(filter.toLowerCase()) || 
    doc.email?.toLowerCase().includes(filter.toLowerCase()) || 
    doc.doc_type?.toLowerCase().includes(filter.toLowerCase())
  );

  if (filteredDocs.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <FileText className="mx-auto h-12 w-12 text-slate-400" />
        <p className="mt-4">No hay documentos en esta categoría.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left font-semibold p-3 text-slate-600">Usuario</th>
            <th className="text-left font-semibold p-3 text-slate-600">Tipo Doc</th>
            <th className="text-left font-semibold p-3 text-slate-600">Archivo</th>
            <th className="text-left font-semibold p-3 text-slate-600">Fecha</th>
            <th className="text-left font-semibold p-3 text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {filteredDocs.map(doc => (
            <DocumentRow key={`${doc.user_id}-${doc.doc_type}-${doc.doc_id}`} doc={doc} onReview={onReview} onUserClick={onUserClick} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const UserDocumentsAdminPage = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [filter, setFilter] = useState('');
  const { rows, loading, refetch } = useUserDocuments({ status: activeTab, userType: 'all' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { handleSessionError } = useAuth();

  const handleTabChange = (value) => {
    setActiveTab(value);
  };
  
  const handleReview = async (doc, status, reason) => {
    try {
      await reviewDocument({
        docId: doc.doc_id,
        newStatus: status,
        reason: reason,
        docTable: doc.user_type,
        handleSessionError,
      });
      toast({
        title: `Documento ${status === 'approved' ? 'Aprobado' : 'Rechazado'}`,
        description: `El documento de ${doc.full_name} ha sido actualizado.`
      });
      refetch();
    } catch(error) {
       toast({
        title: "Error al revisar documento",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUserClick = (userId) => {
    setSelectedUser(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const onForceVerify = () => {
    refetch(); // Refreshes the documents list after verification
    handleCloseModal();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-slate-800">Revisión de Documentos</h1>
      <Input
        type="text"
        placeholder="Buscar por nombre, email o tipo de documento..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full"
      />
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending"><AlertTriangle className="w-4 h-4 mr-2" />Pendientes</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle className="w-4 h-4 mr-2" />Aprobados</TabsTrigger>
          <TabsTrigger value="rejected"><X className="w-4 h-4 mr-2" />Rechazados</TabsTrigger>
          <TabsTrigger value="all"><FileText className="w-4 h-4 mr-2" />Todos</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Documentos {activeTab}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="ml-2 text-slate-600">Cargando documentos...</p>
              </div>
            ) : (
              <DocumentsTable documents={rows} onReview={handleReview} onUserClick={handleUserClick} filter={filter} />
            )}
          </CardContent>
        </Card>
      </Tabs>
      {isModalOpen && (
        <UserDetailModal 
          userId={selectedUser} 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onForceVerify={onForceVerify}
        />
      )}
    </motion.div>
  );
};

export default UserDocumentsAdminPage;