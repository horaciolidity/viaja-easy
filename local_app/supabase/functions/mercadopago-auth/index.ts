import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MP_AUTH_URL = 'https://auth.mercadopago.com.ar/authorization';
const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, code, state } = await req.json();
    const clientId = Deno.env.get('VITE_MP_CLIENT_ID');
    const clientSecret = Deno.env.get('VITE_MP_CLIENT_SECRET');
    const redirectUri = Deno.env.get('VITE_APP_REDIRECT_URI') || 'https://viajafacil.cc/mercadopago/callback';

    if (!clientId || !clientSecret) {
      console.error('MercadoPago client credentials are not configured.');
      return new Response(JSON.stringify({ success: false, error: 'Error de configuración del servidor.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get-auth-url') {
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'offline_access read write',
        state: user.id,
      });
      const authUrl = `${MP_AUTH_URL}?${params.toString()}`;
      return new Response(JSON.stringify({ authUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'exchange-code') {
      if (!code || !state) {
        return new Response(JSON.stringify({ success: false, error: 'Faltan parámetros de consulta de código o estado.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      if (user.id !== state) {
        return new Response(JSON.stringify({ success: false, error: 'El estado no coincide. Posible ataque CSRF.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const response = await fetch(MP_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await response.json();
      if (!response.ok) {
        console.error('Error al intercambiar el código con Mercado Pago:', tokenData);
        const errorMessage = tokenData.error === 'invalid_grant' 
          ? 'El código de autorización es inválido o ha expirado. Por favor, intenta vincular la cuenta de nuevo.'
          : tokenData.message || 'No se pudo obtener el token de acceso de Mercado Pago.';
        return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { error: upsertError } = await supabaseAdmin
        .from('mercado_pago_tokens')
        .upsert({
            supabase_user_id: user.id,
            mercado_pago_user_id: tokenData.user_id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            scope: tokenData.scope,
            token_type: tokenData.token_type,
            public_key: tokenData.public_key,
            live_mode: tokenData.live_mode,
            expires_in: tokenData.expires_in,
            updated_at: new Date().toISOString()
        }, { onConflict: 'supabase_user_id' });


      if (upsertError) {
        console.error('Error al guardar tokens en Supabase:', upsertError);
        return new Response(JSON.stringify({ success: false, error: 'Error al guardar la información de la cuenta.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

       const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ mp_linked_at: new Date().toISOString(), default_payment_method: 'mercadopago' })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error('Error al actualizar el perfil del usuario:', profileUpdateError);
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'unlink-account') {
        const { error: deleteError } = await supabaseAdmin
          .from('mercado_pago_tokens')
          .delete()
          .eq('supabase_user_id', user.id);
        
        if (deleteError) {
          console.error('Error al eliminar tokens de Supabase:', deleteError);
          return new Response(JSON.stringify({ success: false, error: 'Error al desvincular la cuenta.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          mp_linked_at: null,
          default_payment_method: 'cash'
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error al actualizar el perfil tras desvincular:', updateError);
      }

      return new Response(JSON.stringify({ success: true, message: 'Cuenta desvinculada exitosamente.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: false, error: 'Acción no válida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error en mercadopago-auth:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});