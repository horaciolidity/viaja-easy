import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import FormData from 'form-data';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FACEPP_API_KEY = process.env.FACEPP_API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET;
const FACEPP_DETECT_URL = 'https://api-us.faceplusplus.com/facepp/v3/detect';
const FACEPP_COMPARE_URL = 'https://api-us.faceplusplus.com/facepp/v3/compare';


export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { request_id, user_id, live_image_base64, threshold = 85 } = req.body;

    if (!request_id || !user_id || !live_image_base64) {
      return res.status(400).json({ ok: false, error: 'Faltan parámetros requeridos.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user_id)
      .eq('user_type', 'driver')
      .single();

    if (profileError || !profile || !profile.avatar_url) {
      return res.status(404).json({ ok: false, error: 'Perfil de conductor no encontrado o sin foto de perfil.' });
    }
    
    const detectFormData = new FormData();
    detectFormData.append('api_key', FACEPP_API_KEY);
    detectFormData.append('api_secret', FACEPP_API_SECRET);
    detectFormData.append('image_base64', live_image_base64);
    detectFormData.append('return_attributes', 'none');

    const detectResponse = await fetch(FACEPP_DETECT_URL, { method: 'POST', body: detectFormData });
    const detectData = await detectResponse.json();

    if (detectData.error_message || !detectData.faces || detectData.faces.length !== 1) {
        return res.status(400).json({ ok: false, error: 'Se debe detectar exactamente un rostro en la foto en vivo.', details: detectData.error_message });
    }

    const compareFormData = new FormData();
    compareFormData.append('api_key', FACEPP_API_KEY);
    compareFormData.append('api_secret', FACEPP_API_SECRET);
    compareFormData.append('image_url1', profile.avatar_url);
    compareFormData.append('image_base64_2', live_image_base64);

    const compareResponse = await fetch(FACEPP_COMPARE_URL, { method: 'POST', body: compareFormData });
    const compareData = await compareResponse.json();

    if (compareData.error_message) {
      throw new Error(`Face++ Compare API Error: ${compareData.error_message}`);
    }

    const confidence = compareData.confidence || 0;
    const isVerified = confidence >= threshold;

    const updatePayload = {
      status: isVerified ? 'success' : 'failed',
      result_json: { ...compareData, threshold },
      updated_at: new Date().toISOString(),
    };

    const { error: updateReqError } = await supabase
      .from('verification_requests')
      .update(updatePayload)
      .eq('id', request_id);

    if (updateReqError) throw updateReqError;

    if (isVerified) {
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ last_face_verified_at: new Date().toISOString() })
        .eq('id', user_id);
      if (updateProfileError) throw updateProfileError;
    }
    
    res.status(200).json({ ok: true, verified: isVerified, confidence, threshold });

  } catch (error) {
    console.error('Error in /api/face/verify-live:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}