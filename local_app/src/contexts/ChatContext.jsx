import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
    import { supabase } from '@/lib/supabaseClient';
    import { useAuth } from '@/contexts/AuthContext';
    import { toast } from '@/components/ui/use-toast';
    import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

    const ChatContext = createContext();

    export const useChat = () => {
      const context = useContext(ChatContext);
      if (!context) {
        throw new Error('useChat debe ser usado dentro de un ChatProvider');
      }
      return context;
    };

    export const ChatProvider = ({ children }) => {
      const { user, profile } = useAuth();
      const [messages, setMessages] = useState([]);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [currentRideId, setCurrentRideId] = useState(null);
      const [currentRideDetails, setCurrentRideDetails] = useState(null);

      const fetchChatHistory = useCallback(async (rideId) => {
        if (!rideId || !user) return;
        setLoading(true);
        setError(null);

        try {
          const { data: rideData, error: rideError } = await supabase.rpc('get_ride_details', { p_ride_id: rideId });
          if (rideError) throw rideError;
          setCurrentRideDetails(rideData);

          const { data, error: messagesError } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:sender_id(full_name, avatar_url),
              recipient:recipient_id(full_name, avatar_url)
            `)
            .eq('ride_id', rideId)
            .order('created_at', { ascending: true });

          if (messagesError) throw messagesError;
          setMessages(data || []);
        } catch (err) {
          setError(err);
          NetworkErrorHandler.handleError(err, 'obtención del historial de chat');
        } finally {
          setLoading(false);
        }
      }, [user]);

      const sendMessage = useCallback(async (content) => {
        if (!currentRideId || !user) {
          toast({ title: "Error", description: "No se puede enviar el mensaje.", variant: "destructive" });
          return;
        }

        try {
          const { error } = await supabase.rpc('send_chat_message', {
            p_ride_id: currentRideId,
            p_content: content,
          });

          if (error) {
            throw new Error(error.message);
          }
        } catch (err) {
           NetworkErrorHandler.handleError(err, 'envío de mensaje');
        }
      }, [currentRideId, user]);

      const markMessagesAsRead = useCallback(async (rideId) => {
        if (!rideId || !user) return;
        try {
          await supabase.rpc('mark_chat_read', { p_ride_id: rideId });
        } catch (err) {
          NetworkErrorHandler.handleError(err, 'marcar mensajes como leídos');
        }
      }, [user]);

      useEffect(() => {
        if (currentRideId) {
          fetchChatHistory(currentRideId);
        } else {
          setMessages([]);
          setCurrentRideDetails(null);
        }
      }, [currentRideId, fetchChatHistory]);

      useEffect(() => {
        if (!currentRideId || !user?.id) return;

        const subscription = supabase
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
              const newMessage = payload.new;
              
              const { data: senderProfile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', newMessage.sender_id)
                .single();
                
              if (profileError) {
                console.error('Error fetching sender profile for new message:', profileError);
                 newMessage.sender = {
                  full_name: 'Usuario',
                  avatar_url: 'https://wlssatbhutozvryrejzv.supabase.co/storage/v1/object/public/assets/default-avatar.png'
                };
              } else {
                 newMessage.sender = senderProfile;
              }
              
              setMessages(prevMessages => {
                if (prevMessages.some(m => m.id === newMessage.id)) {
                  return prevMessages;
                }
                return [...prevMessages, newMessage];
              });
              
              if (newMessage.sender_id !== user.id) {
                // TODO: Implement audio context to play notification sound
              }
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }, [currentRideId, supabase, user?.id, profile]);

      const value = useMemo(() => ({
        messages,
        loading,
        error,
        currentRideId,
        currentRideDetails,
        setCurrentRideId,
        sendMessage,
        markMessagesAsRead,
        fetchChatHistory
      }), [messages, loading, error, currentRideId, currentRideDetails, setCurrentRideId, sendMessage, markMessagesAsRead, fetchChatHistory]);

      return (
        <ChatContext.Provider value={value}>
          {children}
        </ChatContext.Provider>
      );
    };