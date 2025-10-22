import { supabase } from '@/lib/customSupabaseClient';
    import { NetworkErrorHandler } from '@/utils/errorHandler';

    export const getProfile = async (userId) => {
      try {
        const operation = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select(`
              *,
              driver_documents(*),
              passenger_documents(*)
            `)
            .eq('id', userId)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          return data;
        };

        return await NetworkErrorHandler.retryOperation(operation, 2);
      } catch (error) {
        NetworkErrorHandler.handleError(error, 'obtención de perfil');
        throw error;
      }
    };

    export const updateProfile = async (userId, updates) => {
      try {
        const operation = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

          if (error) throw error;
          return data;
        };

        return await NetworkErrorHandler.retryOperation(operation, 2);
      } catch (error) {
        NetworkErrorHandler.handleError(error, 'actualización de perfil');
        throw error;
      }
    };

    export const getAllProfiles = async () => {
      try {
        const operation = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        };

        return await NetworkErrorHandler.retryOperation(operation, 2);
      } catch (error) {
        NetworkErrorHandler.handleError(error, 'obtención de perfiles');
        throw error;
      }
    };

    export const getProfilesByType = async (userType) => {
      try {
        const operation = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_type', userType)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        };

        return await NetworkErrorHandler.retryOperation(operation, 2);
      } catch (error) {
        NetworkErrorHandler.handleError(error, `obtención de ${userType}s`);
        throw error;
      }
    };

    export const updateProfileStatus = async (userId, status) => {
      try {
        const operation = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .update({ status })
            .eq('id', userId)
            .select()
            .single();

          if (error) throw error;
          return data;
        };

        return await NetworkErrorHandler.retryOperation(operation, 2);
      } catch (error) {
        NetworkErrorHandler.handleError(error, 'actualización de estado');
        throw error;
      }
    };