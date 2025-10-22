import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dniImage, selfieImage } = await req.json()

    if (!dniImage || !selfieImage) {
      return new Response(JSON.stringify({ error: "Faltan imágenes" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const apiKey = Deno.env.get("FACEPP_API_KEY")!
    const apiSecret = Deno.env.get("FACEPP_API_SECRET")!
    const region = Deno.env.get("FACEPP_REGION") || "us"

    const url = `https://api-${region}.faceplusplus.com/facepp/v3/compare`

    const formData = new FormData()
    formData.append("api_key", apiKey)
    formData.append("api_secret", apiSecret)
    formData.append("image_base64_1", dniImage)
    formData.append("image_base64_2", selfieImage)

    const resp = await fetch(url, {
      method: "POST",
      body: formData
    })

    const data = await resp.json()
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})