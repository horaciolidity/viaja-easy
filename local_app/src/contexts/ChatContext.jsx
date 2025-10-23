import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useAudio } from '@/contexts/AudioContext';
import { toast } from '@/components/ui/use-toast';

const ChatContext = createContext(null);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat debe usarse dentro de un ChatProvider');
  return ctx;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { playSound } = useAudio();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRideId, setCurrentRideId] = useState(null);
  const [currentRideDetails, setCurrentRideDetails] = useState(null);

  /* ------------------------- 📜 Cargar historial ------------------------- */
  const fetchChatHistory = useCallback(async (rideId) => {
    if (!rideId || !user) return;
    setLoading(true);
    setError(null);

    try {
      // Obtener detalles del viaje
      const { data: rideData, error: rideError } = await supabase.rpc('get_ride_details', {
        p_ride_id: rideId,
      });
      if (rideError) throw rideError;
      setCurrentRideDetails(rideData);

      // Obtener mensajes del chat
      const { data, error: msgError } = await supabase
        .from('chat_messages')
        .select(
          `
          *,
          sender:sender_id(full_name, avatar_url),
          recipient:recipient_id(full_name, avatar_url)
        `
        )
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;
      setMessages(data || []);
    } catch (err) {
      console.error('Error obteniendo historial de chat:', err);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el historial del chat.',
        variant: 'destructive',
      });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /* ------------------------- 💬 Enviar mensaje ------------------------- */
  const sendMessage = useCallback(
    async (content) => {
      if (!currentRideId || !user) {
        toast({
          title: 'Error',
          description: 'No se puede enviar el mensaje en este momento.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const { error } = await supabase.rpc('send_chat_message', {
          p_ride_id: currentRideId,
          p_content: content,
        });
        if (error) throw error;
      } catch (err) {
        console.error('Error enviando mensaje:', err);
        toast({
          title: 'Error',
          description: 'No se pudo enviar el mensaje.',
          variant: 'destructive',
        });
      }
    },
    [currentRideId, user]
  );

  /* ------------------------- ✅ Marcar como leídos ------------------------- */
  const markMessagesAsRead = useCallback(
    async (rideId) => {
      if (!rideId || !user) return;
      try {
        await supabase.rpc('mark_chat_read', { p_ride_id: rideId });
      } catch (err) {
        console.error('Error marcando mensajes como leídos:', err);
      }
    },
    [user]
  );

  /* ------------------------- 🔁 Sincronizar historial ------------------------- */
  useEffect(() => {
    if (currentRideId) fetchChatHistory(currentRideId);
    else {
      setMessages([]);
      setCurrentRideDetails(null);
    }
  }, [currentRideId, fetchChatHistory]);

  /* ------------------------- 🛰️ Suscripción Realtime ------------------------- */
  useEffect(() => {
    if (!currentRideId || !user?.id) return;

    const channel = supabase
      .channel(`chat-ride-${currentRideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `ride_id=eq.${currentRideId}`,
        },
        async (payload) => {
          const newMsg = payload.new;

          try {
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();

            newMsg.sender = sender || {
              full_name: 'Usuario',
              avatar_url:
                'https://wlssatbhutozvryrejzv.supabase.co/storage/v1/object/public/assets/default-avatar.png',
            };
          } catch {
            newMsg.sender = {
              full_name: 'Usuario',
              avatar_url:
                'https://wlssatbhutozvryrejzv.supabase.co/storage/v1/object/public/assets/default-avatar.png',
            };
          }

          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          );

          // 🔊 Reproducir sonido si el mensaje viene de otra persona
          if (newMsg.sender_id !== user.id) {
            playSound('message');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRideId, user?.id, playSound]);

  /* ------------------------- 🧩 Contexto expuesto ------------------------- */
  const value = useMemo(
    () => ({
      messages,
      loading,
      error,
      currentRideId,
      currentRideDetails,
      setCurrentRideId,
      sendMessage,
      markMessagesAsRead,
      fetchChatHistory,
    }),
    [messages, loading, error, currentRideId, currentRideDetails, sendMessage, markMessagesAsRead, fetchChatHistory]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
