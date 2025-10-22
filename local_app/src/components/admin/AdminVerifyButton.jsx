import React, { useState } from "react";
import { verifyAccountNow } from "@/lib/verifyAccountNow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle } from "lucide-react";

export function AdminVerifyButton({ userId, onRefetch }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      await verifyAccountNow(userId);
      onRefetch?.();
      toast({
        title: "Cuenta Verificada",
        description: "La cuenta del usuario ha sido activada y verificada forzosamente.",
        variant: "success",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: e.message ?? "No se pudo forzar la verificación.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      <CheckCircle className="w-4 h-4 mr-2" />
      {loading ? "Verificando..." : "Verificar (forzar)"}
    </Button>
  );
}