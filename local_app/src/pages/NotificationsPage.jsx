import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, XCircle, CheckCircle, Info, AlertTriangle, Trash2, Loader2, Check } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    loading, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications,
    unreadCount
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
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };
  
  const markAllAsRead = () => {
    notifications.forEach(n => {
        if (!n.is_read) {
            markAsRead(n.id);
        }
    });
  };

  const sortedNotifications = React.useMemo(() => 
    [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [notifications]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="status-bar">
        <span>9:41</span>
        <span>Notificaciones {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
        <span>100%</span>
      </div>

      <motion.div
        className="p-6 pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 rounded-full bg-white shadow-md">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          </div>
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllNotifications} className="text-red-600 border-red-300 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-1"/> Borrar Todas
            </Button>
          )}
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <div className="mb-4 text-right">
            <Button variant="link" onClick={markAllAsRead} className="text-blue-600">Marcar todas como leídas</Button>
          </div>
        )}

        {loading ? (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {sortedNotifications.map(notification => (
              <motion.div
                key={notification.id}
                className={`p-4 rounded-xl shadow-lg transition-all duration-300 ${notification.is_read ? 'bg-white' : 'bg-blue-50 border-l-4 border-blue-500'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                layout
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3 pt-1">
                    {getIconForType(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <h3 className={`font-semibold ${notification.is_read ? 'text-gray-800' : 'text-blue-700'}`}>{notification.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(notification.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex flex-col space-y-1 ml-2">
                    {!notification.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)} className="text-xs text-blue-600 hover:bg-blue-100 p-1 h-auto">
                        <Check className="w-3 h-3 mr-1"/> Leído
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)} className="text-xs text-red-500 hover:bg-red-100 p-1 h-auto">
                      <Trash2 className="w-3 h-3 mr-1"/> Borrar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Bell className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Sin Notificaciones</h2>
            <p className="text-gray-500">Aquí aparecerán las actualizaciones importantes.</p>
          </motion.div>
        )}
      </motion.div>
      <div className="bottom-safe-area" />
    </div>
  );
};

export default NotificationsPage;