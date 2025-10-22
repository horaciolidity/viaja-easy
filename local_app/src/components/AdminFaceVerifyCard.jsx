import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ScanFace, Search, Send, Settings, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Label } from "@/components/ui/label";

const AdminFaceVerifyCard = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('driver');
  const [settings, setSettings] = useState({ mode: 'scheduled', interval_minutes: 1440 });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [requestingId, setRequestingId] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (response.ok) {
        setSettings(data.settings);
      } else {
        throw new Error(data.message || "Error al cargar la configuración");
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingSettings(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users'); // Assuming you have an endpoint to get users
      const data = await response.json();
      if(response.ok) {
        setUsers(data.users);
      } else {
        throw new Error(data.message || "Error al cargar usuarios");
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchSettings();
    // For now, using mock users since there is no /api/users endpoint
    const mockDrivers = [
      { id: 'bbbf6a2c-e3cb-42a8-bfd3-b0b09898cd30', full_name: 'Carlos Gomez', email: 'carlos.g@example.com', user_type: 'driver', avatar_url: 'https://i.pravatar.cc/150?u=carlos', last_face_verified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '12345678-e3cb-42a8-bfd3-b0b09898cd30', full_name: 'Ana Rodriguez', email: 'ana.r@example.com', user_type: 'driver', avatar_url: 'https://i.pravatar.cc/150?u=ana', last_face_verified_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      { id: '87654321-e3cb-42a8-bfd3-b0b09898cd30', full_name: 'Luis Fernandez', email: 'luis.f@example.com', user_type: 'driver', avatar_url: 'https://i.pravatar.cc/150?u=luis', last_face_verified_at: null },
    ];
    setUsers(mockDrivers);
    setLoading(false);
  }, [fetchSettings]);


  useEffect(() => {
    let filtered = users.filter(user => user.user_type === roleFilter);
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: 'Éxito', description: 'Configuración guardada correctamente.', variant: 'success' });
      } else {
        throw new Error(data.message || "Error al guardar la configuración");
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };
  
  const handleRequestVerification = async (userId) => {
    setRequestingId(userId);
    try {
      const response = await fetch('/api/verification-requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, mode: 'manual' }),
      });
      const data = await response.json();
      if(response.ok) {
        toast({ title: 'Solicitud Enviada', description: 'El conductor recibirá una notificación para verificarse.', variant: 'success' });
      } else {
         throw new Error(data.message || "No se pudo crear la solicitud.");
      }
    } catch (error) {
       toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setRequestingId(null);
    }
  };

  const getVerificationStatus = (lastVerified) => {
    if (!lastVerified) return { text: 'Nunca', variant: 'destructive', icon: <AlertCircle className="w-4 h-4 mr-2" /> };
    const minutesAgo = (new Date() - new Date(lastVerified)) / (1000 * 60);
    if (minutesAgo > settings.interval_minutes) return { text: 'Vencida', variant: 'warning', icon: <AlertCircle className="w-4 h-4 mr-2" /> };
    return { text: formatDistanceToNow(new Date(lastVerified), { addSuffix: true, locale: es }), variant: 'success', icon: <CheckCircle className="w-4 h-4 mr-2" /> };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Settings className="w-5 h-5 mr-2" /> Política de Verificación</CardTitle>
          <CardDescription>Configura cómo se realizan las verificaciones faciales.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="mode">Modo</Label>
            <Select value={settings.mode} onValueChange={(value) => setSettings(s => ({ ...s, mode: value }))} disabled={loadingSettings}>
              <SelectTrigger id="mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Programado</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="interval_minutes">Intervalo (minutos)</Label>
            <Input id="interval_minutes" type="number" value={settings.interval_minutes} onChange={(e) => setSettings(s => ({...s, interval_minutes: parseInt(e.target.value, 10)}))} disabled={loadingSettings || settings.mode !== 'scheduled'} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSaveSettings} disabled={savingSettings || loadingSettings} className="w-full">
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Política
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ScanFace className="w-5 h-5 mr-2" /> Estado de Verificación de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="driver">Conductores</SelectItem>
                <SelectItem value="passenger">Pasajeros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Estado Verificación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredUsers.map(user => {
                  const status = getVerificationStatus(user.last_face_verified_at);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarImage src={user.avatar_url} /><AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback></Avatar>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="flex items-center w-fit">{status.icon} {status.text}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleRequestVerification(user.id)} disabled={requestingId === user.id}>
                            {requestingId === user.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                           Solicitar Verificación
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFaceVerifyCard;