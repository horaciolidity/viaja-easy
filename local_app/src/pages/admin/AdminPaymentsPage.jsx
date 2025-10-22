import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, DollarSign, CreditCard, CalendarDays, User, Eye } from 'lucide-react';

const AdminPaymentsPage = () => {
  const mockPayments = [
    { id: 'PAY001', rideId: 'RIDE001', user: 'Juan Pérez', amount: 1250.75, method: 'MercadoPago', date: '2025-06-08', status: 'Completado' },
    { id: 'PAY002', rideId: 'RIDE002', user: 'Ana Gómez', amount: 980.00, method: 'Efectivo', date: '2025-06-08', status: 'Pendiente Conductor' },
    { id: 'PAY003', rideId: 'RIDE004', user: 'Pedro Martín', amount: 1500.00, method: 'MercadoPago', date: '2025-06-07', status: 'Reembolsado' },
  ];

  const getStatusBadge = (status) => {
    if (status === 'Completado') return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full border border-green-200">{status}</span>;
    if (status === 'Pendiente Conductor') return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">{status}</span>;
    if (status === 'Reembolsado') return <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full border border-purple-200">{status}</span>;
    return <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200">{status}</span>;
  };

  const getPaymentMethodIcon = (method) => {
    if (method === 'MercadoPago') return <CreditCard className="w-4 h-4 text-blue-500" />;
    if (method === 'Efectivo') return <DollarSign className="w-4 h-4 text-green-500" />;
    return <CreditCard className="w-4 h-4 text-slate-500" />;
  };
  
  const formatCurrencyARS = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">Gestión de Pagos</h2>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por ID, usuario..."
              className="pl-10 pr-4 py-2.5 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
            />
          </div>
          <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-100">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-600">ID Pago</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">ID Viaje</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Usuario</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Monto</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Método</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Fecha</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Estado</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                <td className="py-3.5 px-4 font-medium text-blue-600">{payment.id}</td>
                <td className="py-3.5 px-4 text-slate-600">{payment.rideId}</td>
                <td className="py-3.5 px-4 text-slate-700">{payment.user}</td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">{formatCurrencyARS(payment.amount)}</td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-1.5">
                    {getPaymentMethodIcon(payment.method)}
                    <span className="text-slate-600">{payment.method}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600">{payment.date}</td>
                <td className="py-3.5 px-4">{getStatusBadge(payment.status)}</td>
                <td className="py-3.5 px-4">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100 p-1.5 h-auto">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mockPayments.length === 0 && (
        <p className="text-center py-8 text-slate-500">No hay pagos para mostrar.</p>
      )}
      <div className="mt-6 flex justify-end">
        <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-100">
          Ver Más Pagos
        </Button>
      </div>
    </motion.div>
  );
};

export default AdminPaymentsPage;