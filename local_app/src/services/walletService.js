import { supabase } from '@/lib/supabaseClient';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

export const getOrCreateWallet = async (userId) => {
  try {
    const operation = async () => {
      const { data, error } = await supabase.rpc('get_or_create_wallet_with_history', { p_user_id: userId });
      
      if (error) throw error;
      return data;
    };

    return await NetworkErrorHandler.retryOperation(operation, 3);
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'obtención de billetera');
    throw error;
  }
};

export const addFunds = async ({ userId, amount, reason, type, adminId = null, referenceId = null, externalReference = null }) => {
  try {
    const operation = async () => {
      const { error } = await supabase.rpc('manual_wallet_adjustment', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_type: type,
        p_admin_id: adminId,
        p_reference_id: referenceId,
        p_external_reference: externalReference,
      });

      if (error) throw error;

      return { success: true };
    };

    return await NetworkErrorHandler.retryOperation(operation, 2);
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'ajuste manual de saldo');
    throw error;
  }
};

export const getWalletHistory = async (userId, limit = 50) => {
  try {
    const operation = async () => {
      const { data, error } = await supabase
        .from('wallet_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    };

    return await NetworkErrorHandler.retryOperation(operation, 2);
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'obtención de historial de billetera');
    throw error;
  }
};

export const requestWithdrawal = async (amount) => {
  try {
    const { data, error } = await supabase.rpc('request_withdrawal', { p_amount: amount });
    if (error) throw error;
    if (!data.success) throw new Error(data.message);
    return data;
  } catch (error) {
    NetworkErrorHandler.handleError(error, 'solicitud de retiro');
    throw error;
  }
};