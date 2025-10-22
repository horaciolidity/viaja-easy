import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Search, Clock, CheckCircle } from 'lucide-react';

import PaymentsHeader from '@/components/admin/driver-payments/PaymentsHeader';
import PaymentStats from '@/components/admin/driver-payments/PaymentStats';
import PendingPaymentsTable from '@/components/admin/driver-payments/PendingPaymentsTable';
import CompletedPaymentsTable from '@/components/admin/driver-payments/CompletedPaymentsTable';

import { 
  getDriverPaymentSummaries, 
  getCompletedDriverPayments,
  processBulkDriverPayment,
  getMercadoPagoAccessToken
} from '@/services/adminService';

const AdminDriverPaymentsPage = () => {
  const [driverSummaries, setDriverSummaries] = useState([]);
  const [completedPayments, setCompletedPayments] = useState([]);
  const [accessToken, setAccessToken] = useState('');
  const [processingPayment, setProcessingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [summaries, completed, token] = await Promise.all([
        getDriverPaymentSummaries(),
        getCompletedDriverPayments(),
        getMercadoPagoAccessToken()
      ]);
      setDriverSummaries(summaries);
      setCompletedPayments(completed);
      setAccessToken(token);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcessPayment = async (driverSummary) => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Debes configurar el Access Token de MercadoPago primero",
        variant: "destructive"
      });
      return;
    }

    if (!driverSummary.mercadopago_alias && !driverSummary.mercadopago_cvu) {
      toast({
        title: "Error",
        description: "El conductor no tiene alias o CVU configurado",
        variant: "destructive"
      });
      return;
    }

    setProcessingPayment(driverSummary.driver_id);
    try {
      await processBulkDriverPayment(driverSummary, accessToken);
      toast({
        title: "Pago Exitoso",
        description: `Pago enviado a ${driverSummary.full_name}`,
      });
      fetchData();
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setProcessingPayment(null);
    }
  };

  const filteredDriverSummaries = useMemo(() => driverSummaries.filter(driver =>
    driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.mercadopago_alias?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [driverSummaries, searchTerm]);

  const filteredCompletedPayments = useMemo(() => completedPayments.filter(payment =>
    payment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [completedPayments, searchTerm]);

  const totalPendingAmount = useMemo(() => driverSummaries.reduce((sum, driver) => sum + (driver.pending_amount || 0), 0), [driverSummaries]);
  const totalPaidAmount = useMemo(() => completedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0), [completedPayments]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <PaymentsHeader onUpdateToken={fetchData} />

      <PaymentStats 
        pendingAmount={totalPendingAmount}
        pendingDriversCount={driverSummaries.length}
        paidAmount={totalPaidAmount}
      />

      <div className="relative flex-grow">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Buscar por conductor, email o alias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2.5 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Saldos Pendientes ({filteredDriverSummaries.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Historial de Pagos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingPaymentsTable 
            summaries={filteredDriverSummaries}
            onProcessPayment={handleProcessPayment}
            processingPayment={processingPayment}
          />
        </TabsContent>

        <TabsContent value="completed">
          <CompletedPaymentsTable payments={filteredCompletedPayments} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AdminDriverPaymentsPage;