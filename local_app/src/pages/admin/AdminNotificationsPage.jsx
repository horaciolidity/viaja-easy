import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Send, Trash2, PlusCircle, Sparkles, Clock, Loader2, History, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { 
    generateNotificationTemplate, 
    sendBroadcastNotification, 
    scheduleBroadcastNotification,
    getSentNotifications,
    getScheduledNotifications,
    deleteScheduledNotification
} from '@/services/notificationService';

const CreateNotificationDialog = ({ onNotificationCreated }) => {
    const [title, setTitle] = useState('');
    const [prompt, setPrompt] = useState('');
    const [body, setBody] = useState('');
    const [targetUserType, setTargetUserType] = useState('all');
    const [schedule, setSchedule] = useState('now');
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handleGenerateTemplate = async () => {
        if (!prompt) {
            toast({ title: "Error", description: "Por favor, ingresa un tema para generar la plantilla.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        try {
            const message = await generateNotificationTemplate(prompt);
            setBody(message);
            toast({ title: "Plantilla Generada", description: "Se ha creado un mensaje con IA.", className: "bg-green-600 text-white" });
        } catch (error) {
            toast({ title: "Error de IA", description: error.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const onEmojiClick = (emojiObject) => {
        setBody(prevBody => prevBody + emojiObject.emoji);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !body) {
            toast({ title: "Campos incompletos", description: "El título y el mensaje son requeridos.", variant: "destructive" });
            return;
        }

        setIsSending(true);
        try {
            if (schedule === 'later' && scheduleDateTime) {
                await scheduleBroadcastNotification({ title, body, targetUserType, scheduledFor: scheduleDateTime });
                toast({ title: "Notificación Programada", description: "El mensaje se enviará en la fecha y hora seleccionadas.", className: "bg-blue-600 text-white" });
            } else {
                await sendBroadcastNotification({ title, body, targetUserType });
                toast({ title: "Notificación Enviada", description: "El mensaje ha sido enviado a los usuarios.", className: "bg-green-600 text-white" });
            }
            onNotificationCreated();
        } catch (error) {
            toast({ title: "Error al Enviar", description: error.message, variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle className="flex items-center"><PlusCircle className="mr-2"/>Crear Nueva Notificación</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Título de la Notificación</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: ¡Promoción Especial! 🥳" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="prompt">Generar Mensaje con IA</Label>
                    <div className="flex items-center space-x-2">
                        <Input id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Tema: descuento del 20% en viajes de fin de semana" />
                        <Button type="button" onClick={handleGenerateTemplate} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="body">Cuerpo del Mensaje</Label>
                    <div className="relative">
                        <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="El mensaje que verán los usuarios." rows={4} className="pr-10"/>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="absolute bottom-2 right-1 h-8 w-8">
                                    <Smile className="w-5 h-5 text-slate-500" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-0">
                                <EmojiPicker onEmojiClick={onEmojiClick} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="target">Dirigido a</Label>
                        <Select value={targetUserType} onValueChange={setTargetUserType}>
                            <SelectTrigger id="target">
                                <SelectValue placeholder="Seleccionar audiencia" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Usuarios</SelectItem>
                                <SelectItem value="passengers">Solo Pasajeros</SelectItem>
                                <SelectItem value="drivers">Solo Conductores</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schedule">Cuándo Enviar</Label>
                        <Select value={schedule} onValueChange={setSchedule}>
                            <SelectTrigger id="schedule">
                                <SelectValue placeholder="Seleccionar momento de envío" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="now">Enviar Ahora</SelectItem>
                                <SelectItem value="later">Programar para Después</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {schedule === 'later' && (
                    <div className="space-y-2">
                        <Label htmlFor="scheduleDateTime">Fecha y Hora de Envío</Label>
                        <Input id="scheduleDateTime" type="datetime-local" value={scheduleDateTime} onChange={(e) => setScheduleDateTime(e.target.value)} />
                    </div>
                )}
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSending} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isSending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : (schedule === 'later' ? <Clock className="w-5 h-5 mr-2" /> : <Send className="w-5 h-5 mr-2" />)}
                        {isSending ? 'Procesando...' : (schedule === 'later' ? 'Programar Notificación' : 'Enviar Notificación')}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
};

const NotificationHistory = ({ sent, scheduled, loading, onDeleteScheduled }) => {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'sent': return <Badge className="bg-green-100 text-green-800">Enviado</Badge>;
            case 'scheduled': return <Badge className="bg-yellow-100 text-yellow-800">Programado</Badge>;
            case 'error': return <Badge variant="destructive">Error</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatTarget = (target) => {
        switch(target) {
            case 'all': return 'Todos';
            case 'passengers': return 'Pasajeros';
            case 'drivers': return 'Conductores';
            default: return 'N/A';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><History className="mr-2"/> Historial de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>
                ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        <h3 className="font-semibold text-slate-700 text-lg">Programadas</h3>
                        {scheduled.length > 0 ? scheduled.map(n => (
                            <div key={n.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-slate-800">{n.title}</p>
                                    <p className="text-sm text-slate-500 truncate max-w-md">{n.body}</p>
                                    <p className="text-xs text-slate-400 mt-1">Para: {formatTarget(n.target_user_type)} | Programado: {new Date(n.scheduled_for).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {getStatusBadge(n.status)}
                                    {n.status === 'scheduled' && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={() => onDeleteScheduled(n.id)}>
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )) : <p className="text-sm text-slate-500 text-center py-4">No hay notificaciones programadas.</p>}

                        <h3 className="font-semibold text-slate-700 text-lg pt-4 border-t">Enviadas</h3>
                        {sent.length > 0 ? sent.map(n => (
                            <div key={n.id} className="p-3 bg-white rounded-lg flex justify-between items-center border">
                                <div>
                                    <p className="font-medium text-slate-800">{n.title}</p>
                                    <p className="text-sm text-slate-500 truncate max-w-md">{n.body}</p>
                                    <p className="text-xs text-slate-400 mt-1">Enviado: {new Date(n.created_at).toLocaleString()}</p>
                                </div>
                                {getStatusBadge('sent')}
                            </div>
                        )) : <p className="text-sm text-slate-500 text-center py-4">No se han enviado notificaciones masivas.</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


const AdminNotificationsPage = () => {
    const [sent, setSent] = useState([]);
    const [scheduled, setScheduled] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const [sentData, scheduledData] = await Promise.all([
                getSentNotifications(),
                getScheduledNotifications()
            ]);
            setSent(sentData);
            setScheduled(scheduledData);
        } catch (error) {
            toast({ title: "Error al cargar notificaciones", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleNotificationCreated = () => {
        setDialogOpen(false);
        fetchNotifications();
    };

    const handleDeleteScheduled = async (id) => {
        try {
            await deleteScheduledNotification(id);
            toast({ title: "Notificación eliminada", description: "La notificación programada ha sido cancelada.", className: "bg-green-600 text-white" });
            fetchNotifications();
        } catch (error) {
            toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-8"
        >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-slate-800">Gestión de Notificaciones Push</h2>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Crear Nueva Notificación
                        </Button>
                    </DialogTrigger>
                    <CreateNotificationDialog onNotificationCreated={handleNotificationCreated} />
                </Dialog>
            </div>

            <NotificationHistory 
                sent={sent} 
                scheduled={scheduled} 
                loading={loading}
                onDeleteScheduled={handleDeleteScheduled}
            />
        </motion.div>
    );
};

export default AdminNotificationsPage;