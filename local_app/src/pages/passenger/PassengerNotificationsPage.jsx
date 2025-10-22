import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, XCircle, CheckCircle, Info, AlertTriangle, Trash2, Loader2, Check } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PassengerNotificationsPage = () => {
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
      case 'ride_completed':
      case 'payment_success':
      case 'success': 
        return <CheckCircle className="w-7 h-7 text-green-500" />;
      case 'ride_accepted':
      case 'driver_arrived':
      case 'broadcast':
      case 'info': 
        return <Info className="w-7 h-7 text-blue-500" />;
      case 'warning': 
        return <AlertTriangle className="w-7 h-7 text-yellow-500" />;
      case 'ride_cancelled':
      case 'payment_failed':
      case 'error': 
        return <XCircle className="w-7 h-7 text-red-500" />;
      default: 
        return <Bell className="w-7 h-7 text-slate-500" />;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Notificaciones</h1>
        {notifications.length > 0 && (
          <Button variant="ghost" onClick={clearAllNotifications} className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50">
            <Trash2 className="w-4 h-4 mr-2"/> Borrar Todas
          </Button>
        )}
      </div>

      {unreadCount > 0 && (
        <div className="mb-4 text-right">
          <Button variant="link" onClick={markAllAsRead} className="text-blue-600 dark:text-sky-400">Marcar todas como leídas</Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {sortedNotifications.map(notification => (
            <motion.div
              key={notification.id}
              className={`p-4 rounded-xl transition-all duration-300 flex items-start gap-4 ${notification.is_read ? 'bg-white dark:bg-slate-800/50' : 'bg-blue-50 dark:bg-sky-900/30 border-l-4 border-blue-500 dark:border-sky-500'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              layout
            >
              <div className="flex-shrink-0 pt-1">
                {getIconForType(notification.type)}
              </div>
              <div className="flex-grow">
                <h3 className={`font-semibold ${notification.is_read ? 'text-slate-800 dark:text-slate-200' : 'text-blue-700 dark:text-sky-300'}`}>{notification.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notification.body}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                {!notification.is_read && (
                  <Button variant="outline" size="sm" onClick={() => markAsRead(notification.id)} className="text-xs h-7 px-2 border-slate-300 dark:border-slate-600">
                    <Check className="w-3 h-3 mr-1"/> Marcar leído
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => deleteNotification(notification.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 h-7 w-7">
                  <Trash2 className="w-4 h-4"/>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Bell className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Todo tranquilo por acá</h2>
          <p className="text-slate-500 dark:text-slate-400">Cuando haya algo nuevo, te avisaremos.</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PassengerNotificationsPage;