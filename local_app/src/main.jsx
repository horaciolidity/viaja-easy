import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster.jsx';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Cliente de React Query (manejo de caché de datos)
const queryClient = new QueryClient();

/* ============================
   Registrar Service Worker de caché (modo PWA)
   ============================ */
const registerCacheServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Cache Service Worker registrado con éxito:', registration);
      })
      .catch((error) => {
        console.error('❌ Error en el registro del Cache Service Worker:', error);
      });
  }
};

/* ============================
   Inicialización principal de la App
   ============================ */
const initializeApp = () => {
  // Solo registra el SW en producción
  if (import.meta.env.PROD) {
    registerCacheServiceWorker();
  }

  // Montaje principal
  const rootElement = document.getElementById('root');
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster />
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
};

// Arranque
initializeApp();
