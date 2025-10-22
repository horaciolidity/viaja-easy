import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const emailTemplate = (email, otp) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código para Restablecer Contraseña</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; margin: 0; padding: 20px; background-color: #f8f9fa; color: #343a40; }
        .container { max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #dee2e6; }
        .header img { max-width: 240px; }
        .content { padding: 30px; line-height: 1.6; }
        .content h1 { font-size: 24px; color: #1DC9C9; margin-bottom: 15px; }
        .otp-block { background-color: #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: #0d6efd; letter-spacing: 8px; }
        .footer { background-color: #f1f3f5; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://horizons-cdn.hostinger.com/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/3a09a949b47cc959adb2761d2bc44da5.png" alt="ViajaFácil Logo">
        </div>
        <div class="content">
            <h1>Hola, ${email}</h1>
            <p>Recibimos una solicitud para restablecer tu contraseña en <strong>ViajaFácil</strong>.</p>
            <p>Usa el siguiente código para crear una nueva contraseña. ¡No lo compartas con nadie!</p>
            <div class="otp-block">
                <p style="margin-bottom: 10px; font-size: 14px; color: #495057;">Tu código de verificación es:</p>
                <p class="otp-code">${otp}</p>
            </div>
            <p>Este código va a estar activo por <strong>10 minutos</strong>.</p>
            <p>Si no fuiste vos, podés ignorar este correo sin problemas.</p>
            <p>¡Gracias por ser parte de ViajaFácil!</p>
        </div>
        <div class="footer">
            © 2025 ViajaFácil. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
`;


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'El email es requerido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      email: email,
      page: 1,
      perPage: 1,
    });

    if (userError || !users || users.length === 0) {
        return new Response(JSON.stringify({ error: 'No se encontró un usuario con ese correo electrónico.' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const code = generateOTP();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const { error: upsertError } = await supabaseAdmin
      .from('password_resets')
      .upsert({ email, code, expires_at }, { onConflict: 'email' });

    if (upsertError) throw upsertError;

    if (!RESEND_API_KEY) {
      throw new Error("La clave de API de Resend no está configurada en los secretos.");
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: 'ViajaFácil <no-reply@viajafacil.cc>',
            to: [email],
            subject: `Tu código para restablecer la contraseña es ${code}`,
            html: emailTemplate(email, code),
            text: `Tu código para restablecer la contraseña es: ${code}`
        }),
    });

    if (!emailRes.ok) {
        const errorData = await emailRes.json();
        console.error('Error en la API de Resend:', errorData);
        throw new Error('No se pudo enviar el email de restablecimiento.');
    }

    return new Response(JSON.stringify({ success: true, message: 'Se ha enviado un código de restablecimiento a tu correo.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error al solicitar el restablecimiento de contraseña:', error);
    return new Response(JSON.stringify({ error: error.message || 'No se pudo enviar el correo. Verificá el email e intentalo de nuevo.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});