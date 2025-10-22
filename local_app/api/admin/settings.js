import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['face_recognition.mode', 'face_recognition.interval_minutes']);

      if (error) throw error;
      
      const settings = data.reduce((acc, { setting_key, setting_value }) => {
        const key = setting_key.split('.')[1];
        acc[key] = setting_key.includes('minutes') ? parseInt(setting_value, 10) : setting_value;
        return acc;
      }, { mode: 'scheduled', interval_minutes: 1440 });

      res.status(200).json({ settings });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { mode, interval_minutes } = req.body;
      
      const updates = [
        { setting_key: 'face_recognition.mode', setting_value: mode },
        { setting_key: 'face_recognition.interval_minutes', setting_value: String(interval_minutes) },
      ];

      const { error } = await supabase.from('admin_settings').upsert(updates, { onConflict: 'setting_key' });
      
      if (error) throw error;
      
      res.status(200).json({ message: 'Configuración guardada correctamente.' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}