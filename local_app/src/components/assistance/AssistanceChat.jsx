import React, { useState, useEffect, useRef } from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { getMessagesForThread, addMessageToThread, markUserMessagesAsRead, uploadSupportImage, recordSupportUpload } from '@/services/assistanceService';
    import { supabase } from '@/lib/supabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Badge } from '@/components/ui/badge';
    import { ArrowLeft, Send, Loader2, Paperclip, X as XIcon } from 'lucide-react';
    import { format } from 'date-fns';
    import { es } from 'date-fns/locale';

    const statusConfig = {
      open: { label: 'Abierto', color: 'bg-green-500' },
      closed: { label: 'Cerrado', color: 'bg-red-500' },
      in_review: { label: 'En Revisión', color: 'bg-yellow-500' },
    };

    const AssistanceChat = ({ thread: initialThread, onBack }) => {
      const [thread, setThread] = useState(initialThread);
      const [messages, setMessages] = useState([]);
      const [newMessage, setNewMessage] = useState('');
      const [uploading, setUploading] = useState(false);
      const [imageFile, setImageFile] = useState(null);
      const [imagePreview, setImagePreview] = useState(null);
      const { user, profile } = useAuth();
      const { toast } = useToast();
      const messagesEndRef = useRef(null);
      const fileInputRef = useRef(null);

      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };

      useEffect(() => {
        const fetchMessagesAndMarkRead = async () => {
          try {
            const data = await getMessagesForThread(thread.id);
            setMessages(data);
            if (thread.user_has_unread) {
              await markUserMessagesAsRead(thread.id, user.id);
            }
          } catch (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar los mensajes.', variant: 'destructive' });
          }
        };
        fetchMessagesAndMarkRead();
      }, [thread.id, thread.user_has_unread, user.id, toast]);

      useEffect(() => {
        const messagesChannel = supabase
          .channel(`assistance_messages:${thread.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assistance_messages', filter: `thread_id=eq.${thread.id}` },
            async (payload) => {
               const { data: senderProfile, error } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', payload.new.sender_id).single();
               if (error) console.error("Error fetching sender profile for realtime message:", error);
              
               const messageWithSender = { ...payload.new, sender: senderProfile };
               setMessages(prev => {
                if(prev.some(msg => msg.id === payload.new.id)) return prev;
                return [...prev, messageWithSender]
               });
            }
          )
          .subscribe();

        const threadUpdateChannel = supabase
            .channel(`thread_update_user:${thread.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assistance_threads', filter: `id=eq.${thread.id}`}, 
            (payload) => {
                setThread(payload.new);
            })
            .subscribe();

        return () => {
          supabase.removeChannel(messagesChannel);
          supabase.removeChannel(threadUpdateChannel);
        };
      }, [thread.id]);

      useEffect(scrollToBottom, [messages]);
      
      const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
      };

      const handleSendMessage = async () => {
        if ((!newMessage.trim() && !imageFile) || thread.status === 'closed') return;
        setUploading(true);
        
        let imageUrl = null;
        if (imageFile) {
            try {
                imageUrl = await uploadSupportImage(user.id, imageFile);
            } catch (error) {
                toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
                setUploading(false);
                return;
            }
        }

        try {
          const sentMessage = await addMessageToThread(thread.id, user.id, profile.user_type, newMessage, imageUrl);
          if (imageUrl) {
            await recordSupportUpload(thread.id, sentMessage.id, user.id, imageUrl, imageUrl);
          }
          setNewMessage('');
          setImageFile(null);
          setImagePreview(null);
        } catch (err) {
          toast({ title: 'Error', description: 'No se pudo enviar el mensaje.', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
      };
      
      const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      };

      return (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h3 className="font-bold text-lg">{thread.subject}</h3>
              <Badge className={`${statusConfig[thread.status].color} text-white`}>{statusConfig[thread.status].label}</Badge>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_role === profile.user_type ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-lg p-3 rounded-xl ${msg.sender_role === profile.user_type ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none'}`}>
                  {msg.image_url && (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={msg.image_url} alt="Adjunto de soporte" className="rounded-lg mb-2 max-w-xs cursor-pointer" />
                    </a>
                  )}
                  {msg.message && <p>{msg.message}</p>}
                  <p className={`text-xs mt-2 ${msg.sender_role === profile.user_type ? 'text-blue-200' : 'text-slate-400'}`}>
                    {format(new Date(msg.created_at), 'p, dd MMM', { locale: es })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {thread.status !== 'closed' && (
            <div className="p-4 border-t border-slate-200 bg-white">
                {imagePreview && (
                <div className="relative w-24 h-24 mb-2 rounded-lg overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                    <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                    >
                        <XIcon className="h-4 w-4" />
                    </Button>
                </div>
                )}
              <div className="relative">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <Button type="button" size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2" onClick={() => fileInputRef.current.click()}>
                    <Paperclip className="w-5 h-5" />
                </Button>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  className="pr-12 pl-12"
                  rows={2}
                  disabled={uploading}
                />
                <Button type="button" onClick={handleSendMessage} size="icon" className="absolute right-2 bottom-2" disabled={uploading || (!newMessage.trim() && !imageFile)}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    };

    export default AssistanceChat;