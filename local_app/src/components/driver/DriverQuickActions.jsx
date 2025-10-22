import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Power, PowerOff, RefreshCw, Loader2, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DriverQuickActions = ({ 
  isOnline, 
  onGoOnline, 
  onGoOffline, 
  onRefreshRides, 
  hasLocationPermission, 
  loading,
  isVerified
}) => {
  const navigate = useNavigate();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {!isOnline ? (
            <Button
              onClick={onGoOnline}
              disabled={loading || !hasLocationPermission || !isVerified}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-2 h-12 disabled:bg-gray-400"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Power className="w-5 h-5" />
              )}
              <span>Conectarse</span>
            </Button>
          ) : (
            <Button
              onClick={onGoOffline}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center space-x-2 h-12"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PowerOff className="w-5 h-5" />
              )}
              <span>Desconectarse</span>
            </Button>
          )}
          
          <Button
            onClick={onRefreshRides}
            disabled={loading || !isOnline || !isVerified}
            variant="outline"
            className="flex items-center justify-center space-x-2 h-12"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            <span>Actualizar</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-2 h-12"
            onClick={() => navigate('/shared-ride')}
            disabled={!isVerified}
          >
            <Route className="w-5 h-5" />
            <span>Ofrecer Viaje</span>
          </Button>
        </div>
        
        {!hasLocationPermission && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Se requiere permiso de ubicación para conectarse y recibir viajes.
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default DriverQuickActions;