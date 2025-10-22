import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, code, new_password } = await req.json();

    if (!email || !code || !new_password) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos: email, código o nueva contraseña.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Verify code and expiration
    const { data: resetRecord, error: fetchError } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !resetRecord) {
      return new Response(JSON.stringify({ error: 'Código inválido o no se encontró solicitud de restablecimiento.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'El código de restablecimiento ha expirado. Por favor, solicita uno nuevo.' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (resetRecord.code !== code) {
      return new Response(JSON.stringify({ error: 'El código ingresado es incorrecto.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get user from auth.users by email
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers({ email: email, perPage: 1 });
    
    if (userError || !users || users.length === 0) {
        return new Response(JSON.stringify({ error: 'No se pudo encontrar al usuario para actualizar.' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const userToUpdate = users[0];

    // 3. Update the user's password using the Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userToUpdate.id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return new Response(JSON.stringify({ error: 'No se pudo actualizar la contraseña. Por favor, inténtalo de nuevo.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Delete the OTP record
    const { error: deleteError } = await supabaseAdmin
      .from('password_resets')
      .delete()
      .eq('email', email);

    if (deleteError) {
      console.error('Error deleting OTP record:', deleteError);
      // Non-critical error, so we don't fail the whole request
    }

    return new Response(JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error verifying code and updating password:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});