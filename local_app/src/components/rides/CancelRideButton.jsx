import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cancelRide } from '@/services/rides';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function CancelRideButton({ rideId, rideType, onDone, children, ...props }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para cancelar un viaje.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await cancelRide({
        cancellerId: user.id,
        rideId,
        rideType,
      });

      toast({
        title: 'Viaje Cancelado',
        description: 'El viaje ha sido cancelado exitosamente.',
      });

      if (onDone) {
        onDone();
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error al cancelar',
        description: e.message || 'No se pudo cancelar el viaje. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isLoading} {...props}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children || 'Cancelar viaje'}
    </Button>
  );
}