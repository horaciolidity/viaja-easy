
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const BookingConfirmation = ({ costBreakdown, onConfirm, isLoading, selectedPaymentMethod }) => {
  return (
    <footer
      id="confirm-booking-hourly"
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-4 border-t border-slate-200 dark:border-slate-700"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-slate-600 dark:text-slate-300">Total Estimado</span>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {costBreakdown ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(costBreakdown.totalFare) : '$...'}
        </span>
      </div>
      <Button
        onClick={onConfirm}
        disabled={isLoading || !costBreakdown || !selectedPaymentMethod}
        className="w-full h-14 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-shadow"
      >
        {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : null}
        Confirmar Reserva
      </Button>
    </footer>
  );
};

export default BookingConfirmation;
  