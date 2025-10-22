// Notification utilities for push notifications and in-app notifications
export class NotificationService {
  constructor() {
    this.permission = null;
    this.registration = null;
    this.callbacks = new Set();
  }

  // Initialize notification service
  async initialize() {
    if (!('Notification' in window)) {
      throw new Error('Este navegador no soporta notificaciones');
    }

    this.permission = Notification.permission;
    
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    // Register service worker for push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado correctamente');
      } catch (error) {
        console.error('Error registrando Service Worker:', error);
      }
    }

    return this.permission === 'granted';
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Este navegador no soporta notificaciones');
    }

    this.permission = await Notification.requestPermission();
    return this.permission === 'granted';
  }

  // Show local notification
  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Permisos de notificación no concedidos');
      return null;
    }

    const defaultOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false
    };

    const finalOptions = { ...defaultOptions, ...options };

    if (this.registration && this.registration.showNotification) {
      // Use service worker for better notification handling
      return this.registration.showNotification(title, finalOptions);
    } else {
      // Fallback to basic notification
      return new Notification(title, finalOptions);
    }
  }

  // Show ride-related notifications
  showRideNotification(type, data) {
    const notifications = {
      'ride_request': {
        title: '¡Nueva solicitud de viaje!',
        body: `Pasajero: ${data.passengerName}\nDestino: ${data.destination}`,
        icon: '/icons/ride-request.png',
        tag: 'ride-request',
        requireInteraction: true,
        actions: [
          { action: 'accept', title: 'Aceptar' },
          { action: 'decline', title: 'Rechazar' }
        ]
      },
      'ride_accepted': {
        title: 'Viaje aceptado',
        body: `Tu conductor ${data.driverName} está en camino`,
        icon: '/icons/ride-accepted.png',
        tag: 'ride-accepted'
      },
      'driver_arriving': {
        title: 'Tu conductor está llegando',
        body: `${data.driverName} llegará en ${data.eta} minutos`,
        icon: '/icons/driver-arriving.png',
        tag: 'driver-arriving',
        vibrate: [300, 100, 300]
      },
      'ride_started': {
        title: 'Viaje iniciado',
        body: 'Tu viaje ha comenzado. ¡Buen viaje!',
        icon: '/icons/ride-started.png',
        tag: 'ride-started'
      },
      'ride_completed': {
        title: 'Viaje completado',
        body: 'Has llegado a tu destino. ¡Gracias por viajar con nosotros!',
        icon: '/icons/ride-completed.png',
        tag: 'ride-completed',
        actions: [
          { action: 'rate', title: 'Calificar' },
          { action: 'receipt', title: 'Ver recibo' }
        ]
      },
      'payment_processed': {
        title: 'Pago procesado',
        body: `Pago de €${data.amount} procesado correctamente`,
        icon: '/icons/payment.png',
        tag: 'payment'
      },
      'driver_cancelled': {
        title: 'Viaje cancelado',
        body: 'Tu conductor ha cancelado el viaje. Buscando otro conductor...',
        icon: '/icons/ride-cancelled.png',
        tag: 'ride-cancelled',
        vibrate: [500, 200, 500]
      }
    };

    const notification = notifications[type];
    if (notification) {
      return this.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        tag: notification.tag,
        vibrate: notification.vibrate,
        requireInteraction: notification.requireInteraction,
        actions: notification.actions,
        data: data
      });
    }
  }

  // Subscribe to push notifications
  async subscribeToPush() {
    if (!this.registration) {
      throw new Error('Service Worker no registrado');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || 'your-vapid-public-key'
        )
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Error suscribiéndose a push notifications:', error);
      throw error;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          userId: this.getCurrentUserId()
        })
      });

      if (!response.ok) {
        throw new Error('Error enviando suscripción al servidor');
      }
    } catch (error) {
      console.error('Error enviando suscripción:', error);
      throw error;
    }
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get current user ID (implement based on your auth system)
  getCurrentUserId() {
    // This should return the current user's ID
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  }

  // Add notification click handler
  addNotificationClickHandler(callback) {
    this.callbacks.add(callback);
    
    // Handle notification clicks
    if (this.registration) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification-click') {
          this.callbacks.forEach(cb => cb(event.data));
        }
      });
    }
  }

  // Remove notification click handler
  removeNotificationClickHandler(callback) {
    this.callbacks.delete(callback);
  }

  // Clear all notifications with specific tag
  clearNotifications(tag) {
    if (this.registration && this.registration.getNotifications) {
      this.registration.getNotifications({ tag }).then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    }
  }

  // Schedule notification (for reminders, etc.)
  scheduleNotification(title, options, delay) {
    return setTimeout(() => {
      this.showNotification(title, options);
    }, delay);
  }

  // Cancel scheduled notification
  cancelScheduledNotification(timeoutId) {
    clearTimeout(timeoutId);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// In-app notification utilities
export class InAppNotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = new Set();
  }

  // Add in-app notification
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();
    
    return newNotification.id;
  }

  // Remove notification
  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Mark notification as read
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get all notifications
  getNotifications() {
    return [...this.notifications];
  }

  // Add listener for notification changes
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }
}

// Export singleton instance
export const inAppNotificationService = new InAppNotificationService();

// Utility functions
export const formatNotificationTime = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export const getNotificationIcon = (type) => {
  const icons = {
    'ride_request': '🚗',
    'ride_accepted': '✅',
    'driver_arriving': '📍',
    'ride_started': '🚀',
    'ride_completed': '🏁',
    'payment_processed': '💳',
    'driver_cancelled': '❌',
    'promotion': '🎉',
    'system': '⚙️',
    'chat': '💬'
  };
  
  return icons[type] || '📱';
};