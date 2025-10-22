import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const MaintenanceModePage = () => {
    const { settings } = useSettings();
    const message = settings.appSettings.maintenance_message || "La aplicación está en mantenimiento. Volveremos pronto.";

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center"
            >
                <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center bg-yellow-100 rounded-full">
                    <ShieldAlert className="w-12 h-12 text-yellow-500" />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-3">Modo Mantenimiento</h1>
                <p className="text-slate-600 leading-relaxed">
                    {message}
                </p>
                <p className="text-sm text-slate-400 mt-8">
                    Disculpa las molestias. Estamos trabajando para mejorar tu experiencia.
                </p>
            </motion.div>
        </div>
    );
};

export default MaintenanceModePage;