import { serve } from "https://deno.land/std/http/server.ts";
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
    import { corsHeaders } from "../_shared/cors.ts";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FACEPP_KEY = Deno.env.get("FACEPP_API_KEY") || "";
    const FACEPP_SECRET = Deno.env.get("FACEPP_API_SECRET") || "";
    const DEFAULT_THRESHOLD = Number(Deno.env.get("FACEPP_MIN_CONFIDENCE") ?? 85);

    const BASE = "https://api-us.faceplusplus.com";
    const DETECT = `${BASE}/facepp/v3/detect`;
    const COMPARE = `${BASE}/facepp/v3/compare`;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const json = (b: unknown, s = 200) =>
      new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const stripB64 = (x: string) => (x?.startsWith("data:") ? x.slice(x.indexOf(",") + 1) : x || "");

    async function downloadAsBase64(publicOrStorageUrl: string): Promise<string> {
      const m = publicOrStorageUrl.match(/\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
      if (m) {
        const [, bucket, path] = m;
        const { data, error } = await supabase.storage.from(bucket).download(path);
        if (error) throw new Error("storage download: " + error.message);
        const buf = new Uint8Array(await data.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        // @ts-ignore
        return btoa(bin);
      }

      const r = await fetch(publicOrStorageUrl);
      if (!r.ok) throw new Error(`avatar fetch ${r.status}`);
      const buf = new Uint8Array(await r.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      // @ts-ignore
      return btoa(bin);
    }

    async function faceppDetectBase64(imageBase64: string) {
      const fd = new FormData();
      fd.append("api_key", FACEPP_KEY);
      fd.append("api_secret", FACEPP_SECRET);
      fd.append("image_base64", imageBase64);

      const r = await fetch(DETECT, { method: "POST", body: fd });
      if (!r.ok) throw new Error("Face++ Detect: " + (await r.text()));
      const j = await r.json();
      if (j?.error_message) throw new Error("Face++ Detect API Error: " + j.error_message);
      const token = j?.faces?.[0]?.face_token;
      if (!token) throw new Error("No se detectó rostro en la imagen del DNI.");
      return token;
    }

    async function faceppCompare({
      selfieBase64,
      refToken,
      refBase64,
    }: {
      selfieBase64: string;
      refToken?: string;
      refBase64?: string;
    }) {
      const fd = new FormData();
      fd.append("api_key", FACEPP_KEY);
      fd.append("api_secret", FACEPP_SECRET);
      fd.append("image_base64_2", selfieBase64);
      if (refToken) {
        fd.append("face_token1", refToken);
      } else if (refBase64) {
        fd.append("image_base64_1", refBase64);
      } else {
        throw new Error("Falta referencia para comparar");
      }

      const r = await fetch(COMPARE, { method: "POST", body: fd });
      if (!r.ok) throw new Error("Face++ Compare: " + (await r.text()));
      const j = await r.json();
      if (j?.error_message) throw new Error("Face++ Compare API Error: " + j.error_message);
      return j;
    }

    serve(async (req) => {
      if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

      if (req.method === "GET") {
        return json({
          envOk: !!(FACEPP_KEY && FACEPP_SECRET),
          keyLen: FACEPP_KEY.length,
          secretLen: FACEPP_SECRET.length,
          region: "us",
        });
      }

      try {
        const body = await req.json().catch(() => ({}));
        const request_id = String(body?.request_id || "");
        const user_id = String(body?.user_id || "");
        const live_image_base64 = stripB64(String(body?.live_image_base64 || ""));
        const doc_image_base64 = body?.doc_image_base64 ? stripB64(String(body.doc_image_base64)) : null;
        const threshold = Number(body?.threshold ?? DEFAULT_THRESHOLD);

        if (!request_id || !user_id || !live_image_base64) {
          return json(
            { ok: false, error: "Faltan parámetros", required: ["request_id", "user_id", "live_image_base64"] },
            400
          );
        }
        if (!FACEPP_KEY || !FACEPP_SECRET) {
          return json({ ok: false, error: "Falta FACEPP_API_KEY o FACEPP_API_SECRET en Secrets" }, 500);
        }

        const { data: p, error: pErr } = await supabase
          .from("profiles")
          .select("id,user_type,doc_face_token,avatar_url")
          .eq("id", user_id)
          .single();
        if (pErr) return json({ ok: false, error: `DB: ${pErr.message}` }, 500);
        if (p?.user_type !== "driver") return json({ ok: false, error: "Solo drivers requieren verificación" }, 400);

        let used: "doc_image_base64" | "stored_doc_face_token" | "avatar_url" | "dni_doc" | "none" = "none";
        let refToken: string | null = p?.doc_face_token || null;
        let cmp: any;

        if (!refToken && doc_image_base64) {
          refToken = await faceppDetectBase64(doc_image_base64);
          const { error: upErr } = await supabase.from("profiles").update({ doc_face_token: refToken }).eq("id", user_id);
          if (upErr) console.warn("No se pudo guardar doc_face_token:", upErr.message);
          used = "doc_image_base64";
        }

        if (refToken) {
          cmp = await faceppCompare({ selfieBase64: live_image_base64, refToken });
          if (used === "none") used = "stored_doc_face_token";
        } else if (p?.avatar_url) {
          const refB64 = await downloadAsBase64(p.avatar_url);
          cmp = await faceppCompare({ selfieBase64: live_image_base64, refBase64: refB64 });
          used = "avatar_url";
        } else {
            const { data: dniDoc, error: dniError } = await supabase
                .from('driver_documents')
                .select('file_url')
                .eq('user_id', user_id)
                .eq('doc_type', 'dni_front')
                .eq('status', 'approved')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (dniError || !dniDoc?.file_url) {
                await supabase
                    .from("verification_requests")
                    .update({
                        status: "failed",
                        result_json: { error: "missing-reference", detail: "No avatar_url or approved dni_front found." },
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", request_id);
                return json({
                    ok: false,
                    error: "Falta referencia: No se encontró foto de perfil ni DNI aprobado para comparar.",
                }, 400);
            }
            
            const refB64 = await downloadAsBase64(dniDoc.file_url);
            cmp = await faceppCompare({ selfieBase64: live_image_base64, refBase64: refB64 });
            used = "dni_doc";
        }

        const confidence = Number(cmp?.confidence ?? 0);
        const passed = confidence >= threshold;

        await supabase
          .from("verification_requests")
          .update({
            status: passed ? "success" : "failed",
            result_json: { ...cmp, used, region: "us" },
            updated_at: new Date().toISOString(),
          })
          .eq("id", request_id);

        if (passed) {
          await supabase.from("profiles").update({ last_face_verified_at: new Date().toISOString() }).eq("id", user_id);
        }

        return json({ ok: true, passed, confidence, threshold, used, region: "us" });
      } catch (e) {
        try {
          const body = await req.json().catch(() => ({}));
          const request_id = String(body?.request_id || "");
          if (request_id) {
            await supabase
              .from("verification_requests")
              .update({
                status: "failed",
                result_json: { error: String(e?.message ?? e) },
                updated_at: new Date().toISOString(),
              })
              .eq("id", request_id);
          }
        } catch { /* no-op */ }

        return json({ ok: false, error: String(e?.message ?? e) }, 500);
      }
    });