import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Loader2 } from 'lucide-react';

const VerifyAccountButton = ({ userId, profile, onVerified }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { canVerify, missingDocs } = useMemo(() => {
    if (!profile) return { canVerify: false, missingDocs: [] };
    
    const requiredDriverDocs = ['dni_front', 'dni_back', 'license', 'criminal_record_cert'];
    const requiredPassengerDocs = ['dni_front', 'dni_back'];

    const approvedDriverDocs = profile.driver_documents?.filter(d => d.status === 'approved').map(d => d.doc_type) || [];
    const approvedPassengerDocs = profile.passenger_documents?.filter(d => d.status === 'approved').map(d => d.doc_type) || [];

    const missingDriver = requiredDriverDocs.filter(doc => !approvedDriverDocs.includes(doc));
    const missingPassenger = requiredPassengerDocs.filter(doc => !approvedPassengerDocs.includes(doc));
    
    const allMissing = [...new Set([...missingDriver, ...missingPassenger])];

    return {
      canVerify: allMissing.length === 0,
      missingDocs: allMissing,
    };
  }, [profile]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('complete_verification_if_ready', { p_user_id: userId });
      if (error) {
        throw new Error(error.message);
      }
      if (data?.verified) {
        toast({ title: '¡Cuenta Verificada!', description: 'Ahora puedes usar todas las funciones de la aplicación.', variant: 'success' });
        if (onVerified) {
          onVerified();
        }
      } else {
        toast({
          title: 'Faltan documentos',
          description: `Aún necesitas subir o esperar la aprobación de: ${data.missing_driver.join(', ')}, ${data.missing_passenger.join(', ')}`,
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.verified) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block">
            <Button onClick={handleVerify} disabled={!canVerify || loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              {loading ? 'Verificando...' : 'Verificar Cuenta'}
            </Button>
          </div>
        </TooltipTrigger>
        {!canVerify && (
          <TooltipContent>
            <p>Debes completar todos los documentos requeridos para verificar.</p>
            {missingDocs.length > 0 && <p className="text-xs text-muted-foreground">Faltan: {missingDocs.join(', ')}</p>}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifyAccountButton;