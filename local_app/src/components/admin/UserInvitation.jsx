import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Mail, UserPlus, Send, Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { inviteUsersInBulk } from '@/services/authService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const InvitationResultModal = ({ results, isOpen, onClose, onRetry }) => {
    if (!results) return null;

    const hasFailed = results.failed && results.failed.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Resultados del Envío de Invitaciones</DialogTitle>
                    <DialogDescription>
                        Aquí está el resumen de las invitaciones que intentaste enviar.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    {results.successful && results.successful.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-green-600 mb-2 flex items-center"><CheckCircle className="mr-2 h-5 w-5" />Enviadas Correctamente ({results.successful.length})</h3>
                            <ul className="list-disc list-inside bg-green-50 p-3 rounded-md">
                                {results.successful.map((email, index) => <li key={`s-${index}`} className="text-sm text-gray-700">{email}</li>)}
                            </ul>
                        </div>
                    )}
                    {hasFailed && (
                        <div>
                            <h3 className="font-semibold text-red-600 mb-2 flex items-center"><XCircle className="mr-2 h-5 w-5" />Fallaron ({results.failed.length})</h3>
                            <ul className="list-disc list-inside bg-red-50 p-3 rounded-md">
                                {results.failed.map(({ email, reason }, index) => (
                                    <li key={`f-${index}`} className="text-sm text-gray-700">{email} - <span className="text-red-700">{reason}</span></li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {hasFailed && (
                        <Button onClick={onRetry} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reintentar Fallidos
                        </Button>
                    )}
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export const SingleInvitation = () => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('passenger');
    const [loading, setLoading] = useState(false);
    const { profile } = useAuth();
    const [results, setResults] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleInvite = async (emailsToInvite) => {
        if (emailsToInvite.length === 0) {
            toast({ title: "Error", description: "El email es requerido.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const response = await inviteUsersInBulk(emailsToInvite, role, profile.id);
            setResults(response.details);
            setIsModalOpen(true);
            if (response.success) {
                setEmail('');
            }
        } catch (error) {
            toast({ title: "Error al invitar", description: error.message, variant: "destructive" });
            setResults(error.details || { successful: [], failed: emailsToInvite.map(e => ({ email: e, reason: error.message })) });
            setIsModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        const failedEmails = results?.failed.map(f => f.email) || [];
        setIsModalOpen(false);
        if (failedEmails.length > 0) {
            handleInvite(failedEmails);
        }
    };

    return (
        <>
            <InvitationResultModal 
                results={results} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onRetry={handleRetry}
            />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus /> Invitar Usuario</CardTitle>
                    <CardDescription>Envía una invitación por correo para que un nuevo usuario se una a la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email del invitado</Label>
                        <Input id="email" type="email" placeholder="ejemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="role">Rol asignado</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="passenger">Pasajero</SelectItem>
                                <SelectItem value="driver">Conductor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => handleInvite([email])} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        Enviar Invitación
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
};

export const BulkInvitation = () => {
    const [emails, setEmails] = useState('');
    const [role, setRole] = useState('passenger');
    const [loading, setLoading] = useState(false);
    const { profile } = useAuth();
    const [results, setResults] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleBulkInvite = async (emailsToInvite) => {
        if (emailsToInvite.length === 0) {
            toast({ title: "Error", description: "Ingresa al menos un email.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const response = await inviteUsersInBulk(emailsToInvite, role, profile.id);
            setResults(response.details);
            setIsModalOpen(true);
            if (response.success) {
                setEmails('');
            }
        } catch (error) {
            toast({ title: "Error en envío masivo", description: error.message, variant: "destructive" });
            setResults(error.details || { successful: [], failed: emailsToInvite.map(e => ({ email: e, reason: error.message })) });
            setIsModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        const failedEmails = results?.failed.map(f => f.email) || [];
        setIsModalOpen(false);
        if (failedEmails.length > 0) {
            setEmails(failedEmails.join('\n'));
            handleBulkInvite(failedEmails);
        }
    };

    return (
        <>
            <InvitationResultModal 
                results={results} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onRetry={handleRetry}
            />
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Send /> Envío Masivo</CardTitle>
                    <CardDescription>Invita a múltiples usuarios pegando una lista de correos separados por coma, punto y coma o salto de línea.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="emails">Lista de Emails</Label>
                        <Textarea id="emails" placeholder="usuario1@email.com, usuario2@email.com" value={emails} onChange={(e) => setEmails(e.target.value)} rows={5} />
                    </div>
                    <div>
                        <Label htmlFor="bulk-role">Rol asignado a todos</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="passenger">Pasajero</SelectItem>
                                <SelectItem value="driver">Conductor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => {
                        const emailList = emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
                        handleBulkInvite(emailList);
                    }} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Enviar Todas las Invitaciones
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
};