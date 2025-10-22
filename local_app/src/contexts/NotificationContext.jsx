import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
    import { useAuth } from './AuthContext';
    import { supabase } from '@/lib/supabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import { useAudio } from './AudioContext';
    import { useNavigate } from 'react-router-dom';
    import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

    const NotificationContext = createContext();

    export const useNotifications = () => {
      const context = useContext(NotificationContext);
      if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
      }
      return context;
    };

    export const NotificationProvider = ({ children }) => {
      const { user } = useAuth();
      const { playSound } = useAudio();
      const navigate = useNavigate();
      const [notifications, setNotifications] = useState([]);
      const [unreadCount, setUnreadCount] = useState(0);

      const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);
          if (error) throw error;
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
          if (!NetworkErrorHandler.isAuthError(error)) {
            NetworkErrorHandler.handleError(error, 'obtención de notificaciones');
          }
        }
      }, [user]);

      useEffect(() => {
        fetchNotifications();
      }, [fetchNotifications]);

      useEffect(() => {
        if (!user) return;

        const channel = supabase
          .channel(`notifications:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const newNotification = payload.new;
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              playSound('notification');
              toast({
                title: newNotification.title,
                description: newNotification.body,
                action: (
                  <button
                    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md"
                    onClick={() => {
                      if (newNotification.payload?.url) {
                        navigate(newNotification.payload.url);
                      }
                    }}
                  >
                    Ver
                  </button>
                ),
              });
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }, [user, playSound, navigate]);

      const sendNotification = async (targetUserId, payload) => {
        try {
          const { error } = await supabase.functions.invoke('send-fcm-notification', {
            body: { userId: targetUserId, payload },
          });
          if (error) throw error;
        } catch (error) {
           if (!NetworkErrorHandler.isAuthError(error)) {
            NetworkErrorHandler.handleError(error, 'envío de notificación push');
          }
        }
      };

      const markAsRead = async (notificationId) => {
        try {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
          if (error) throw error;
          setNotifications(prev =>
            prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'marcar notificación como leída');
        }
      };

      const markAllAsRead = async () => {
        try {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id);
          if (error) throw error;
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
        } catch (error) {
          NetworkErrorHandler.handleError(error, 'marcar todas las notificaciones como leídas');
        }
      };

      const value = {
        notifications,
        unreadCount,
        sendNotification,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      };

      return (
        <NotificationContext.Provider value={value}>
          {children}
        </NotificationContext.Provider>
      );
    };