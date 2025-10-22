import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { Badge } from '@/components/ui/badge';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('es-AR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
};

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*, user:user_id(full_name, email, user_type)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los retiros.", variant: "destructive" });
      console.error(error);
    } else {
      setWithdrawals(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleApprove = async (withdrawal) => {
    setProcessingId(withdrawal.id);
    // Here you would call your MercadoPago payout function
    // For now, we'll just simulate a success and update the status
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'approved', processed_at: new Date().toISOString() })
      .eq('id', withdrawal.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo aprobar el retiro.", variant: "destructive" });
    } else {
      toast({ title: "Éxito", description: "Retiro aprobado." });
      fetchWithdrawals();
    }
    setProcessingId(null);
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason) return;
    setProcessingId(selectedWithdrawal.id);

    const { error } = await supabase.rpc('reject_withdrawal', {
      p_withdrawal_id: selectedWithdrawal.id,
      p_rejection_reason: rejectionReason
    });

    if (error) {
      toast({ title: "Error", description: "No se pudo rechazar el retiro.", variant: "destructive" });
      console.error(error);
    } else {
      toast({ title: "Éxito", description: "Retiro rechazado y fondos devueltos." });
      fetchWithdrawals();
    }
    setProcessingId(null);
    setRejectModalOpen(false);
    setRejectionReason('');
    setSelectedWithdrawal(null);
  };

  const openRejectModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectModalOpen(true);
  };

  const filteredWithdrawals = withdrawals.filter(w =>
    w.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingWithdrawals = filteredWithdrawals.filter(w => w.status === 'pending');
  const processedWithdrawals = filteredWithdrawals.filter(w => w.status !== 'pending');

  const renderTable = (data, isPending) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Usuario</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Monto</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Datos MP</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Fecha Solicitud</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Estado</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(w => (
            <tr key={w.id}>
              <td className="py-3.5 px-4">
                <p className="font-medium text-slate-700">{w.user?.full_name}</p>
                <p className="text-xs text-slate-500">{w.user?.email}</p>
              </td>
              <td className="py-3.5 px-4 font-bold text-lg text-green-600">{formatCurrencyARS(w.amount)}</td>
              <td className="py-3.5 px-4 font-mono text-xs">
                <p>{w.mercadopago_alias}</p>
                <p>{w.mercadopago_cvu}</p>
              </td>
              <td className="py-3.5 px-4">{formatDate(w.created_at)}</td>
              <td className="py-3.5 px-4">
                {w.status === 'pending' && <Badge variant="warning">Pendiente</Badge>}
                {w.status === 'approved' && <Badge variant="success">Aprobado</Badge>}
                {w.status === 'rejected' && <Badge variant="destructive">Rechazado</Badge>}
              </td>
              <td className="py-3.5 px-4">
                {isPending ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => handleApprove(w)} disabled={processingId === w.id}>
                      {processingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openRejectModal(w)} disabled={processingId === w.id}>
                      {processingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{formatDate(w.processed_at)}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">Gestión de Retiros</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Buscar por usuario, email o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-2" />Pendientes ({pendingWithdrawals.length})</TabsTrigger>
          <TabsTrigger value="processed"><CheckCircle className="w-4 h-4 mr-2" />Procesados ({processedWithdrawals.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto mt-10" /> : renderTable(pendingWithdrawals, true)}
        </TabsContent>
        <TabsContent value="processed">
          {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto mt-10" /> : renderTable(processedWithdrawals, false)}
        </TabsContent>
      </Tabs>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Retiro</DialogTitle>
            <DialogDescription>
              Estás a punto de rechazar el retiro de {formatCurrencyARS(selectedWithdrawal?.amount)} para {selectedWithdrawal?.user?.full_name}. El monto será devuelto a su billetera.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ej: Datos de Mercado Pago incorrectos."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason || processingId === selectedWithdrawal?.id}>
              {processingId === selectedWithdrawal?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminWithdrawalsPage;