// src/pages/NotificationsPage.jsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Bell,
  XCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    unreadCount,
  } = useNotifications();

  const getIconForType = (type) => {
    switch (type) {
      case 'booking_completed':
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'booking_accepted':
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'booking_cancelled':
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-400" />;
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    await Promise.all(unread.map((n) => markAsRead(n.id)));
  };

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [notifications]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <motion.div
        className="p-6 pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-4 rounded-full bg-white dark:bg-slate-800 shadow-md"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400 text-base">
                  ({unreadCount})
                </span>
              )}
            </h1>
          </div>

          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllNotifications}
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Borrar todas
            </Button>
          )}
        </div>

        {/* Marcar todas */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="mb-4 text-right">
            <Button
              variant="link"
              onClick={markAllAsRead}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Marcar todas como leídas
            </Button>
          </div>
        )}

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          <AnimatePresence>
            <div className="space-y-4">
              {sortedNotifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 rounded-xl shadow-md border transition-all duration-300 ${
                    n.is_read
                      ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      : 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 pt-1">{getIconForType(n.type)}</div>
                    <div className="flex-grow">
                      <h3
                        className={`font-semibold ${
                          n.is_read
                            ? 'text-gray-800 dark:text-gray-100'
                            : 'text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {n.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{n.body}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(n.created_at).toLocaleString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-1 ml-2">
                      {!n.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(n.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-1 h-auto"
                        >
                          <Check className="w-3 h-3 mr-1" /> Leído
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(n.id)}
                        className="text-xs text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 h-auto"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Borrar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Bell className="w-20 h-20 text-gray-300 dark:text-slate-600 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Sin notificaciones
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Aquí aparecerán las actualizaciones importantes de tus viajes y recargas.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default NotificationsPage;
