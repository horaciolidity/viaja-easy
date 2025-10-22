import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const WaitingTimer = ({ arrivedAt, onBillableChange }) => {
  const { settings } = useSettings();

  // Lee del Admin (con fallback)
  const gracePeriodMinutes = useMemo(
    () => parseFloat(settings?.appSettings?.grace_period_minutes ?? 2),
    [settings]
  );
  const waitFeePerMinute = useMemo(
    () => parseFloat(settings?.appSettings?.wait_fee_per_minute ?? 0),
    [settings]
  );
  const currency = settings?.default_currency || 'ARS';
  const gracePeriodSeconds = gracePeriodMinutes * 60;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!arrivedAt) return;
    const arrivalTime = new Date(arrivedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const seconds = Math.floor((now - arrivalTime) / 1000);
      setElapsedSeconds(seconds);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [arrivedAt]);

  const isGracePeriod = elapsedSeconds <= gracePeriodSeconds;
  const remainingSeconds = isGracePeriod ? (gracePeriodSeconds - elapsedSeconds) : 0;
  const chargedSeconds = isGracePeriod ? 0 : (elapsedSeconds - gracePeriodSeconds);

  const progress = Math.min((elapsedSeconds / gracePeriodSeconds) * 100, 100);
  const chargedWholeMinutes = Math.max(0, Math.ceil(chargedSeconds / 60));
  const chargedAmount = chargedWholeMinutes * waitFeePerMinute;

  // Notificar al contenedor (opcional)
  useEffect(() => {
    if (typeof onBillableChange === 'function') {
      onBillableChange({
        chargedSeconds,
        chargedWholeMinutes,
        chargedAmount,
        waitFeePerMinute,
        gracePeriodMinutes,
      });
    }
  }, [chargedSeconds, chargedWholeMinutes, chargedAmount, waitFeePerMinute, gracePeriodMinutes, onBillableChange]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 my-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${isGracePeriod ? 'text-green-500' : 'text-orange-500 animate-pulse'}`} />
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            {isGracePeriod ? 'Tiempo de espera gratuito' : 'Tiempo de espera con cargo'}
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono font-bold text-lg text-slate-800 dark:text-slate-100">
            {isGracePeriod ? formatTime(remainingSeconds) : formatTime(chargedSeconds)}
          </p>
          {!isGracePeriod && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {chargedWholeMinutes} min • {currency} {chargedAmount.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
        <motion.div
          className={`h-2.5 rounded-full ${isGracePeriod ? 'bg-green-500' : 'bg-orange-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
        {isGracePeriod
          ? `Tienes ${gracePeriodMinutes} minutos de espera sin cargo.`
          : `Se está aplicando una tarifa por minuto de espera (${currency} ${waitFeePerMinute}/min).`}
      </p>
    </div>
  );
};

export default WaitingTimer;