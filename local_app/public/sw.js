/* eslint-disable no-restricted-globals */

/**
 * Service Worker - ViajaFácil
 * Controla el caché de la app para funcionar offline y actualizar versiones automáticamente.
 */

const CACHE_NAME = 'viajafacil-v8'; // Incrementar versión al actualizar el build
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/car-icon.svg',
];

/* ============================
   INSTALACIÓN
   ============================ */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando nueva versión:', CACHE_NAME);
  self.skipWaiting(); // activa inmediatamente la nueva versión

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Abriendo caché y agregando archivos base...');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.error('[SW] Error al abrir el caché:', err))
  );
});

/* ============================
   ACTIVACIÓN
   ============================ */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  console.log('[SW] Activando y limpiando versiones antiguas...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('[SW] Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ============================
   FETCH: Manejo de peticiones
   ============================ */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar extensiones de navegador, peticiones a Supabase y modelos locales
  if (
    url.protocol === 'chrome-extension:' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/models/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Estrategia "Network first" para imágenes (si no hay red, usa caché)
  if (url.pathname.startsWith('/images/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response('Network error and not in cache', {
              status: 408,
              statusText: 'Request Timeout',
            });
          });
        })
    );
    return;
  }

  // Estrategia "Cache first" para otros GET (HTML, JS, CSS, etc.)
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;

        return fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch((err) => {
            console.error('[SW] Error de red para:', event.request.url, err);
            return new Response('Sin conexión y no está en caché.', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
      })
    );
  }
});

/* ============================
   NOTIFICACIONES (opcional)
   ============================ */
// Si en el futuro querés integrar notificaciones push con Supabase Realtime o WebPush,
// se puede manejar aquí con self.addEventListener('push', ...)
