// src/lib/faceClient.js (reemplazo de detectFace)
export async function detectFace(imageBase64, opts = {}) {
  const apiKey = import.meta.env.VITE_FACEPP_API_KEY;
  const apiSecret = import.meta.env.VITE_FACEPP_API_SECRET;

  // Por defecto US; solo si viene "cn" explícito usamos CN
  const envRegion = (import.meta.env.VITE_FACEPP_REGION || 'us').toLowerCase();
  const optRegion = (opts.region || envRegion || 'us').toLowerCase();
  const region = optRegion === 'cn' ? 'cn' : 'us';

  const endpoint =
    region === 'us'
      ? 'https://api-us.faceplusplus.com/facepp/v3/detect'
      : 'https://api-cn.faceplusplus.com/facepp/v3/detect';

  if (!apiKey || !apiSecret) {
    throw new Error('Faltan VITE_FACEPP_API_KEY o VITE_FACEPP_API_SECRET en las env vars.');
  }

  // Acepta "data:image/jpeg;base64,..." o solo el base64 y lo normaliza
  const cleanB64 = (str) => (str?.startsWith('data:') ? str.substring(str.indexOf(',') + 1) : str || '');
  const b64 = cleanB64(imageBase64);
  if (!b64) throw new Error('imageBase64 vacío o inválido');

  // Timeout opcional (por defecto 20s)
  const timeoutMs = Number(opts.timeoutMs ?? 20000);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort('timeout'), timeoutMs);

  try {
    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('api_secret', apiSecret);
    formData.append('image_base64', b64);
    // Deja los atributos si te sirven; puedes quitarlos si querés
    formData.append('return_attributes', 'gender,age,smiling,headpose,facequality');

    const res = await fetch(endpoint, { method: 'POST', body: formData, signal: ac.signal });

    // Intenta parsear JSON siempre (Face++ devuelve body útil en errores)
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }

    if (!res.ok) {
      const msg = json?.error_message || `Error HTTP ${res.status}`;
      throw new Error(`Face++ Detect: ${msg}`);
    }
    if (json?.error_message) {
      throw new Error(`Face++ Detect: ${json.error_message}`);
    }
    return json;
  } catch (err) {
    // Log detallado para debug
    console.error('[detectFace] Error:', err);
    throw err; // Propaga para que el caller pueda manejarlo
  } finally {
    clearTimeout(t);
  }
}