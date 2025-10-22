import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient.js'; 
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import { toast } from '@/components/ui/use-toast.js';
import { Loader2 } from 'lucide-react';
import { SingleInvitation, BulkInvitation } from '@/components/admin/UserInvitation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          user_type,
          status,
          created_at,
          updated_at,
          phone,
          verified,
          email, 
          driver_documents (
            status
          ),
          passenger_documents (
            status
          ),
          wallets!wallets_user_id_fkey (
              balance
          )
        `);

      if (profilesError) {
          throw profilesError;
      }
      
      const formattedUsers = profilesData.map(user => ({
          id: user.id,
          name: user.full_name || 'N/A',
          email: user.email || 'N/A (Ver detalles)', 
          type: user.user_type === 'passenger' ? 'Pasajero' : user.user_type === 'driver' ? 'Conductor' : user.user_type === 'admin' ? 'Admin' : 'Desconocido',
          status: user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Desconocido',
          joined: user.created_at,
          lastLogin: user.updated_at, 
          phone: user.phone || 'N/A',
          verified: user.verified,
          documentsVerified: user.verified,
          accountBlocked: user.account_blocked,
          walletBalance: user.wallets && user.wallets.length > 0 ? user.wallets[0].balance : 0,
      }));
      setUsers(formattedUsers);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error al cargar usuarios",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserUpdate = (updatedUser) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-slate-600">Cargando usuarios...</p>
      </div>
    );
  }

  return (
     <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="list">Lista de Usuarios</TabsTrigger>
        <TabsTrigger value="invite">Invitar Usuarios</TabsTrigger>
      </TabsList>
      <TabsContent value="list" className="pt-4">
        <AdminUsersTab usersData={users} onUserUpdate={handleUserUpdate} />
      </TabsContent>
      <TabsContent value="invite" className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SingleInvitation />
          <BulkInvitation />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default AdminUsersPage;