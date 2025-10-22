/* eslint-disable no-restricted-globals */

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const urlParams = new URL(location).searchParams;
const firebaseConfig = {};
for (const [key, value] of urlParams.entries()) {
  firebaseConfig[key] = value;
}

if (firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log(
            '[firebase-messaging-sw.js] Received background message ',
            payload
        );
        
        const notificationTitle = payload.notification.title || 'Nueva Notificación';
        const notificationOptions = {
            body: payload.notification.body,
            icon: 'https://wlssatbhutozvryrejzv.supabase.co/storage/v1/object/public/assets/logo.png',
            sound: payload.data?.sound ? `/sounds/${payload.data.sound}.mp3` : '/sounds/notificacion_default.mp3',
            data: {
                url: payload.fcmOptions?.link || self.location.origin,
            }
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        const urlToOpen = event.notification.data?.url || self.location.origin;
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    });

} else {
    console.error("Firebase config not found in service worker. Notifications will not work in the background.");
}