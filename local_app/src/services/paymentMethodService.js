import { supabase } from '@/lib/supabaseClient';

export const linkMercadoPago = async () => {
  const { data, error } = await supabase.functions.invoke('mercadopago-auth', {
    body: { action: 'get-auth-url' },
  });

  if (error) {
    console.error('Error getting MercadoPago auth URL:', error);
    throw new Error('No se pudo iniciar la vinculación con MercadoPago.');
  }

  if (!data.authUrl) {
    console.error('No authUrl received from function');
    throw new Error('Respuesta inválida del servidor.');
  }

  return data.authUrl;
};

export const completeMercadoPagoLink = async (authCode, state) => {
  const { data, error } = await supabase.functions.invoke('mercadopago-auth', {
    body: { action: 'exchange-code', code: authCode, state: state },
  });

  if (error) {
    console.error('Error completing MercadoPago link:', error);
    throw new Error(error.message || 'No se pudo completar la vinculación con MercadoPago.');
  }

  return data;
};

export const unlinkMercadoPago = async () => {
  const { data, error } = await supabase.functions.invoke('mercadopago-auth', {
    body: { action: 'unlink-account' },
  });

  if (error) {
    console.error('Error unlinking MercadoPago account:', error);
    throw new Error('No se pudo desvincular la cuenta de MercadoPago.');
  }

  if (!data.success) {
    throw new Error(data.message || 'Ocurrió un error al desvincular la cuenta.');
  }

  return data;
};

export const setDefaultPaymentMethod = async (userId, method) => {
    const { data, error } = await supabase
        .from('profiles')
        .update({ default_payment_method: method })
        .eq('id', userId)
        .select()
        .single();
    
    if (error) {
        console.error('Error setting default payment method:', error);
        throw new Error('No se pudo establecer el método de pago predeterminado.');
    }
    
    return data;
};