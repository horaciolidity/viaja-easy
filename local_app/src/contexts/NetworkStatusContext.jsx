import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const NetworkStatusContext = createContext();

export const useNetworkStatus = () => {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus debe usarse dentro de NetworkStatusProvider');
  }
  return context;
};

export const NetworkStatusProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(true);
  const checkTimeoutRef = useRef(null);
  const isCheckingRef = useRef(false);
  const lastChecked = useRef(0);

  const checkSupabaseConnection = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastChecked.current < 10000) {
      return isOnline;
    }
    lastChecked.current = now;

    if (isCheckingRef.current) {
      return isOnline;
    }
    isCheckingRef.current = true;
    setIsChecking(true);
    
    if (!navigator.onLine) {
      setIsOnline(false);
      setIsChecking(false);
      isCheckingRef.current = false;
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('get_my_user_type');
      
      const isNetworkError = error && error.message.toLowerCase().includes('failed to fetch');
      const isAuthError = error && (error.code === '401' || error.message.toLowerCase().includes('invalid jwt'));

      const currentlyOnline = !isNetworkError || isAuthError;
      
      setIsOnline(currentlyOnline);
      if (!currentlyOnline) {
          console.warn("NetworkStatus: Supabase check failed, assuming offline.", error?.message);
      }
      return currentlyOnline;
    } catch (e) {
      console.error("NetworkStatus: Supabase check threw an exception, assuming offline.", e);
      setIsOnline(false);
      return false;
    } finally {
      setIsChecking(false);
      isCheckingRef.current = false;
    }
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = setTimeout(() => checkSupabaseConnection(true), 500);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    checkSupabaseConnection(true);

    const intervalId = setInterval(() => {
      checkSupabaseConnection();
    }, 30000); 

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [checkSupabaseConnection]);

  const value = { isOnline, isChecking, checkSupabaseConnection };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
};