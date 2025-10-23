// src/pages/DocumentUploadPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { uploadUserDocuments, getUserDocuments } from "@/services/documentService";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadCloud, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { Separator } from "@/components/ui/separator";
import { useDriverVerification } from "@/hooks/useDriverVerification";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DocumentUploadPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { refetch: refetchDriverVerification } = useDriverVerification();

  const [files, setFiles] = useState({});
  const [existingDocs, setExistingDocs] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const isDriver = profile?.user_type === "driver";

  /* ---------------- Fetch Existing Documents ---------------- */
  const fetchExistingDocuments = useCallback(async () => {
    if (!user?.id) return;
    setPageLoading(true);
    try {
      const docsData = await getUserDocuments(user.id);
      if (docsData) {
        const docsMap = {};
        const allDocs = [...(docsData.driver || []), ...(docsData.passenger || [])];
        for (const doc of allDocs) {
          if (
            !docsMap[doc.doc_type] ||
            new Date(doc.created_at) > new Date(docsMap[doc.doc_type].created_at)
          ) {
            docsMap[doc.doc_type] = doc;
          }
        }
        setExistingDocs(docsMap);
      }
    } catch (err) {
      console.error("Error al cargar documentos:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos existentes.",
        variant: "destructive",
      });
    } finally {
      setPageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExistingDocuments();
  }, [fetchExistingDocuments]);

  /* ---------------- Document Definitions ---------------- */
  const personalDocs = [
    { id: "dni_front", label: "DNI (Frente)", required: true, capture: "environment", accept: "image/jpeg,image/png" },
    { id: "dni_back", label: "DNI (Dorso)", required: true, capture: "environment", accept: "image/jpeg,image/png" },
    { id: "selfie_dni", label: "Selfie con DNI", required: true, helpText: "Sostené tu DNI al lado de tu cara.", capture: "user", accept: "image/jpeg,image/png" },
  ];

  const driverProfessionalDocs = [
    { id: "license", label: "Licencia de Conducir Profesional", required: true, capture: "environment", accept: "image/jpeg,image/png" },
    {
      id: "criminal_record_cert_pdf",
      label: "Certificado de Antecedentes (PDF)",
      required: false,
      helpText: "Subí el PDF oficial. Si tu teléfono no lo muestra, buscá en la app 'Archivos'.",
      accept: "application/pdf",
      maxSizeMB: 10,
    },
    {
      id: "criminal_record_cert_img",
      label: "Certificado de Antecedentes (Foto)",
      required: false,
      helpText: "Si no tenés el PDF, sacale una foto clara y legible.",
      capture: "environment",
      accept: "image/jpeg,image/png",
      maxSizeMB: 10,
    },
  ];

  const vehicleDocs = [
    { id: "title", label: "Cédula Verde/Azul o Título", required: true, capture: "environment", accept: "image/jpeg,image/png" },
    { id: "insurance", label: "Póliza de Seguro Vigente", required: true, capture: "environment", accept: "image/jpeg,image/png" },
    { id: "vtv", label: "VTV / RTO Vigente", required: true, capture: "environment", accept: "image/jpeg,image/png" },
  ];

  const vehiclePhotos = [
    { id: "vehicle_photo_front", label: "Foto Frontal del Vehículo", required: true, helpText: "Asegurate de que la patente sea visible.", capture: "environment", accept: "image/jpeg,image/png" },
  ];

  /* ---------------- Handlers ---------------- */
  const handleFileChange = (docId, file) => {
    setFiles((prev) => ({ ...prev, [docId]: file || null }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const allDocs = isDriver
      ? [...personalDocs, ...driverProfessionalDocs, ...vehicleDocs, ...vehiclePhotos]
      : personalDocs;

    const missingRequired = allDocs.filter(
      (doc) => doc.required && !files[doc.id] && !existingDocs[doc.id]
    );

    if (missingRequired.length > 0) {
      toast({
        title: "Faltan documentos obligatorios",
        description: `Subí: ${missingRequired.map((d) => d.label).join(", ")}`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!Object.values(files).some(Boolean)) {
      toast({
        title: "No hay cambios",
        description: "No subiste ningún documento nuevo.",
        variant: "default",
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await uploadUserDocuments(user.id, profile.user_type, files);
      if (result?.success) {
        toast({
          title: "¡Documentos enviados!",
          description: "Se enviaron para verificación.",
          variant: "success",
        });
        setFiles({});
        await fetchExistingDocuments();
        await refreshProfile();
        if (isDriver) await refetchDriverVerification();
      } else {
        throw new Error(result?.message || "Ocurrió un error al subir los documentos.");
      }
    } catch (err) {
      console.error("Error al subir documentos:", err);
      toast({
        title: "Error al subir",
        description: err?.message || "Reintentá en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate(isDriver ? "/driver" : "/passenger");
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /* ---------------- Render Helper ---------------- */
  const renderDocSection = (title, docs) => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b pb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
        {docs.map((doc) => (
          <FileUpload
            key={doc.id}
            id={doc.id}
            label={doc.label}
            onFileChange={handleFileChange}
            currentFile={files[doc.id] || null}
            existingFile={existingDocs[doc.id] || null}
            required={doc.required}
            helpText={doc.helpText}
            disabled={isLoading}
            capture={doc.capture}
            acceptedFileTypes={doc.accept}
            maxSizeMB={doc.maxSizeMB ?? 5}
            openPreviewInNewTab
          />
        ))}
      </div>
    </div>
  );

  /* ---------------- Render Principal ---------------- */
  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-6"
      onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
              Verificación de Documentos
            </CardTitle>
            <CardDescription className="text-center max-w-2xl mx-auto">
              Subí los siguientes documentos. Los campos con{" "}
              <span className="text-red-500 font-bold">*</span> son obligatorios.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {isDriver && (
              <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertTriangle className="h-4 w-4 !text-yellow-500" />
                <AlertTitle className="font-bold">Aviso Importante</AlertTitle>
                <AlertDescription>
                  El Certificado de Antecedentes Penales es opcional para iniciar. Una vez verificada tu cuenta, tendrás 5 días para presentarlo. De lo contrario, tu cuenta será suspendida hasta que lo hagas.
                </AlertDescription>
              </Alert>
            )}

            {renderDocSection("Documentos Personales", personalDocs)}

            {isDriver && (
              <>
                <Separator className="my-8" />
                {renderDocSection("Documentación Profesional", driverProfessionalDocs)}
                <Separator className="my-8" />
                {renderDocSection("Documentación del Vehículo", vehicleDocs)}
                <Separator className="my-8" />
                {renderDocSection("Fotos del Vehículo", vehiclePhotos)}
              </>
            )}
          </CardContent>

          <CardFooter>
            <div className="flex flex-col sm:flex-row justify-between gap-4 w-full">
              <Button
                variant="outline"
                type="button"
                onClick={handleGoToDashboard}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || Object.values(files).every((f) => !f)}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" /> Enviar Documentos
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default DocumentUploadPage;
