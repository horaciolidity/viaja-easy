import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';
import { WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NetworkStatusBanner = () => {
  const { isOnline, isChecking, checkSupabaseConnection } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } }}
          exit={{ opacity: 0, y: -60 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white shadow-lg"
          style={{paddingTop: 'env(safe-area-inset-top)'}}
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <WifiOff className="w-5 h-5 mr-3 flex-shrink-0" />
              <div className="text-sm font-medium">
                <p>Error de Conexión</p>
                <p className="font-normal text-xs opacity-90 hidden sm:block">No se puede conectar al servidor. Revisa tu conexión a internet.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSupabaseConnection}
              disabled={isChecking}
              className="bg-transparent border-white text-white hover:bg-white hover:text-red-600 shrink-0"
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reintentar'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatusBanner;