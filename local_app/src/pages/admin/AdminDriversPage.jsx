import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Car, MoreVertical, User, ShieldCheck, ShieldX } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserDetailModal } from '@/components/admin/UserDetailModal';

const DataTable = ({ columns, data, onAction }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
      case 'available':
        return <Badge variant="success">Activo</Badge>;
      case 'inactive':
      case 'offline':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'pending_documents':
        return <Badge variant="warning">Docs Pendientes</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspendido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            {columns.map((col) => (
              <th key={col.accessor} className="text-left py-3 px-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">
                {col.header}
              </th>
            ))}
            <th className="text-left py-3 px-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors duration-150">
              <td className="py-3 px-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={row.avatar_url} />
                    <AvatarFallback><User className="h-5 w-5 text-slate-500" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-800">{row.full_name}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-slate-600">{row.phone || 'N/A'}</td>
              <td className="py-3 px-4 text-slate-600">{row.rating ? row.rating.toFixed(1) : 'N/A'}</td>
              <td className="py-3 px-4">
                {row.verified ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <ShieldX className="h-5 w-5 text-red-500" />}
              </td>
              <td className="py-3 px-4">{getStatusBadge(row.status)}</td>
              <td className="py-3 px-4 text-slate-600">{row.vehicle_info || 'N/A'}</td>
              <td className="py-3 px-4">
                <Button variant="outline" size="sm" onClick={() => onAction(row)}>
                  Ver/Editar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminDriversPage = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchDrivers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, driver_documents(*), wallets!left(balance)')
                .eq('user_type', 'driver')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const formattedData = data.map(d => ({
                id: d.id,
                full_name: d.full_name,
                email: d.email,
                phone: d.phone,
                rating: d.rating,
                verified: d.verified,
                status: d.status,
                vehicle_info: d.vehicle_info ? `${d.vehicle_info.make} ${d.vehicle_info.model} (${d.vehicle_info.year})` : 'N/A',
                avatar_url: d.avatar_url,
                created_at: d.created_at,
                documents: d.driver_documents,
                walletBalance: d.wallets?.[0]?.balance ?? 0,
                account_blocked: d.account_blocked,
                user_type: d.user_type,
            }));
            setDrivers(formattedData);
        } catch (error) {
            console.error("Error fetching drivers:", error);
            toast({ title: "Error al cargar conductores", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    const handleAction = (driver) => {
        setSelectedDriver(driver);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDriver(null);
    };
    
    const handleUpdateUser = (updatedUser) => {
        if (updatedUser._deleted) {
            setDrivers(prev => prev.filter(d => d.id !== updatedUser.id));
        } else {
            setDrivers(prev => prev.map(d => d.id === updatedUser.id ? { ...d, ...updatedUser } : d));
        }
    };

    const columns = [
        { header: 'Nombre', accessor: 'full_name' },
        { header: 'Teléfono', accessor: 'phone' },
        { header: 'Rating', accessor: 'rating' },
        { header: 'Verificado', accessor: 'verified' },
        { header: 'Estado', accessor: 'status' },
        { header: 'Vehículo', accessor: 'vehicle_info' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="ml-2 text-slate-600">Cargando conductores...</p>
            </div>
        );
    }
    
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 sm:p-6">
            <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-800">Gestión de Conductores</CardTitle>
                </CardHeader>
                <CardContent>
                    {drivers.length > 0 ? (
                        <DataTable columns={columns} data={drivers} onAction={handleAction} />
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                            <Car className="mx-auto h-12 w-12 text-slate-400" />
                            <h3 className="mt-4 text-lg font-medium text-slate-900">No hay conductores registrados</h3>
                            <p className="mt-1 text-sm text-slate-500">Cuando los conductores se registren, aparecerán aquí.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            {selectedDriver && (
                <UserDetailModal 
                    user={selectedDriver} 
                    isOpen={isModalOpen} 
                    onClose={handleCloseModal}
                    onUpdate={handleUpdateUser}
                />
            )}
        </motion.div>
    );
};

export default AdminDriversPage;