import React, { useState, useEffect, useRef, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { useParams, useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { useAuth } from '@/contexts/AuthContext';
    import { useChat } from '@/contexts/ChatContext';
    import { ArrowLeft, Send, Loader2, Info } from 'lucide-react';
    import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
    import { Badge } from '@/components/ui/badge';
    import UserInfoModal from '@/components/chat/UserInfoModal';

    const QuickReplyButton = ({ text, onClick }) => (
      <motion.button
        onClick={onClick}
        className="bg-slate-700/50 text-slate-200 px-3 py-1.5 rounded-full text-sm whitespace-nowrap border border-slate-600 hover:bg-slate-600/80 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {text}
      </motion.button>
    );

    const ChatPage = () => {
      const { rideId } = useParams();
      const navigate = useNavigate();
      const { user, profile } = useAuth();
      const { 
        messages, 
        loading, 
        sendMessage, 
        setCurrentRideId, 
        currentRideId,
        currentRideDetails,
        markMessagesAsRead 
      } = useChat();
      
      const [newMessage, setNewMessage] = useState('');
      const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
      const messagesEndRef = useRef(null);

      const quickReplies = useMemo(() => {
        if (!profile) return { user: [], other: [] };
        if (profile.user_type === 'passenger') {
          return {
            user: ["¡Hola! ¿Estás cerca?", "Ya estoy en el punto de encuentro.", "Ok, gracias.", "¡Perfecto!"],
            other: ["¡Hola! Llegué al punto de encuentro.", "Estoy en camino.", "Unos minutos más, por favor.", "Ok."]
          };
        } else { // driver
          return {
            user: ["¡Hola! Llegué al punto de encuentro.", "Estoy en camino.", "Unos minutos más, por favor.", "Ok."],
            other: ["¡Hola! ¿Estás cerca?", "Ya estoy en el punto de encuentro.", "Ok, gracias.", "¡Perfecto!"]
          };
        }
      }, [profile]);

      useEffect(() => {
        if (rideId) {
          setCurrentRideId(rideId);
        }
        return () => {
          setCurrentRideId(null);
        };
      }, [rideId, setCurrentRideId]);

      useEffect(() => {
        if (rideId && user) {
          markMessagesAsRead(rideId);
        }
      }, [messages, rideId, user, markMessagesAsRead]);

      const otherUser = useMemo(() => {
        if (!currentRideDetails || !user) return null;
        const passenger = currentRideDetails.passenger;
        const driver = currentRideDetails.driver;

        if (passenger?.id === user.id) return driver;
        if (driver?.id === user.id) return passenger;
        return null;
      }, [currentRideDetails, user]);

      useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, [messages]);

      const handleSendMessage = (content) => {
        const messageToSend = (typeof content === 'string' ? content : newMessage).trim();
        if (messageToSend && currentRideId) {
          sendMessage(messageToSend);
          setNewMessage('');
        }
      };

      if (loading && messages.length === 0) {
        return (
          <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-slate-400">Cargando chat...</p>
          </div>
        );
      }

      if (!user || !currentRideDetails || !otherUser) {
        return (
            <div className="flex flex-col h-screen w-screen items-center justify-center bg-slate-900 p-4">
                <p className="text-slate-400 text-center mb-4">No se pudo cargar la información del chat. Es posible que el viaje ya no esté activo.</p>
                <Button onClick={() => navigate(-1)} variant="outline">Volver</Button>
            </div>
        );
      }

      return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
          <div
            className={`fixed inset-0 flex items-center justify-center pointer-events-none z-0 bg-center bg-no-repeat bg-contain`}
            style={{ backgroundImage: `url('https://horizons-cdn.hostinger.com/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/d88fcd2a45323bd779384608092b7af0.png')`, opacity: '0.05', backgroundSize: 'min(80vw, 400px)' }}
          >
          </div>

          <motion.header
            className="bg-slate-800/50 backdrop-blur-lg shadow-lg p-4 flex items-center justify-between sticky top-0 z-20 border-b border-slate-700"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full text-slate-300 hover:bg-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex flex-col items-center">
              <h1 className="text-lg font-semibold text-slate-100">{otherUser?.name || 'Chat'}</h1>
              <Badge variant="success" className="text-xs mt-1">Viaje Activo</Badge>
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => setIsInfoModalOpen(true)} className="rounded-full text-slate-300 hover:bg-slate-700">
                  <Info className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.name} />
                  <AvatarFallback>{otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
            </div>
          </motion.header>

          <motion.main
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`flex items-end max-w-[85%] sm:max-w-[75%] ${msg.sender_id === user.id ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Avatar className="w-8 h-8 mx-2 self-start flex-shrink-0">
                  <AvatarImage src={msg.sender?.avatar_url} alt={msg.sender?.full_name} />
                  <AvatarFallback>{msg.sender?.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-2xl shadow-md ${
                    msg.sender_id === user.id
                      ? 'bg-primary text-white rounded-br-lg'
                      : 'bg-slate-700 text-slate-200 rounded-bl-lg'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1.5 text-right ${msg.sender_id === user.id ? 'text-blue-200/80' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </motion.main>

          <motion.footer
            className="bg-slate-800/50 backdrop-blur-lg border-t border-slate-700 p-4 space-y-3 sticky bottom-0 z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex overflow-x-auto space-x-2 pb-2 custom-scrollbar">
              {quickReplies.user.map((reply, index) => (
                <QuickReplyButton key={index} text={reply} onClick={() => handleSendMessage(reply)} />
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 h-12 rounded-full px-5 bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 focus:ring-primary focus:border-primary"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={() => handleSendMessage()}
                size="icon"
                className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-white flex-shrink-0"
                disabled={!newMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </motion.footer>
          <div className="bottom-safe-area bg-slate-800/50" />
          <UserInfoModal user={otherUser} isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        </div>
      );
    };

    export default ChatPage;