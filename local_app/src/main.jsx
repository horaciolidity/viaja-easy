import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster.jsx';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerServiceWorker as registerFirebaseSW } from '@/utils/firebase';

const queryClient = new QueryClient();

const registerCacheServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Cache Service Worker registrado con éxito:', registration);
      })
      .catch((error) => {
        console.error('Error en el registro del Cache Service Worker:', error);
      });
  }
};

const initializeApp = () => {
  if (import.meta.env.PROD) {
    registerCacheServiceWorker();
    registerFirebaseSW();
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  
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

initializeApp();