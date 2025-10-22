import React, { useState, useEffect, useRef } from 'react';
    import { motion } from 'framer-motion';
    import { useAuth } from '@/contexts/AuthContext';
    import { getMessagesForThread, addMessageToThread, updateThreadStatus, getUserDetailsForAssistance, uploadSupportImage, recordSupportUpload } from '@/services/assistanceService';
    import { supabase } from '@/lib/supabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { format, formatDistanceToNow } from 'date-fns';
    import { es } from 'date-fns/locale';

    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Badge } from '@/components/ui/badge';
    import { ArrowLeft, Send, Info, MessageSquare, Check, CheckCheck, Paperclip, X as XIcon, Loader2 } from 'lucide-react';
    import UserInfoPanel from '@/components/admin/assistance/UserInfoPanel';

    const statusConfig = {
      open: { label: 'Abierto' },
      closed: { label: 'Cerrado' },
      in_review: { label: 'En Revisión' },
    };

    const AssistanceChat = ({ thread, onBack, onThreadUpdate }) => {
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
        const fetchMessages = async () => {
          if (!thread) return;
          try {
            const data = await getMessagesForThread(thread.id);
            setMessages(data);
          } catch (err) {
            toast({ title: 'Error', description: 'No se pudieron cargar los mensajes.', variant: 'destructive' });
          }
        };
        fetchMessages();
      }, [thread, toast]);

      useEffect(() => {
        if (!thread) return;

        const messagesChannel = supabase
          .channel(`assistance_messages:${thread.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_messages', filter: `thread_id=eq.${thread.id}` },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
                const { data: senderProfile, error } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', payload.new.sender_id).single();
                if (error) console.error("Error fetching sender profile for realtime message:", error);
                const messageWithSender = { ...payload.new, sender: senderProfile };
                setMessages(prev => {
                  if (prev.some(msg => msg.id === payload.new.id)) return prev;
                  return [...prev, messageWithSender];
                });
              } else if (payload.eventType === 'UPDATE') {
                setMessages(prev => prev.map(msg => msg.id === payload.new.id ? {...msg, ...payload.new} : msg));
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(messagesChannel);
        };
      }, [thread]);

      useEffect(() => {
        scrollToBottom();
      }, [messages]);
      
      const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
      };

      const handleSendMessage = async () => {
        if ((!newMessage.trim() && !imageFile) || !thread || thread.status === 'closed') return;
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
          const sentMessage = await addMessageToThread(thread.id, user.id, 'admin', newMessage, imageUrl);
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

      const handleChangeStatus = async (newStatus) => {
        try {
          await updateThreadStatus(thread.id, newStatus);
          onThreadUpdate({ ...thread, status: newStatus });
          toast({ title: 'Éxito', description: `El estado del mensaje se ha actualizado a ${statusConfig[newStatus].label}.` });
        } catch (err) {
          toast({ title: 'Error', description: 'No se pudo actualizar el estado del mensaje.', variant: 'destructive' });
        }
      };

      if (!thread) {
        return (
          <div className="flex flex-col justify-center items-center h-full text-slate-500">
            <MessageSquare className="w-20 h-20 mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold">Selecciona un mensaje</h3>
            <p>Elige una conversación de la lista para ver los detalles.</p>
          </div>
        );
      }

      return (
        <>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarImage src={thread.created_by?.avatar_url} alt={thread.created_by?.full_name} />
                <AvatarFallback>{thread.created_by?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg text-slate-800">{thread.created_by?.full_name}</h3>
                <p className="text-sm text-slate-500">{thread.created_by?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline"><Info className="w-4 h-4 mr-2" /> Ver Info</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <UserInfoPanel userId={thread.created_by.id} />
                </PopoverContent>
              </Popover>
              <Select value={thread.status} onValueChange={handleChangeStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Cambiar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_review">En Revisión</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-end gap-3 ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender_role !== 'admin' && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={msg.sender?.avatar_url} />
                    <AvatarFallback>{msg.sender?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-xl p-3 rounded-2xl shadow-sm ${msg.sender_role === 'admin' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none'}`}>
                  {msg.image_url && (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={msg.image_url} alt="Adjunto de soporte" className="rounded-lg mb-2 max-w-xs cursor-pointer" />
                    </a>
                  )}
                  {msg.message && <p className="text-sm">{msg.message}</p>}
                  <div className={`flex items-center gap-2 mt-2 ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-end'}`}>
                    <p className={`text-xs ${msg.sender_role === 'admin' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {format(new Date(msg.created_at), 'p, dd MMM', { locale: es })}
                    </p>
                    {msg.sender_role === 'admin' && (
                      msg.is_read_by_user 
                      ? <CheckCheck className="w-4 h-4 text-sky-300" /> 
                      : <Check className="w-4 h-4 text-blue-200" />
                    )}
                  </div>
                </div>
                {msg.sender_role === 'admin' && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white">A</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
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
              <Button type="button" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300" onClick={() => fileInputRef.current.click()}>
                <Paperclip className="w-5 h-5" />
              </Button>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={thread.status === 'closed' ? 'Este mensaje está cerrado.' : 'Escribe tu respuesta...'}
                className="pl-12 pr-12 bg-slate-100 rounded-full py-3 px-5"
                rows={1}
                disabled={thread.status === 'closed' || uploading}
              />
              <Button type="button" onClick={handleSendMessage} size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 rounded-full" disabled={thread.status === 'closed' || uploading || (!newMessage.trim() && !imageFile)}>
                {uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </>
      );
    };

    export default AssistanceChat;