import React, { useState, useEffect, useCallback } from 'react';
    import { createAssistanceThreadWithHistory, getAssistanceThreadsForUser } from '@/services/assistanceService';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { PlusCircle } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import AssistanceChat from '@/components/assistance/AssistanceChat';
    import ChatbotView from '@/components/assistance/ChatbotView';
    import AssistanceList from '@/components/assistance/AssistanceList';

    const DriverAssistancePage = () => {
      const [threads, setThreads] = useState([]);
      const [selectedThread, setSelectedThread] = useState(null);
      const [view, setView] = useState('list');
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const { user, profile } = useAuth();
      const { toast } = useToast();

      const fetchThreads = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
          const data = await getAssistanceThreadsForUser(user.id);
          setThreads(data);
          setError(null);
        } catch (err) {
          setError('No se pudieron cargar tus solicitudes de asistencia.');
          toast({ title: 'Error', description: 'No se pudieron cargar tus solicitudes.', variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      }, [user, toast]);

      useEffect(() => {
        if (!user) {
          setLoading(false);
          return;
        };
        fetchThreads();

        const channel = supabase
            .channel(`public:assistance_threads:user=${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assistance_threads', filter: `created_by=eq.${user.id}`}, 
            (payload) => {
                fetchThreads();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
      }, [user, fetchThreads]);

      const handleSelectThread = (thread) => {
        setSelectedThread(thread);
        setView('chat');
      };

      const handleBackToList = () => {
        setSelectedThread(null);
        setView('list');
      };

      const handleEscalateFromChatbot = async (history) => {
        try {
            const lastUserMessage = history.findLast(m => m.role === 'user')?.content || 'Consulta de usuario';
            await createAssistanceThreadWithHistory(
                `Derivado de Chatbot: ${lastUserMessage.substring(0, 40)}...`,
                history,
                user.id,
                profile.user_type
            );
            toast({
                title: "Ticket Creado",
                description: "Un agente de soporte se pondrá en contacto contigo pronto. Verás el ticket en tu lista de solicitudes.",
            });
            fetchThreads();
            setView('list');
        } catch (error) {
            toast({
                title: "Error al crear ticket",
                description: "No se pudo derivar la conversación a un agente.",
                variant: "destructive",
            });
        }
      };

      const renderContent = () => {
        switch (view) {
            case 'chat':
                return <AssistanceChat thread={selectedThread} onBack={handleBackToList} />;
            case 'chatbot':
                return <ChatbotView onEscalate={handleEscalateFromChatbot} />;
            case 'list':
            default:
                return (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Mis Solicitudes de Asistencia</CardTitle>
                            <Button onClick={() => setView('chatbot')}><PlusCircle className="w-4 h-4 mr-2" /> Nueva Solicitud</Button>
                        </CardHeader>
                        <CardContent>
                            <AssistanceList 
                                threads={threads}
                                onSelectThread={handleSelectThread}
                                loading={loading}
                                error={error}
                            />
                        </CardContent>
                    </Card>
                );
        }
      };

      return (
        <div className="p-4 md:p-6 h-full">
            {renderContent()}
        </div>
      );
    };

    export default DriverAssistancePage;