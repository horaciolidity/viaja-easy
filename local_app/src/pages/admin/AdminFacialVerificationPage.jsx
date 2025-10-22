import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ScanFace, Send, CheckCircle, Clock, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminFacialVerificationPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);
  const [settings, setSettings] = useState({
    face_recognition_mode: 'scheduled',
    face_recognition_interval_minutes: 1440,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('settings')
      .single();
    
    if (data && data.settings) {
      setSettings(prev => ({
        ...prev,
        face_recognition_mode: data.settings.face_recognition_mode || 'scheduled',
        face_recognition_interval_minutes: data.settings.face_recognition_interval_minutes || 1440,
      }));
    }
  }, []);

  const fetchDriverData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        last_face_verified_at
      `)
      .eq('user_type', 'driver');

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los conductores.', variant: 'destructive' });
    } else {
      setDrivers(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSettings();
    fetchDriverData();
  }, [fetchSettings, fetchDriverData]);

  const handleRequestVerification = async (driverId) => {
    setRequestingId(driverId);
    try {
        const { data, error } = await supabase.functions.invoke('verification-request-create', {
            body: {
                user_id: driverId,
                mode: 'manual',
                requested_by: adminUser.id,
            },
        });
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || 'No se pudo solicitar la verificación.');
        toast({ title: 'Solicitud Enviada', description: `Se ha solicitado una verificación facial para el conductor.` });
    } catch (error) {
        toast({ title: 'Error', description: error.message || 'No se pudo solicitar la verificación.', variant: 'destructive' });
    } finally {
        setRequestingId(null);
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const { data, error } = await supabase.rpc('update_app_settings', {
        p_settings: {
          face_recognition_mode: settings.face_recognition_mode,
          face_recognition_interval_minutes: settings.face_recognition_interval_minutes
        }
      });

      if (error) throw error;
      toast({ title: 'Configuración guardada', description: 'Los cambios se han guardado correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'No se pudo guardar la configuración.', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ScanFace className="w-6 h-6 mr-3 text-gray-600" />Configuración de Verificación Facial</CardTitle>
          <CardDescription>Ajusta cómo y cuándo se realizan las verificaciones faciales automáticas.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="mode">Modo de Verificación</Label>
            <Select value={settings.face_recognition_mode} onValueChange={(value) => handleSettingsChange('face_recognition_mode', value)}>
              <SelectTrigger id="mode">
                <SelectValue placeholder="Seleccionar modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Programado</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="interval">Intervalo (minutos)</Label>
            <Input
              id="interval"
              type="number"
              value={settings.face_recognition_interval_minutes}
              onChange={(e) => handleSettingsChange('face_recognition_interval_minutes', parseInt(e.target.value, 10))}
              disabled={settings.face_recognition_mode !== 'scheduled'}
            />
          </div>
          <div className="md:col-start-3 flex items-end">
            <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full">
              {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Ajustes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ScanFace className="w-6 h-6 mr-3 text-blue-600" />
            Estado de Conductores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Última Verificación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={driver.avatar_url} />
                            <AvatarFallback>{driver.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{driver.full_name || 'Sin nombre'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {driver.last_face_verified_at ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{formatDistanceToNow(new Date(driver.last_face_verified_at), { addSuffix: true, locale: es })}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>Nunca</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleRequestVerification(driver.id)} disabled={requestingId === driver.id}>
                          {requestingId === driver.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                          Solicitar Verificación
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminFacialVerificationPage;