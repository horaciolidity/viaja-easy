import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, ChevronDown, ChevronUp, UserCheck, UserX, RefreshCcw, MailWarning, Edit, ShieldCheck, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/supabaseClient.js';
import { toast } from '@/components/ui/use-toast.js';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { adminVerifyAccount } from '@/services/adminService';

const AdminUsersTab = ({ usersData = [], onUserUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [localUsers, setLocalUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLocalUsers(usersData);
  }, [usersData]);

  useEffect(() => {
    let sortedUsers = [...localUsers];
    if (sortConfig.key) {
      sortedUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredUsers(
      sortedUsers.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
  }, [searchTerm, localUsers, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };
  
  const getStatusBadge = (status, verified, documentsVerified, accountBlocked) => {
    if (accountBlocked) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">Bloqueado</span>;
    }
    if (status === 'pending_verification' || !verified || !documentsVerified) {
       return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">Pend. Verif.</span>;
    }
    if (status === 'Activo' || status === 'active' || status === 'available') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Activo</span>;
    }
    if (status === 'Suspendido' || status === 'suspended') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">Suspendido</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">{status || 'Desconocido'}</span>;
  };

  const handleUserUpdate = (updatedUser) => {
    if (updatedUser._deleted) {
      setLocalUsers(prevUsers => prevUsers.filter(u => u.id !== updatedUser.id));
    } else {
      setLocalUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    }
    if (selectedUser && selectedUser.id === updatedUser.id) {
      setSelectedUser(prev => ({...prev, ...updatedUser}));
    }
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
  };

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleResendVerificationEmail = async (email) => {
    try {
      const { data, error } = await supabase.rpc('resend_verification_as_admin', {
        p_user_email: email
      });
      
      if (error) throw new Error(error.message);
      if (data && !data.success) throw new Error(data.message);

      toast({ title: "Correo Enviado", description: `Se ha reenviado el correo de verificación a ${email}.` });
    } catch (error) {
      toast({ title: "Error", description: `No se pudo reenviar el correo: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="bg-white rounded-xl shadow-xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-slate-800">Gestión de Usuarios</h2>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-100">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log("Filtrar Activos")}>Activo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Filtrar Suspendidos")}>Suspendido</DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Filtrar Pendientes")}>Pend. Verificación</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log("Filtrar Pasajeros")}>Pasajero</DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Filtrar Conductores")}>Conductor</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                {['Usuario', 'Email', 'Teléfono', 'Tipo', 'Estado', 'Registro', 'Últ. Actividad', 'Acciones'].map((header) => (
                  <th 
                    key={header} 
                    className="text-left py-3 px-4 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => requestSort(header.toLowerCase().replace('ú', 'u').replace('ó', 'o').replace('.', '').replace(' ', ''))}
                  >
                    <div className="flex items-center">
                      {header} {getSortIcon(header.toLowerCase().replace('ú', 'u').replace('ó', 'o').replace('.', '').replace(' ', ''))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm
                        ${user.type === 'Conductor' ? 'bg-green-500' : user.type === 'Pasajero' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <button onClick={() => handleOpenModal(user)} className="font-medium text-slate-800 hover:text-blue-600 text-left">
                        {user.name}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{user.email}</td>
                  <td className="py-3.5 px-4 text-slate-600">{user.phone}</td>
                  <td className="py-3.5 px-4">
                     <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                        ${user.type === 'Conductor' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : user.type === 'Pasajero' ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200' 
                      }`}>
                      {user.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(user.status, user.verified, user.documentsVerified, user.accountBlocked)}</td>
                  <td className="py-3.5 px-4 text-slate-500">{new Date(user.joined).toLocaleDateString('es-AR')}</td>
                  <td className="py-3.5 px-4 text-slate-500">{new Date(user.lastLogin).toLocaleDateString('es-AR')}</td>
                  <td className="py-3.5 px-4">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:bg-slate-200 data-[state=open]:bg-slate-200 p-1.5 h-auto" onClick={() => handleOpenModal(user)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <p className="text-center py-8 text-slate-500">No se encontraron usuarios con los criterios seleccionados.</p>
        )}
      </div>
      {isModalOpen && (
        <UserDetailModal 
          user={selectedUser} 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onUpdate={handleUserUpdate}
        />
      )}
    </motion.div>
  );
};

export default AdminUsersTab;