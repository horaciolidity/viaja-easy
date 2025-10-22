
import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrencyARS } from '@/utils/mercadoPago';

const CostBreakdown = ({ costBreakdown, hours, settings }) => {
  if (!costBreakdown) return null;

  return (
    <motion.div
      className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="text-lg font-semibold mb-4 text-slate-100">Desglose de Costo Estimado</h2>
      <div className="space-y-2 text-sm text-slate-300">
        <div className="flex justify-between">
          <span>Tarifa base ({hours[0]}h)</span>
          <span>{formatCurrencyARS(costBreakdown.baseFare)}</span>
        </div>
        <div className="flex justify-between">
          <span>KM extra ({costBreakdown.extraKm?.toFixed(1)} km)</span>
          <span>{formatCurrencyARS(costBreakdown.extraKmFare)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-400">
          <small>Incluidos: {costBreakdown.totalIncludedKm} km</small>
        </div>
        <div className="flex justify-between border-t border-slate-600 pt-2">
          <span>Comisión de la app ({settings.platform_fee_pct}%)</span>
          <span>{formatCurrencyARS(costBreakdown.platformFee)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t border-slate-500 text-white">
          <span>Total</span>
          <span>{formatCurrencyARS(costBreakdown.totalFare)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CostBreakdown;
  