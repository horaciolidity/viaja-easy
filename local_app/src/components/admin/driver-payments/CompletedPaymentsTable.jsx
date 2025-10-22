import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, DollarSign } from 'lucide-react';

const formatCurrencyARS = (amount) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
};

const CompletedPaymentsTable = ({ payments }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>Historial de Pagos Completados</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">No hay pagos completados aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Fecha Pago</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Conductor</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Monto</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">ID Transacción MP</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-medium text-slate-700">{payment.profiles?.full_name}</p>
                        <p className="text-xs text-slate-500">{payment.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {formatCurrencyARS(payment.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-blue-600 font-mono text-xs">
                      {payment.mercadopago_transaction_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full border border-green-200">
                        Pagado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompletedPaymentsTable;