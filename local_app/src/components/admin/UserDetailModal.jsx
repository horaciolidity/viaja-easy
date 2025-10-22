import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, X, User, Mail, Phone, ShieldCheck, ShieldX, CheckCircle, UserX as UserXIcon, Trash2, DollarSign, Wallet, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { adminDeleteUser } from '@/services/adminService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

export const UserDetailModal = ({ user: userProp, userId: userIdProp, isOpen, onClose, onUpdate }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const { toast } = useToast();
  const { user: adminUser, startImpersonation } = useAuth();

  const fetchUserDetails = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          wallets:wallets!left(balance)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      
      const normalizedProfile = { ...data, wallet: { balance: data.wallets?.[0]?.balance ?? 0 } };
      setProfile(normalizedProfile);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudieron cargar los detalles del usuario.', variant: 'destructive' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      const idToFetch = userProp?.id || userIdProp;
      if (idToFetch) {
        fetchUserDetails(idToFetch);
      } else {
        setProfile(userProp);
        setLoading(false);
      }
    }
  }, [userProp, userIdProp, isOpen, fetchUserDetails]);

  const toggleVerify = useCallback(async () => {
    if (!profile) return;
    setLoadingVerify(true);
    try {
      const nextVerifiedStatus = !profile.verified;
      const { data, error } = await supabase.rpc('admin_toggle_verification', {
        p_user: profile.id,
        p_verified: nextVerifiedStatus,
      });
      if (error) throw error;

      const newVerifiedState = data?.[0]?.verified ?? nextVerifiedStatus;
      setProfile((prev) => ({ ...prev, verified: newVerifiedState }));
      toast({ title: newVerifiedState ? 'Usuario verificado' : 'Marcado como NO verificado' });
      if (onUpdate) onUpdate({ ...profile, verified: newVerifiedState });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingVerify(false);
    }
  }, [profile, toast, onUpdate]);

  const adjustWallet = async (sign) => {
    const amount = Number(walletAmount || 0) * (sign === 'credit' ? 1 : -1);
    if (!amount || !adminUser) return;

    setLoadingWallet(true);
    try {
      const { data, error } = await supabase.rpc('admin_adjust_wallet', {
        p_user: profile.id,
        p_amount: amount,
        p_reason: walletReason || null,
        p_admin: adminUser.id,
      });
      if (error) throw error;

      const newBal = data?.[0]?.new_balance ?? 0;
      setProfile((prev) => ({
        ...prev,
        wallet: { ...(prev.wallet || {}), balance: newBal },
      }));

      toast({ title: 'Saldo actualizado', description: `Nuevo saldo: ${formatCurrencyARS(newBal)}` });
      setWalletAmount('');
      setWalletReason('');
      if (onUpdate) onUpdate({ ...profile, wallet: { balance: newBal } });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      await adminDeleteUser(profile.id);
      toast({ title: "Usuario Eliminado", description: "El usuario y todos sus datos han sido eliminados.", variant: "success" });
      if (onUpdate) onUpdate({ id: profile.id, _deleted: true });
      onClose();
    } catch (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImpersonate = async () => {
    if (!profile) return;
    setIsImpersonating(true);
    try {
        await startImpersonation(profile);
        toast({ title: "Iniciando sesión como usuario", description: `Ahora estás viendo la app como ${profile.full_name}.` });
        onClose();
    } catch (error) {
        toast({ title: "Error de suplantación", description: error.message, variant: "destructive" });
    } finally {
        setIsImpersonating(false);
    }
  };

  const handleClose = (e) => {
    if (e.target.id === 'modal-backdrop') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="modal-backdrop"
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10">
              <h2 className="text-2xl font-bold text-slate-800">Detalles del Usuario</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                </div>
              ) : profile ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-6">
                    <div className="flex flex-col items-center text-center">
                      <img src={profile.avatar_url || '/images/default-avatar.png'} alt="Avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg" />
                      <div className="flex items-center justify-center mt-4">
                        <h3 className="text-xl font-bold text-slate-900">{profile.full_name || 'Sin Nombre'}</h3>
                        {profile.verified && <ShieldCheck className="w-5 h-5 text-green-500 ml-2" />}
                      </div>
                      <p className="text-sm text-slate-500">{profile.email}</p>
                      <Badge variant={profile.user_type === 'driver' ? 'secondary' : 'outline'} className="mt-2">{profile.user_type}</Badge>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                        <div className="flex items-center text-sm"><Mail className="w-4 h-4 mr-3 text-slate-500" /><span className="text-slate-700">{profile.email}</span></div>
                        <div className="flex items-center text-sm"><Phone className="w-4 h-4 mr-3 text-slate-500" /><span className="text-slate-700">{profile.phone || 'No especificado'}</span></div>
                        <div className="flex items-center text-sm"><Wallet className="w-4 h-4 mr-3 text-slate-500" /><span className="text-slate-700 font-medium">{formatCurrencyARS(profile.wallet?.balance ?? 0)}</span></div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <h4 className="text-lg font-semibold text-slate-800 mb-3">Acciones de Cuenta</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        <Button onClick={handleImpersonate} disabled={isImpersonating} className="bg-indigo-600 hover:bg-indigo-700">
                          {isImpersonating ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <LogIn className="w-4 h-4 mr-2"/>} Entrar como
                        </Button>
                        <Button variant={profile.verified ? 'outline' : 'success'} onClick={toggleVerify} disabled={loadingVerify}>
                          {loadingVerify ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : (profile.verified ? <ShieldX className="w-4 h-4 mr-2"/> : <ShieldCheck className="w-4 h-4 mr-2"/>)}
                          {profile.verified ? 'No Verificar' : 'Verificar'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 col-span-2 lg:col-span-1">
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible y borrará todos los datos del usuario.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Trash2 className="w-4 h-4 mr-2" />} Sí, eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <h4 className="text-lg font-semibold text-slate-800 mb-3">Ajustar Saldo de Billetera</h4>
                      <div className="space-y-4">
                        <div><Label htmlFor="amount">Monto (ARS)</Label><Input id="amount" type="number" placeholder="Ej: 500.00" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} /></div>
                        <div><Label htmlFor="reason">Motivo del ajuste</Label><Input id="reason" type="text" placeholder="Ej: Premio por buen servicio" value={walletReason} onChange={(e) => setWalletReason(e.target.value)} /></div>
                        <div className="flex gap-3">
                          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => adjustWallet('credit')} disabled={loadingWallet}>
                            {loadingWallet ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <DollarSign className="w-4 h-4 mr-2" />} Acreditar
                          </Button>
                          <Button variant="destructive" className="flex-1" onClick={() => adjustWallet('debit')} disabled={loadingWallet}>
                            {loadingWallet ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <DollarSign className="w-4 h-4 mr-2" />} Debitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-10 text-slate-500">No se pudieron cargar los datos del usuario.</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};