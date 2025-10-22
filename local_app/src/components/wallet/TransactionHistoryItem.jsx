import React from 'react';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { ArrowDownLeft, ArrowUpRight, Car, Gift, AlertTriangle, Wallet, Wrench } from 'lucide-react';

const TransactionHistoryItem = ({ transaction }) => {
  const isCredit = transaction.amount > 0;

  const getIcon = () => {
    const type = transaction.type;
    if (type === 'recharge_mp' || type === 'recharge_cash' || type === 'deposit') return <ArrowDownLeft className={`w-5 h-5 ${isCredit ? 'text-green-500' : 'text-red-500'}`} />;
    if (type === 'payment') return <Car className="w-5 h-5 text-slate-500" />;
    if (type === 'earning') return <ArrowDownLeft className={`w-5 h-5 ${isCredit ? 'text-green-500' : 'text-red-500'}`} />;
    if (type === 'bonus') return <Gift className="w-5 h-5 text-yellow-500" />;
    if (type === 'fee' || type === 'penalty') return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    if (type === 'initialization') return <Wallet className="w-5 h-5 text-blue-500" />;
    if (type === 'manual_adjustment') return <Wrench className="w-5 h-5 text-purple-500" />;
    return isCredit ? <ArrowDownLeft className="w-5 h-5 text-green-500" /> : <ArrowUpRight className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          {getIcon()}
        </div>
        <div>
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{transaction.description}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date(transaction.created_at).toLocaleString('es-AR', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-base ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-200'}`}>
          {isCredit ? '+' : ''}{formatCurrencyARS(transaction.amount)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Saldo: {formatCurrencyARS(transaction.balance_after)}
        </p>
      </div>
    </div>
  );
};

export default TransactionHistoryItem;