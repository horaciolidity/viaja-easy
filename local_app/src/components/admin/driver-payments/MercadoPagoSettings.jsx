import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Settings } from 'lucide-react';
import { getMercadoPagoAccessToken, updateMercadoPagoAccessToken } from '@/services/adminService';

const MercadoPagoSettings = () => {
  const [accessToken, setAccessToken] = useState('');
  const [newAccessToken, setNewAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchToken();
    }
  }, [isOpen]);

  const fetchToken = async () => {
    try {
      const token = await getMercadoPagoAccessToken();
      setAccessToken(token);
      setNewAccessToken(token);
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
  };

  const handleUpdateToken = async () => {
    if (!newAccessToken.trim()) {
      toast({
        title: "Error",
        description: "El Access Token no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateMercadoPagoAccessToken(newAccessToken);
      setAccessToken(newAccessToken.trim());
      toast({
        title: "Access Token Actualizado",
        description: "El Access Token de MercadoPago ha sido guardado correctamente"
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating access token:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-100">
          <Settings className="w-4 h-4 mr-2" />
          Configurar MercadoPago
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración de MercadoPago</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="access-token">Access Token de MercadoPago</Label>
            <Input
              id="access-token"
              type="password"
              value={newAccessToken}
              onChange={(e) => setNewAccessToken(e.target.value)}
              placeholder="APP_USR-..."
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Obtén tu Access Token desde tu cuenta de MercadoPago
            </p>
          </div>
          <Button 
            onClick={handleUpdateToken} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Guardando...' : 'Guardar Access Token'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MercadoPagoSettings;