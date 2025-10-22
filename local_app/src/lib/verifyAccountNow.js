import { supabase } from "@/lib/supabaseClient";

export async function verifyAccountNow(userId) {
  const { data, error } = await supabase.rpc("admin_verify_account", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}