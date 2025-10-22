import React, { useState, useRef, useCallback, useEffect } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
    import { Button } from "@/components/ui/button";
    import { useToast } from "@/components/ui/use-toast";
    import { Loader2, Camera, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import { supabase } from '@/lib/customSupabaseClient';

    const FaceVerifyModal = ({ isOpen, onOpen, onClose, request }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const videoRef = useRef(null);
      const canvasRef = useRef(null);
      const [isVerifying, setIsVerifying] = useState(false);
      const [verificationResult, setVerificationResult] = useState(null);
      const [stream, setStream] = useState(null);
      const [error, setError] = useState(null);
      const cameraStartedRef = useRef(false);

      const startCamera = useCallback(async () => {
        if (cameraStartedRef.current || !isOpen) return;
        cameraStartedRef.current = true;
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 },
              facingMode: 'user'
            } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setStream(mediaStream);
          setError(null);
        } catch (err) {
          console.error("Error accessing camera:", err);
          setError("No se pudo acceder a la cámara. Por favor, revisa los permisos en tu navegador.");
        }
      }, [isOpen]);

      const stopCamera = useCallback(() => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
        cameraStartedRef.current = false;
      }, [stream]);

      useEffect(() => {
        if (isOpen) {
          onOpen();
          startCamera();
        } else {
          stopCamera();
          setVerificationResult(null);
        }
      }, [isOpen, startCamera, stopCamera, onOpen]);
      
      const handleClose = () => {
          stopCamera();
          onClose();
      };

      const handleVerify = async () => {
        if (!videoRef.current || !request || !user || isVerifying || !videoRef.current.srcObject) return;
        
        setIsVerifying(true);
        setVerificationResult(null);
        setError(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const liveImageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
        
        try {
          const { data, error: invokeError } = await supabase.functions.invoke('face-verify-live', {
            body: JSON.stringify({
              request_id: request.id,
              user_id: user.id,
              live_image_base64: liveImageBase64,
              threshold: 85
            }),
          });
          
          if (invokeError) {
            let errorMsg = invokeError.message;
            try {
              const errorBody = await invokeError.context.json();
              errorMsg = errorBody.error || errorMsg;
            } catch (e) {
              // Ignore if response is not json
            }
            throw new Error(errorMsg);
          }
          
          if (data?.ok && data.passed) {
            setVerificationResult('success');
            toast({
              title: "¡Verificación Exitosa!",
              description: `Confianza: ${data.confidence.toFixed(2)}%`,
              variant: "success",
            });
            setTimeout(handleClose, 2000);
          } else {
            setVerificationResult('failed');
            setError(data?.error || "No pudimos confirmar tu identidad. Asegúrate de tener buena iluminación y que tu rostro esté visible.");
            toast({
              title: "Verificación Fallida",
              description: data?.error || "No pudimos confirmar tu identidad. Asegúrate de tener buena iluminación y que tu rostro esté visible.",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error("Verification failed:", err);
          setVerificationResult('failed');
          setError(err.message || "Ocurrió un error inesperado.");
          toast({
            title: "Error de Verificación",
            description: err.message || "Ocurrió un error inesperado.",
            variant: "destructive",
          });
        } finally {
          setIsVerifying(false);
        }
      };

      const handleRetry = () => {
        setVerificationResult(null);
        setError(null);
        if (!cameraStartedRef.current) {
            startCamera();
        }
      }

      return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">Verificación Facial</DialogTitle>
              <DialogDescription className="text-center">
                Centra tu rostro en el recuadro para confirmar tu identidad.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 flex justify-center items-center">
              <div className="relative w-full aspect-square max-w-[300px] bg-slate-200 rounded-full overflow-hidden flex items-center justify-center">
                {error && !stream ? (
                    <p className="text-red-500 text-center p-4">{error}</p>
                ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
              </div>
            </div>
            <DialogFooter className="flex-col space-y-2">
                {!verificationResult && (
                    <Button onClick={handleVerify} disabled={isVerifying || !stream}>
                        {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                        {isVerifying ? 'Verificando...' : 'Verificar Ahora'}
                    </Button>
                )}
                {verificationResult === 'success' && (
                    <div className="flex items-center justify-center text-green-600 font-bold p-4 bg-green-100 rounded-md">
                        <CheckCircle className="mr-2 h-6 w-6"/> ¡Verificado!
                    </div>
                )}
                {verificationResult === 'failed' && (
                     <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-center text-red-600 font-bold p-4 bg-red-100 rounded-md">
                            <XCircle className="mr-2 h-6 w-6"/> Verificación Fallida
                        </div>
                        {error && <p className="text-sm text-center text-red-700">{error}</p>}
                        <Button onClick={handleRetry} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
                        </Button>
                    </div>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    export default FaceVerifyModal;