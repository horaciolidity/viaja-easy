import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SuspendedAccountNotice = () => {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();

  const handleContactSupport = () => {
    if (profile?.user_type === 'passenger') {
      navigate('/passenger/assistance');
    } else if (profile?.user_type === 'driver') {
      navigate('/driver/assistance');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-red-500/20"
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          Cuenta Suspendida
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Tu cuenta ha sido suspendida temporalmente. No podrás acceder a las funciones de la aplicación.
          <br /><br />
          Si crees que esto es un error, por favor, ponte en contacto con nuestro equipo de asistencia.
        </p>
        <div className="flex flex-col space-y-3">
          <Button
            onClick={handleContactSupport}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base"
          >
            Contactar a Asistencia
          </Button>
          <Button
            variant="ghost"
            onClick={() => logout({ navigate: navigate })}
            className="w-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold py-3 text-base"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SuspendedAccountNotice;