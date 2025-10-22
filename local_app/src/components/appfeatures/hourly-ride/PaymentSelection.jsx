
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, CreditCard, Banknote } from 'lucide-react';

const PaymentSelection = ({ paymentMethods, selectedPaymentMethod, onSelectPaymentMethod }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'wallet': return <Wallet className="w-5 h-5 mb-1" />;
      case 'cash': return <Banknote className="w-5 h-5 mb-1" />;
      case 'mercadopago': return <CreditCard className="w-5 h-5 mb-1" />;
      default: return <CreditCard className="w-5 h-5 mb-1" />;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {paymentMethods.map((method) => (
        <Button
          key={method.id}
          variant={selectedPaymentMethod?.id === method.id ? 'default' : 'outline'}
          onClick={() => onSelectPaymentMethod(method)}
          className="h-14 flex-col text-xs"
        >
          {getIcon(method.type)}
          {method.name}
        </Button>
      ))}
    </div>
  );
};

export default PaymentSelection;
  