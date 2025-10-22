import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import * as faceCore from '@/services/faceCore';

const FacialEnrollmentModal = ({ isOpen, onClose, onEnrollmentComplete }) => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle, loading_models, camera_permission, ready, enrolling, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setErrorMessage('No se pudo acceder a la cámara. Por favor, revisa los permisos.');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStatus('loading_models');
      faceCore.loadModels()
        .then(() => {
          setStatus('camera_permission');
          startCamera();
        })
        .catch(err => {
          setStatus('error');
          setErrorMessage(err.message);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      setStatus('idle');
    }
  }, [isOpen, startCamera]);

  const handleEnrollment = async () => {
    if (!user) {
      setErrorMessage('Usuario no encontrado.');
      setStatus('error');
      return;
    }
    setStatus('enrolling');
    try {
      const result = await faceCore.enrollFace(user.id, videoRef.current);
      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          onEnrollmentComplete();
        }, 2000);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message);
      toast({ title: 'Error de Registro Facial', description: err.message, variant: 'destructive' });
    }
  };

  const statusMessages = {
    idle: 'Esperando...',
    loading_models: 'Cargando modelos de IA...',
    camera_permission: 'Solicitando permiso de cámara...',
    ready: 'Centrá tu rostro y mantenete quieto.',
    enrolling: 'Procesando tu rostro...',
    success: '¡Registro exitoso!',
    error: 'Ocurrió un error',
  };

  const statusIcons = {
    loading_models: <Loader2 className="w-16 h-16 animate-spin text-blue-500" />,
    camera_permission: <Camera className="w-16 h-16 text-gray-500" />,
    enrolling: <Loader2 className="w-16 h-16 animate-spin text-blue-500" />,
    success: <CheckCircle className="w-16 h-16 text-green-500" />,
    error: <AlertTriangle className="w-16 h-16 text-red-500" />,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">Registro Facial</DialogTitle>
          <DialogDescription className="text-center text-gray-600 dark:text-gray-400">
            {statusMessages[status]}
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 flex justify-center items-center">
          <div className="relative w-full max-w-sm h-64 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex justify-center items-center">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform -scale-x-100 ${status === 'ready' || status === 'enrolling' ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-50 transition-opacity ${status === 'ready' || status === 'enrolling' ? 'opacity-0' : 'opacity-100'}`}>
              {statusIcons[status]}
            </div>
          </div>
        </div>
        {status === 'error' && (
          <p className="text-center text-red-500 font-medium">{errorMessage}</p>
        )}
        <DialogFooter>
          {status === 'ready' && (
            <Button onClick={handleEnrollment} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-lg">
              <UserCheck className="w-5 h-5 mr-2" /> Registrar mi Rostro
            </Button>
          )}
          {status === 'error' && (
            <Button onClick={onClose} variant="outline" className="w-full">Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FacialEnrollmentModal;