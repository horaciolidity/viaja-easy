import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, QrCode, Shield, Copy, Check, Loader2 } from 'lucide-react';
import QRCode from 'qrcode.react';
import { useRide } from '@/contexts/RideContext';
import { useToast } from '@/components/ui/use-toast';

const PassengerValidationInfo = ({ ride }) => {
  const [mode, setMode] = useState('pin');
  const [authInfo, setAuthInfo] = useState({ pin_code: ride.pin_code || null, qr_data: ride.qr_data || null });
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { getRideAuthInfo } = useRide();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAuthInfo = async () => {
      if (!ride.id) return;
      
      if (authInfo.pin_code && authInfo.qr_data) {
        return;
      }

      setIsLoading(true);
      try {
        const data = await getRideAuthInfo(ride.id, ride.ride_type);
        if (data?.success) {
          setAuthInfo(data);
        } else {
          toast({
            title: 'Error',
            description: 'No se pudo obtener la información de validación.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error de red',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthInfo();
  }, [ride.id, ride.ride_type, getRideAuthInfo, authInfo.pin_code, authInfo.qr_data, toast]);

  const handleCopy = () => {
    if (authInfo.pin_code) {
      navigator.clipboard.writeText(authInfo.pin_code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({ title: '¡Copiado!', description: 'El PIN fue copiado al portapapeles.' });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (mode === 'pin') {
      return (
        <div className="text-center transition-all duration-300">
          <p className="text-sm text-slate-500 dark:text-slate-400">Tu PIN de Viaje</p>
          <div className="flex justify-center items-center gap-2">
            <p className="text-4xl font-bold tracking-[0.2em] text-slate-800 dark:text-slate-100 font-mono my-2 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
              {authInfo.pin_code || '----'}
            </p>
            <Button size="icon" variant="ghost" onClick={handleCopy} disabled={!authInfo.pin_code}>
              {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      );
    }

    if (mode === 'qr') {
      return (
        <div className="text-center transition-all duration-300">
          <div className="p-4 bg-white rounded-lg inline-block">
            {authInfo.qr_data ? <QRCode value={authInfo.qr_data} size={160} /> : <p>No QR disponible</p>}
          </div>
        </div>
      );
    }
  };

  return (
    <Card className="mt-4 bg-blue-50 dark:bg-slate-800/50 border-blue-200 dark:border-blue-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <CardTitle className="text-base">Validación del viaje</CardTitle>
            <CardDescription className="text-xs">
              Mostrale este PIN o escaneá el QR con tu conductor para comenzar el viaje.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-4">
        {renderContent()}
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant={mode === 'pin' ? 'secondary' : 'ghost'} onClick={() => setMode('pin')}>
            <KeyRound className="w-4 h-4 mr-2" />
            Mostrar PIN
          </Button>
          <Button size="sm" variant={mode === 'qr' ? 'secondary' : 'ghost'} onClick={() => setMode('qr')}>
            <QrCode className="w-4 h-4 mr-2" />
            Mostrar QR
          </Button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">Este código es único y caduca al comenzar el viaje.</p>
      </CardContent>
    </Card>
  );
};

export default PassengerValidationInfo;