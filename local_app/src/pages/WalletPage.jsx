import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePayment } from '@/contexts/PaymentContext';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, PlusCircle, Wallet, CreditCard, ArrowLeftRight } from 'lucide-react';
import AddFundsModal from '@/components/wallet/AddFundsModal';
import WithdrawFundsModal from '@/components/wallet/WithdrawFundsModal';
import TransactionHistoryItem from '@/components/wallet/TransactionHistoryItem';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const WalletPage = () => {
  const { wallet, walletHistory, loadingWallet } = usePayment();
  const { profile } = useAuth();
  const [isAddFundsModalOpen, setAddFundsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Billetera</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setWithdrawModalOpen(true)}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Retirar Saldo
          </Button>
          <Button onClick={() => setAddFundsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar Saldo
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-primary to-blue-600 dark:from-sky-600 dark:to-sky-800 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Wallet />
            Saldo Disponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWallet ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : (
            <p className="text-5xl font-bold tracking-tight">{formatCurrencyARS(wallet?.balance || 0)}</p>
          )}
          <p className="text-sm opacity-80 mt-2">Este es tu saldo para pagar viajes y servicios.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Movimientos Recientes</CardTitle>
            <CardDescription>Tu historial de transacciones.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWallet ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : walletHistory.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {walletHistory.map(tx => (
                  <TransactionHistoryItem key={tx.id} transaction={tx} />
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 py-10">No hay movimientos en tu billetera.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Métodos de Pago</CardTitle>
            <CardDescription>Gestiona tus tarjetas y cuentas vinculadas.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full gap-4 text-center">
             <CreditCard className="w-16 h-16 text-slate-300 dark:text-slate-600" />
             <p className="text-slate-600 dark:text-slate-400">Agrega y administra tus métodos de pago para recargas y viajes.</p>
             <Button variant="outline" onClick={() => navigate(`/${profile.user_type}/payment-methods`)}>
                Gestionar Métodos
             </Button>
          </CardContent>
        </Card>
      </div>

      <AddFundsModal isOpen={isAddFundsModalOpen} onClose={() => setAddFundsModalOpen(false)} />
      <WithdrawFundsModal isOpen={isWithdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} />
    </motion.div>
  );
};

export default WalletPage;