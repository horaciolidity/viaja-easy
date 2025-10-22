import React, { useState, useRef } from "react";
    import { supabase } from "@/lib/customSupabaseClient";
    import { useAuth } from "@/contexts/AuthContext";
    import { toJpegBlobFixed } from "@/lib/imageUtils";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
    import { Loader2, Camera, Upload, CheckCircle, XCircle } from "lucide-react";
    import { toast } from "@/components/ui/use-toast";

    const toBase64 = (blob) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

    export default function KycDniSelfie() {
      const { user } = useAuth();
      const [dniImage, setDniImage] = useState(null);
      const [selfieImage, setSelfieImage] = useState(null);
      const [dniPreview, setDniPreview] = useState(null);
      const [selfiePreview, setSelfiePreview] = useState(null);
      const [result, setResult] = useState(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);

      const dniInputRef = useRef(null);
      const selfieInputRef = useRef(null);

      const handleImageChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const compressedBlob = await toJpegBlobFixed(file);
          const previewUrl = URL.createObjectURL(compressedBlob);

          if (type === 'dni') {
            setDniImage(compressedBlob);
            setDniPreview(previewUrl);
          } else {
            setSelfieImage(compressedBlob);
            setSelfiePreview(previewUrl);
          }
        } catch (err) {
          console.error("Error processing image:", err);
          toast({
            title: "Error de Imagen",
            description: "No se pudo procesar la imagen. Intenta con otra.",
            variant: "destructive",
          });
        }
      };

      const handleSubmit = async () => {
        if (!dniImage || !selfieImage) {
          setError("Por favor, sube ambas imágenes.");
          return;
        }
        setLoading(true);
        setError(null);
        setResult(null);

        try {
          const [dniBase64, selfieBase64] = await Promise.all([
            toBase64(dniImage),
            toBase64(selfieImage),
          ]);

          const { data, error: invokeError } = await supabase.functions.invoke('face-verify-live', {
            body: {
              user_id: user.id,
              request_id: `kyc_${user.id}_${Date.now()}`,
              live_image_base64: selfieBase64,
              doc_image_base64: dniBase64,
            },
          });

          if (invokeError) throw invokeError;
          if (!data.ok) throw new Error(data.error || 'La verificación falló.');
          
          setResult(data);
          toast({
            title: data.passed ? "Verificación Exitosa" : "Verificación Fallida",
            description: `Confianza: ${data.confidence?.toFixed(2) ?? 'N/A'}%`,
            variant: data.passed ? "success" : "destructive",
          });

        } catch (err) {
          const errorMsg = err.context?.json?.().error || err.message || "Ocurrió un error desconocido.";
          setError(errorMsg);
          toast({ title: "Error en la Verificación", description: errorMsg, variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Verificación de Identidad</CardTitle>
              <CardDescription className="text-center">
                Sube una foto de tu DNI y una selfie para continuar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUploadBox
                title="Foto del DNI (frente)"
                preview={dniPreview}
                onButtonClick={() => dniInputRef.current.click()}
                inputId="dni-upload"
                capture="environment"
                onChange={(e) => handleImageChange(e, 'dni')}
                ref={dniInputRef}
              />
              <ImageUploadBox
                title="Selfie"
                preview={selfiePreview}
                onButtonClick={() => selfieInputRef.current.click()}
                inputId="selfie-upload"
                capture="user"
                onChange={(e) => handleImageChange(e, 'selfie')}
                ref={selfieInputRef}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button onClick={handleSubmit} disabled={loading || !dniImage || !selfieImage} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                {loading ? "Verificando..." : "Verificar Identidad"}
              </Button>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {result && (
                <div className={`w-full p-3 rounded-md flex items-center justify-center font-semibold ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {result.passed ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                  {result.passed ? 'Verificación Aprobada' : 'Verificación Rechazada'} - Confianza: {result.confidence?.toFixed(2)}%
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    const ImageUploadBox = React.forwardRef(({ title, preview, onButtonClick, inputId, capture, onChange }, ref) => (
      <div className="space-y-2">
        <Label className="font-semibold">{title}</Label>
        <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
          {preview ? (
            <img src={preview} alt={title} className="w-full h-full object-contain" />
          ) : (
            <div className="text-center text-slate-500">
              <Upload className="mx-auto h-8 w-8 mb-2" />
              <p>Toca para subir o tomar una foto</p>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={onButtonClick} className="w-full">
          <Camera className="mr-2 h-4 w-4" /> {preview ? 'Cambiar Foto' : 'Seleccionar Foto'}
        </Button>
        <input
          type="file"
          id={inputId}
          ref={ref}
          accept="image/jpeg,image/png"
          capture={capture}
          onChange={onChange}
          className="hidden"
        />
      </div>
    ));