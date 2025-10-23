import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useAudio } from './AudioContext';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { playSound } = useAudio();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /* --------------------- 📩 Cargar notificaciones --------------------- */
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

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las notificaciones.',
        variant: 'destructive',
      });
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* --------------------- 🔔 Suscripción en tiempo real --------------------- */
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
          const n = payload.new;
          setNotifications((prev) => [n, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Sonido y toast visual
          playSound?.('notification');
          toast({
            title: n.title || 'Nueva notificación',
            description: n.body || 'Tienes un nuevo mensaje.',
            action:
              n.payload?.url && (
                <button
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                  onClick={() => navigate(n.payload.url)}
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

  /* --------------------- 📤 Enviar notificación push --------------------- */
  const sendNotification = async (targetUserId, payload) => {
    try {
      const { error } = await supabase.functions.invoke('send-fcm-notification', {
        body: { userId: targetUserId, payload },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error al enviar notificación push:', err);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación push.',
        variant: 'destructive',
      });
    }
  };

  /* --------------------- ✅ Marcar notificaciones --------------------- */
  const markAsRead = async (notificationId) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error al marcar notificación:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    }
  };

  /* --------------------- 🧩 Valor del contexto --------------------- */
  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    sendNotification,
    markAsRead,
    markAllAsRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
