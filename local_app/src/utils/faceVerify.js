import { supabase } from "@/lib/customSupabaseClient";

    async function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
    }

    export async function verifyAndSaveFace({ userId, liveFile, docFile }) {
      const [liveBase64, docBase64] = await Promise.all([
        fileToBase64(liveFile),
        fileToBase64(docFile)
      ]);

      const { data: result, error: functionError } = await supabase.functions.invoke('face-verify-live', {
        body: {
          request_id: `req-${Date.now()}`,
          user_id: userId,
          live_image_base64: liveBase64,
          doc_image_base64: docBase64,
          threshold: 85,
        }
      });

      if (functionError) {
        const errorBody = await functionError.context.json();
        throw new Error(`Error en la función de verificación: ${errorBody.error || functionError.message}`);
      }

      if (!result.ok) {
        throw new Error(`La verificación falló: ${result.error}`);
      }

      const { error: dbError } = await supabase.from("verification_requests").insert([
        {
          id: result.request_id,
          user_id: userId,
          passed: result.passed,
          confidence: result.confidence,
          raw_response: result,
        },
      ]);

      if (dbError) {
        console.error("Error guardando el resultado en la base de datos:", dbError);
        throw dbError;
      }

      return result;
    }