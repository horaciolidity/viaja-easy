import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MP_API_URL = 'https://api.mercadopago.com/checkout/preferences';

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
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { amount, description, externalReference } = await req.json();
    if (!amount || amount <= 0 || !externalReference) {
      return new Response(JSON.stringify({ error: 'Invalid amount or missing externalReference' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const fullName = profile.full_name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const siteUrl = Deno.env.get('SITE_URL') || 'https://viajafacil.cc';
    const callbackUrl = `${siteUrl}/mercadopago/callback`;
    const notificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`;

    const preference = {
      items: [{
        id: externalReference,
        title: description || 'Transacción ViajaFácil',
        category_id: 'transport',
        quantity: 1,
        unit_price: Number(amount),
        currency_id: 'ARS',
      }],
      payer: {
        name: firstName,
        surname: lastName,
        email: user.email,
        phone: {
          area_code: '54',
          number: profile.phone || '1100000000',
        },
      },
      back_urls: {
        success: callbackUrl,
        failure: callbackUrl,
        pending: callbackUrl,
      },
      auto_return: 'approved',
      external_reference: externalReference,
      notification_url: notificationUrl,
      statement_descriptor: 'VIAJAFACIL',
      binary_mode: true,
    };
    
    const accessToken = Deno.env.get('VITE_MP_ACCESS_TOKEN');
    if (!accessToken) {
        throw new Error('MercadoPago Access Token is not configured.');
    }

    const response = await fetch(MP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('MercadoPago API Error:', data);
      throw new Error(data.message || 'Failed to create preference.');
    }

    await supabaseAdmin.from('mp_payments').insert({
        user_id: user.id,
        preference_id: data.id,
        external_reference: externalReference,
        amount: amount,
        status: 'pending',
    });

    return new Response(JSON.stringify({ preferenceId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create Preference Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});