import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';

const formatCurrencyARS = (amount) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
};

const PendingPaymentsTable = ({ summaries, onProcessPayment, processingPayment }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-orange-500" />
          <span>Saldos Consolidados por Conductor</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summaries.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-500">No hay saldos pendientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Conductor</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Saldo Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Viajes</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Datos MP</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Último Viaje</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((driver) => (
                  <tr key={driver.driver_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-medium text-slate-700">{driver.full_name}</p>
                        <p className="text-xs text-slate-500">{driver.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="text-lg font-bold text-green-600">{formatCurrencyARS(driver.pending_amount)}</p>
                        <p className="text-xs text-slate-500">Pendiente</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-medium text-slate-700">{driver.pending_count}</p>
                        <p className="text-xs text-slate-500">viajes</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-600">
                        {driver.mercadopago_alias && (
                          <p className="text-sm font-mono bg-blue-50 px-2 py-1 rounded">
                            {driver.mercadopago_alias}
                          </p>
                        )}
                        {driver.mercadopago_cvu && (
                          <p className="text-xs font-mono text-slate-500 mt-1">
                            CVU: {driver.mercadopago_cvu.slice(0, 8)}...
                          </p>
                        )}
                        {!driver.mercadopago_alias && !driver.mercadopago_cvu && (
                          <span className="text-red-500 text-sm flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Sin configurar
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-sm">
                      {formatDate(driver.last_pending_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Button
                        onClick={() => onProcessPayment(driver)}
                        disabled={processingPayment === driver.driver_id || (!driver.mercadopago_alias && !driver.mercadopago_cvu)}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
                      >
                        {processingPayment === driver.driver_id ? (
                          'Procesando...'
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3 mr-1" />
                            Pagar Todo
                          </>
                        )}
                      </Button>
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

export default PendingPaymentsTable;