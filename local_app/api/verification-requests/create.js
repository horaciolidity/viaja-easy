import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { user_id, mode = 'manual', expires_minutes = 15, requested_by } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ ok: false, error: 'user_id es requerido.' });
    }
    
    const { data: existingRequest, error: existingError } = await supabase
        .from('verification_requests')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
    
    if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
    }

    if (existingRequest) {
        return res.status(409).json({ ok: false, error: 'Ya existe una solicitud de verificación pendiente para este usuario.', id: existingRequest.id });
    }

    const expires_at = new Date(Date.now() + expires_minutes * 60 * 1000).toISOString();
    
    const { data: newRequest, error } = await supabase
      .from('verification_requests')
      .insert({ user_id, status: 'pending', expires_at, mode, requested_by })
      .select('id')
      .single();

    if (error) throw error;

    res.status(201).json({ ok: true, id: newRequest.id });
  } catch (error) {
    console.error('Error in /api/verification-requests/create:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}