import React, { useState, useEffect, useRef } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { useAuth } from '@/contexts/AuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import { createAssistanceThreadWithHistory } from '@/services/assistanceService';
    import { Bot, Send, X, ChevronDown, Loader2 } from 'lucide-react';

    const Chatbot = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [messages, setMessages] = useState([]);
      const [input, setInput] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const { user, profile } = useAuth();
      const { toast } = useToast();
      const messagesEndRef = useRef(null);

      const escalationKeywords = ["hablar con una persona", "soporte humano", "no me sirve", "ayuda humana"];

      useEffect(() => {
        if (isOpen) {
          setMessages([
            { role: 'assistant', content: `¡Hola ${profile?.full_name || 'usuario'}! Soy tu asistente virtual de ViajaFácil. ¿En qué puedo ayudarte hoy?` }
          ]);
        }
      }, [isOpen, profile]);

      useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]);

      const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        if (escalationKeywords.some(keyword => input.toLowerCase().includes(keyword))) {
          handleEscalation(userMessage);
          return;
        }

        try {
          const { data, error } = await supabase.functions.invoke('openai-assistant', {
            body: { messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })) },
          });

          if (error) throw new Error(error.message);
          
          const botMessage = data.choices[0].message;
          setMessages(prev => [...prev, botMessage]);

        } catch (error) {
          console.error('Error calling OpenAI assistant:', error);
          setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, estoy teniendo problemas para conectarme. Por favor, intenta de nuevo más tarde.' }]);
          toast({
            title: "Error de Asistente",
            description: "No se pudo obtener una respuesta del asistente.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      const handleEscalation = async (userMessage) => {
        try {
          const history = [...messages, userMessage];
          await createAssistanceThreadWithHistory(
            'Consulta derivada del Chatbot',
            history,
            user.id,
            profile.user_type
          );
          
          const escalationMessage = {
            role: 'assistant',
            content: 'Entendido. He creado un ticket para que un agente de soporte humano se ponga en contacto contigo. Recibirás una notificación y podrás ver el ticket en tu sección de "Asistencia".'
          };
          setMessages(prev => [...prev, escalationMessage]);
          toast({
            title: "Ticket Creado",
            description: "Un agente de soporte se pondrá en contacto contigo pronto.",
          });
        } catch (error) {
          console.error('Error creating assistance thread:', error);
          setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, no pude crear el ticket de soporte. Por favor, inténtalo de nuevo o contacta a soporte directamente.' }]);
          toast({
            title: "Error de Escalación",
            description: "No se pudo crear el ticket de soporte.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed bottom-24 right-5 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200"
              >
                <header className="p-4 bg-slate-800 text-white flex justify-between items-center rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <Bot className="w-6 h-6" />
                    <h3 className="font-bold text-lg">Asistente ViajaFácil</h3>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-slate-700">
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </header>

                <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && <Bot className="w-6 h-6 text-slate-500 flex-shrink-0" />}
                        <div className={`max-w-xs md:max-w-sm p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-end gap-2 justify-start">
                        <Bot className="w-6 h-6 text-slate-500 flex-shrink-0" />
                        <div className="max-w-xs md:max-w-sm p-3 rounded-2xl bg-slate-200 text-slate-800 rounded-bl-none">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Escribe tu mensaje..."
                      className="w-full pr-12 pl-4 py-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-300" disabled={isLoading || !input.trim()}>
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="fixed bottom-5 right-5 w-16 h-16 bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center z-50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isOpen ? <X className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
          </motion.button>
        </>
      );
    };

    export default Chatbot;