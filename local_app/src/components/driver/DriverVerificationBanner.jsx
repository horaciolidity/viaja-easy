import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDriverVerification } from "@/hooks/useDriverVerification";

function prettyDocLabel(key) {
  const map = {
    dni_front: "DNI (frente)",
    dni_back: "DNI (dorso)",
    selfie_dni: "Selfie con DNI",
    license: "Licencia de conducir",
    criminal_record_cert: "Certificado de antecedentes",
    insurance: "Póliza de Seguro",
    vtv: "VTV / RTO",
    title: "Título / Cédula del Vehículo",
    vehicle_photos: "Fotos del Vehículo",
  };
  return map[key] ?? key;
}

export default function DriverVerificationBanner() {
  const { data: row, loading } = useDriverVerification();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="rounded-xl border border-blue-400 bg-blue-50 p-4 text-blue-800 flex items-center">
        <Loader2 className="animate-spin h-5 w-5 mr-3" />
        <span>Cargando estado de verificación...</span>
      </div>
    );
  }

  if (!row || row.is_verified) {
    return null;
  }

  return (
    <div className="rounded-xl border border-yellow-400 bg-yellow-50 p-4 text-yellow-800">
      <div className="flex items-center mb-2">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <div className="font-semibold">Tu cuenta aún no está verificada</div>
      </div>
      {row.missing_doc_types?.length > 0 ? (
        <>
          <div className="text-sm mb-2">
            Falta completar o que se aprueben estos documentos:
          </div>
          <ul className="list-disc pl-5 text-sm mb-3">
            {row.missing_doc_types.map((d) => (
              <li key={d}>{prettyDocLabel(d)}</li>
            ))}
          </ul>
        </>
      ) : (
        <div className="text-sm mb-3">
          Ya subiste todo. Estamos revisando tu documentación. ¡Gracias por tu paciencia!
        </div>
      )}
      <Button
        variant="outline"
        className="border-yellow-400 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-900"
        onClick={() => navigate("/upload-documents")}
      >
        Ir a completar documentación
      </Button>
    </div>
  );
}