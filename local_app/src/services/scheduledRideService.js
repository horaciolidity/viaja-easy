import { supabase } from '@/lib/supabaseClient';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

export const getScheduledRideSettings = async () => {
    const operation = async () => {
        const { data, error } = await supabase
            .from('scheduled_ride_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (error) throw error;
        return data;
    };
    try {
        return await NetworkErrorHandler.retryOperation(operation);
    } catch (error) {
        NetworkErrorHandler.handleError(error, 'obtención de configuración de viajes programados');
        return null;
    }
};

export const updateScheduledRideSettings = async (updates) => {
    const operation = async () => {
        const { id, ...updateData } = updates;
        const { data, error } = await supabase
            .from('scheduled_ride_settings')
            .update({ ...updateData, updated_at: new Date().toISOString() })
            .eq('id', 1)
            .select()
            .single();
        if (error) throw error;
        return data;
    };
    return NetworkErrorHandler.retryOperation(operation);
};