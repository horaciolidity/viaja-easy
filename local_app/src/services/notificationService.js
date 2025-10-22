import { supabase } from '@/lib/supabaseClient';
import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

export const generateNotificationTemplate = async (prompt) => {
    const operation = async () => {
        const { data, error } = await supabase.functions.invoke('cohere-generate-notification', {
            body: JSON.stringify({ prompt }),
        });
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        return data.message;
    };
    return NetworkErrorHandler.retryOperation(operation).catch(err => {
      NetworkErrorHandler.handleError(err, 'generación de plantilla de notificación');
      throw err;
    });
};

export const sendBroadcastNotification = async ({ title, body, targetUserType }) => {
    const operation = async () => {
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id')
            .in('user_type', targetUserType === 'all' ? ['passenger', 'driver'] : [targetUserType]);

        if (usersError) throw usersError;

        if (!users || users.length === 0) {
            throw new Error("No se encontraron usuarios para notificar.");
        }

        const notifications = users.map(user => ({
            user_id: user.id,
            title,
            body,
            type: 'broadcast',
            is_broadcast: true,
        }));

        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) throw error;
        return { success: true, count: users.length };
    };
    return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'envío de notificación masiva');
        throw err;
    });
};

export const scheduleBroadcastNotification = async ({ title, body, targetUserType, scheduledFor }) => {
    const operation = async () => {
        const { data, error } = await supabase
            .from('scheduled_notifications')
            .insert([{
                title,
                body,
                target_user_type: targetUserType,
                scheduled_for: scheduledFor,
                status: 'scheduled',
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    };
    return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'programación de notificación masiva');
        throw err;
    });
};

export const getSentNotifications = async () => {
    const operation = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('is_broadcast', true)
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        
        const uniqueNotifications = data.reduce((acc, current) => {
            if (!acc.find(item => item.title === current.title && item.body === current.body)) {
                acc.push(current);
            }
            return acc;
        }, []);

        return uniqueNotifications;
    };
    return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'obtención de notificaciones enviadas');
        throw err;
    });
};

export const getScheduledNotifications = async () => {
    const operation = async () => {
        const { data, error } = await supabase
            .from('scheduled_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        return data;
    };
    return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'obtención de notificaciones programadas');
        throw err;
    });
};

export const deleteScheduledNotification = async (id) => {
    const operation = async () => {
        const { error } = await supabase
            .from('scheduled_notifications')
            .delete()
            .eq('id', id);
        if (error) throw error;
    };
    return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'eliminación de notificación programada');
        throw err;
    });
};