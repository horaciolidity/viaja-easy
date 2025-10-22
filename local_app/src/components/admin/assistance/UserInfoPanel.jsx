import React, { useState, useEffect } from 'react';
import { getUserDetailsForAssistance } from '@/services/assistanceService';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Hash, DollarSign, Wallet, FileCheck } from 'lucide-react';

const UserInfoPanel = ({ userId }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                const data = await getUserDetailsForAssistance(userId);
                setDetails(data);
            } catch (error) {
                console.error("Error fetching user details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [userId]);

    if (loading) {
        return <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    }

    if (!details) return <div className="p-4">No se pudieron cargar los detalles.</div>;

    const { profile, wallet, stats, documents } = details;

    return (
        <div className="p-1">
            <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-slate-800">{profile?.full_name}</p>
                    <p className="text-sm text-slate-500">{profile?.email}</p>
                </div>
            </div>
            <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-2"><Star className="w-4 h-4" /> Calificación</span>
                    <span className="font-semibold">{profile?.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-2"><Hash className="w-4 h-4" /> Viajes Totales</span>
                    <span className="font-semibold">{stats?.total_rides || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Gasto Total</span>
                    <span className="font-semibold">${stats?.total_spent?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-2"><Wallet className="w-4 h-4" /> Saldo Billetera</span>
                    <span className="font-semibold">${wallet?.balance?.toFixed(2) || '0.00'}</span>
                </div>
                 <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-2"><FileCheck className="w-4 h-4" /> Documentos</span>
                    <Badge variant={documents?.documents_verified ? 'success' : 'warning'}>
                        {documents?.documents_verified ? 'Verificados' : 'Pendientes'}
                    </Badge>
                </div>
            </div>
        </div>
    );
};

export default UserInfoPanel;