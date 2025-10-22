import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, User, TrendingUp } from 'lucide-react';

const formatCurrencyARS = (amount) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount || 0);
};

const PaymentStats = ({ pendingAmount, pendingDriversCount, paidAmount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Pendiente</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrencyARS(pendingAmount)}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Conductores con Saldo</p>
              <p className="text-2xl font-bold text-blue-600">{pendingDriversCount}</p>
            </div>
            <User className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Pagado (Histórico)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrencyARS(paidAmount)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentStats;