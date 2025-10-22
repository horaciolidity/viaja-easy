import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useDriverVerification() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }

    const { data: verificationData, error } = await supabase
      .from("v_driver_verification_status")
      .select("is_verified, missing_doc_types")
      .eq("user_id", uid)
      .single();

    if (!error && verificationData) {
      setData(verificationData);
    } else if (error) {
      console.error("Error fetching verification status:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    refetch();
  }, []);

  return { data, refetch, loading };
}