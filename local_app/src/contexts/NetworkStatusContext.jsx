import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const NetworkStatusContext = createContext(null);

export const useNetworkStatus = () => {
  const ctx = useContext(NetworkStatusContext);
  if (!ctx) throw new Error('useNetworkStatus debe usarse dentro de NetworkStatusProvider');
  return ctx;
};

/* ============================================================
   NetworkStatusProvider — monitorea red y conexión Supabase
   ============================================================ */
export const NetworkStatusProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(true);

  const lastCheckRef = useRef(0);
  const checkingRef = useRef(false);

  /* -------------------- 🔍 Verificar conexión Supabase -------------------- */
  const checkSupabaseConnection = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (!force && now - lastCheckRef.current < 10_000) return isOnline;

      lastCheckRef.current = now;
      if (checkingRef.current) return isOnline;

      checkingRef.current = true;
      setIsChecking(true);

      if (!navigator.onLine) {
        setIsOnline(false);
        setIsChecking(false);
        checkingRef.current = false;
        return false;
      }

      try {
        // 🧠 Hacemos un ping seguro a Supabase (sin depender del schema)
        const { error } = await supabase.from('profiles').select('id').limit(1);
        const success = !error;
        setIsOnline(success);
        if (!success) console.warn('🔌 Supabase desconectado:', error.message);
        return success;
      } catch (err) {
        console.error('❌ Error comprobando conexión Supabase:', err);
        setIsOnline(false);
        return false;
      } finally {
        setIsChecking(false);
        checkingRef.current = false;
      }
    },
    [isOnline]
  );

  /* -------------------- ⚙️ Listeners del navegador -------------------- */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => checkSupabaseConnection(true), 1000);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Primer chequeo al cargar
    checkSupabaseConnection(true);

    // Revalidar cada 30 segundos
    const intervalId = setInterval(() => {
      checkSupabaseConnection();
    }, 30_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkSupabaseConnection]);

  /* -------------------- 🧩 Valor del contexto -------------------- */
  const value = {
    isOnline,
    isChecking,
    checkSupabaseConnection,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
};
