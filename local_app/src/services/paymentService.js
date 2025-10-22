// src/services/paymentService.js
import { supabase } from '@/lib/supabaseClient';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

/**
 * Crea un pago interno (no MP). Deja por compatibilidad si lo usas en otros flujos.
 */
export const createPayment = async (paymentData) => {
  const operation = async () => {
    const payload = { ...paymentData };
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: payload,
    });
    if (error) throw error;
    return data;
  };

  try {
    // sin reintentos (0) para pagos internos
    return await NetworkErrorHandler.retryOperation(operation, 0);
  } catch (err) {
    NetworkErrorHandler.handleError(err, 'creación de pago');
    throw err;
  }
};

/**
 * Crea una preferencia de Mercado Pago y devuelve la URL (init_point).
 * Este es el ÚNICO lugar donde debe llamarse la Edge Function de MP.
 */
export const createPreference = async ({ amount, externalReference, description }) => {
  try {
    const operation = async () => {
      // Validaciones tempranas
      if (
        typeof amount !== 'number' ||
        Number.isNaN(amount) ||
        amount <= 0 ||
        !externalReference ||
        typeof externalReference !== 'string'
      ) {
        const ctx = { amount, externalReference };
        console.error('createPreference Error: datos inválidos.', ctx);
        throw new Error('El monto y la referencia son inválidos para crear la preferencia de pago.');
      }

      const { data, error } = await supabase.functions.invoke('mp-create-preference-v2', {
        body: { amount, externalReference, description },
      });

      if (error) {
        throw new Error(`Error invocando la función: ${error.message}`);
      }
      if (data?.error) {
        throw new Error(`Error desde la función: ${data.error}`);
      }
      if (!data?.init_point) {
        throw new Error('No se pudo obtener la URL de pago de Mercado Pago.');
      }

      return data.init_point;
    };

    // un reintento por si hay error transitorio de red/edge
    return await NetworkErrorHandler.retryOperation(operation, 1);
  } catch (err) {
    NetworkErrorHandler.handleError(err, 'creación de preferencia de pago');
    throw err;
  }
};
