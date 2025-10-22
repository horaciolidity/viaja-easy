import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import MercadoPagoSettings from './MercadoPagoSettings';

const PaymentsHeader = ({ onUpdateToken }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold text-slate-800">Pagos a Conductores</h2>
      <MercadoPagoSettings onUpdateToken={onUpdateToken} />
    </div>
  );
};

export default PaymentsHeader;