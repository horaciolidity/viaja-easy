import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import * as faceCore from '@/services/faceCore';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useFaceAuth(onSuccess, onFail) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'pending', 'success', 'failed'
  const [verificationConfig, setVerificationConfig] = useState(null);
  const verificationRequestRef = useRef(null);

  const createDefaultConfig = useCallback(async (driverId) => {
    console.log('Attempting to create default verification config for:', driverId);
    try {
      const { data, error } = await supabase
        .from('face_verification_configs')
        .insert({
          driver_id: driverId,
          is_active: true,
          verification_interval_minutes: 5,
        })
        .select()
        .single();
  
      if (error) throw error;
      console.log('Default config created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating default verification config:', error);
      toast({
        title: "Error de Configuración",
        description: `No se pudo crear la configuración de verificación facial. ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const fetchVerificationConfig = useCallback(async () => {
    if (!user) return;

    try {
      let { data, error } = await supabase
        .from('face_verification_configs')
        .select('*')
        .eq('driver_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Configurando verificación",
          description: "Creando configuración de verificación facial por primera vez.",
        });
        data = await createDefaultConfig(user.id);
      }
      
      setVerificationConfig(data);
    } catch (error) {
      console.error('Error fetching verification config:', error);
      toast({
        title: "Error de Configuración",
        description: "No se pudo cargar la configuración de verificación facial.",
        variant: "destructive",
      });
    }
  }, [user, toast, createDefaultConfig]);

  useEffect(() => {
    fetchVerificationConfig();
  }, [fetchVerificationConfig]);

  const startVerification = useCallback(async (videoElement) => {
    if (!verificationConfig || !verificationConfig.reference_embedding) {
      toast({
        title: "Error",
        description: "Aún no has registrado tu rostro. Por favor, completa el registro facial en tu perfil.",
        variant: "destructive",
      });
      if (onFail) onFail("No face template enrolled");
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('pending');

    try {
      const { data: requestData, error: requestError } = await supabase
        .from('face_verification_requests')
        .insert({ driver_id: user.id, requester: 'system', status: 'in_progress' })
        .select()
        .single();
      
      if (requestError) throw requestError;
      verificationRequestRef.current = requestData;

      await faceCore.loadModels();
      const currentEmbedding = await faceCore.toEmbedding(videoElement);
      const isVerified = faceCore.verify(verificationConfig.reference_embedding, currentEmbedding);

      if (isVerified) {
        setVerificationStatus('success');
        toast({
          title: "¡Verificación Exitosa!",
          description: "Tu identidad ha sido confirmada.",
          className: "bg-green-500 text-white",
        });

        await supabase.from('face_verification_configs').update({ last_verified_at: new Date().toISOString() }).eq('id', verificationConfig.id);
        await supabase.from('face_verification_requests').update({ status: 'success' }).eq('id', verificationRequestRef.current.id);
        await supabase.from('face_verification_logs').insert({ 
          request_id: verificationRequestRef.current.id,
          driver_id: user.id,
          was_successful: true,
          similarity_score: faceCore.euclideanDistance(verificationConfig.reference_embedding, currentEmbedding)
        });
        if (onSuccess) onSuccess();
      } else {
        throw new Error("No se pudo verificar tu identidad.");
      }
    } catch (error) {
      console.error('Face verification error:', error);
      setVerificationStatus('failed');
      toast({
        title: "Verificación Fallida",
        description: error.message || "No pudimos confirmar tu identidad. Intentá de nuevo.",
        variant: "destructive",
      });
      if (verificationRequestRef.current) {
        await supabase.from('face_verification_requests').update({ status: 'failed' }).eq('id', verificationRequestRef.current.id);
        await supabase.from('face_verification_logs').insert({ 
          request_id: verificationRequestRef.current.id,
          driver_id: user.id,
          was_successful: false,
          error_message: error.message
        });
      }
      if (onFail) onFail(error.message);
    } finally {
      setIsVerifying(false);
    }
  }, [user, verificationConfig, toast, onSuccess, onFail]);

  return { isVerifying, startVerification, verificationStatus, verificationConfig };
}