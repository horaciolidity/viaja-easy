// src/pages/MaintenanceModePage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const MaintenanceModePage = () => {
  const { settings } = useSettings();

  const message =
    settings?.appSettings?.maintenance_message ||
    'La aplicación está en mantenimiento. Volveremos pronto.';

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-700"
      >
        <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 rounded-full shadow-inner">
          <ShieldAlert className="w-12 h-12 text-yellow-500 dark:text-yellow-400" />
        </div>

        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">
          Modo Mantenimiento
        </h1>

        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </p>

        <p className="text-sm text-slate-400 dark:text-slate-500 mt-8">
          Disculpa las molestias. Estamos trabajando para mejorar tu experiencia.
        </p>
      </motion.div>
    </div>
  );
};

export default MaintenanceModePage;
