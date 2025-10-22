import React, { useState } from "react";
    import { verifyAndSaveFace } from "@/utils/faceVerify";
    import { useAuth } from "@/contexts/AuthContext";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
    import { Loader2, Camera, CheckCircle, XCircle } from "lucide-react";
    import { toast } from "@/components/ui/use-toast";

    export default function FaceVerifyForm() {
      const { user } = useAuth();
      const [liveFile, setLiveFile] = useState(null);
      const [docFile, setDocFile] = useState(null);
      const [result, setResult] = useState(null);
      const [loading, setLoading] = useState(false);

      const handleVerify = async () => {
        if (!liveFile || !docFile) {
          toast({
            title: "Archivos Faltantes",
            description: "Por favor, sube ambas imágenes para verificar.",
            variant: "destructive",
          });
          return;
        }

        try {
          setLoading(true);
          setResult(null);
          const res = await verifyAndSaveFace({
            userId: user.id,
            liveFile,
            docFile,
          });
          setResult(res);
          toast({
            title: "Verificación Procesada",
            description: `El resultado fue ${res.passed ? 'aprobado' : 'rechazado'} con una confianza de ${res.confidence.toFixed(2)}%.`,
            variant: res.passed ? "success" : "destructive",
          });
        } catch (err) {
          console.error(err);
          toast({
            title: "Error en la Verificación",
            description: err.message,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Verificación de Identidad</CardTitle>
                <CardDescription>Sube una foto en vivo y una del documento para comparar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="live-photo">Foto en Vivo (Selfie)</Label>
                    <Input id="live-photo" type="file" accept="image/*" onChange={(e) => setLiveFile(e.target.files[0])} />
                </div>
                <div>
                    <Label htmlFor="doc-photo">Foto del Documento</Label>
                    <Input id="doc-photo" type="file" accept="image/*" onChange={(e) => setDocFile(e.target.files[0])} />
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button onClick={handleVerify} disabled={loading || !liveFile || !docFile} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                {loading ? "Verificando..." : "Verificar"}
                </Button>

                {result && (
                    <div className={`w-full p-3 rounded-md flex items-center justify-center font-semibold ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.passed ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                        {result.passed
                            ? `✅ Aprobado (${result.confidence.toFixed(2)}%)`
                            : `❌ Rechazado (${result.confidence.toFixed(2)}%)`}
                    </div>
                )}
            </CardFooter>
            </Card>
        </div>
      );
    }