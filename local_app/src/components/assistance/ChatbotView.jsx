import React, { useState, useEffect, useRef } from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Bot, Loader2, Send } from 'lucide-react';

    const ChatbotView = ({ onEscalate }) => {
        const [messages, setMessages] = useState([]);
        const [input, setInput] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const { profile } = useAuth();
        const { toast } = useToast();
        const messagesEndRef = useRef(null);
        const escalationKeywords = ["hablar con una persona", "soporte humano", "no me sirve", "ayuda humana", "hablar con alguien"];

        useEffect(() => {
            setMessages([{ role: 'assistant', content: `¡Hola ${profile?.full_name || 'usuario'}! Soy tu asistente virtual. ¿Cómo puedo ayudarte?` }]);
        }, [profile]);

        useEffect(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [messages]);

        const handleSendMessage = async (e) => {
            e.preventDefault();
            if (!input.trim() || isLoading) return;

            const userMessage = { role: 'user', content: input };
            setMessages(prev => [...prev, userMessage]);
            const currentInput = input;
            setInput('');
            setIsLoading(true);

            if (escalationKeywords.some(keyword => currentInput.toLowerCase().includes(keyword))) {
                onEscalate([...messages, userMessage]);
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase.functions.invoke('openai-assistant', {
                    body: { messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })) },
                });

                if (error) throw new Error(error.message);
                
                const botMessage = { role: 'assistant', content: data.text };
                setMessages(prev => [...prev, botMessage]);
            } catch (error) {
                console.error('Error calling assistant:', error);
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

        return (
            <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Bot /> Asistente Virtual</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && <Bot className="w-6 h-6 text-slate-500 flex-shrink-0" />}
                            <div className={`max-w-lg p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-end gap-2 justify-start">
                            <Bot className="w-6 h-6 text-slate-500 flex-shrink-0" />
                            <div className="p-3 rounded-xl bg-slate-200"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-200 bg-white">
                    <form onSubmit={handleSendMessage} className="relative">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(e); }}
                            placeholder="Escribe tu mensaje... o 'ayuda humana' para hablar con un agente."
                            className="pr-12"
                            rows={1}
                        />
                        <Button type="submit" size="icon" className="absolute right-2 bottom-2" disabled={isLoading}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        );
    };

    export default ChatbotView;