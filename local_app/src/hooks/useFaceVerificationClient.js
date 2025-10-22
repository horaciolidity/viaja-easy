import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { differenceInMinutes } from 'date-fns';

export const useFaceVerificationClient = () => {
  const { user, profile } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const [pendingRequest, setPendingRequest] = useState(null);
  const inFlightRef = useRef(false);
  const seenReqsRef = useRef(new Set());

  const createScheduledRequest = useCallback(async () => {
    if (!user) return null;
    try {
      const { data, error } = await supabase.functions.invoke('verification-request-create', {
        body: {
          user_id: user.id,
          mode: 'scheduled',
          requested_by: 'system',
        },
      });
      if (error) {
        throw new Error(error.message || 'Error al crear la solicitud de verificación.');
      }
      return data;
    } catch (error) {
      console.error('Error creating scheduled verification request:', error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    if (!user || !profile || profile.user_type !== 'driver' || settingsLoading) {
      return;
    }

    const checkVerificationStatus = async () => {
      const { face_recognition_mode, face_recognition_interval_minutes } = settings.appSettings || {};
      
      if (face_recognition_mode !== 'scheduled') {
        return;
      }
      
      const lastVerified = profile.last_face_verified_at;
      const interval = face_recognition_interval_minutes || 1440;

      if (!lastVerified || differenceInMinutes(new Date(), new Date(lastVerified)) > interval) {
        const { data: existing, error } = await supabase
          .from('verification_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .limit(1)
          .maybeSingle();

        if (!existing && !error) {
          await createScheduledRequest();
        }
      }
    };

    checkVerificationStatus();
  }, [user, profile, settings, settingsLoading, createScheduledRequest]);

  useEffect(() => {
    if (!user) return;

    const handleNewRequest = (payload) => {
      const newReq = payload.new;
      if (newReq.status === 'pending' && !inFlightRef.current && !seenReqsRef.current.has(newReq.id)) {
        seenReqsRef.current.add(newReq.id);
        setPendingRequest(newReq);
      }
    };
    
    const handleRequestUpdate = (payload) => {
      const updatedReq = payload.new;
      if (pendingRequest && updatedReq.id === pendingRequest.id && updatedReq.status !== 'pending') {
        setPendingRequest(null);
        inFlightRef.current = false;
      }
    }

    const channel = supabase
      .channel(`verification_requests:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'verification_requests',
          filter: `user_id=eq.${user.id}`,
        },
        handleNewRequest
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'verification_requests',
          filter: `user_id=eq.${user.id}`,
        },
        handleRequestUpdate
      )
      .subscribe();

    const fetchInitialPendingRequest = async () => {
        const { data, error } = await supabase
            .from('verification_requests')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching initial pending request:", error);
        }

        if (data && !inFlightRef.current && !seenReqsRef.current.has(data.id)) {
            seenReqsRef.current.add(data.id);
            setPendingRequest(data);
        }
    };

    fetchInitialPendingRequest();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pendingRequest]);
  
  const onModalOpen = useCallback(() => {
    inFlightRef.current = true;
  }, []);

  const onModalClose = useCallback(() => {
    inFlightRef.current = false;
    setPendingRequest(null);
  }, []);

  return {
    pendingRequest,
    isModalOpen: !!pendingRequest,
    onModalOpen,
    onModalClose,
  };
};