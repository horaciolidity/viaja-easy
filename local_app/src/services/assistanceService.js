import { supabase } from '@/lib/supabaseClient';
    import { NetworkErrorHandler } from '@/utils/networkErrorHandler';

    export const createAssistanceThread = async (subject, initialMessage, userId, userRole) => {
      const operation = async () => {
        const { data: threadData, error: threadError } = await supabase
          .from('assistance_threads')
          .insert({
            subject,
            created_by: userId,
            role: userRole,
            status: 'open',
            user_has_unread: false,
            admin_has_unread: true,
          })
          .select()
          .single();

        if (threadError) throw threadError;

        const { error: messageError } = await supabase.from('assistance_messages').insert({
          thread_id: threadData.id,
          sender_id: userId,
          sender_role: userRole,
          message: initialMessage,
        });

        if (messageError) throw messageError;

        return threadData;
      };

      return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'creación de hilo de asistencia');
        throw err;
      });
    };

    export const createAssistanceThreadWithHistory = async (subject, history, userId, userRole) => {
      const operation = async () => {
        const { data: threadData, error: threadError } = await supabase
          .from('assistance_threads')
          .insert({
            subject,
            created_by: userId,
            role: userRole,
            status: 'open',
            user_has_unread: false,
            admin_has_unread: true,
          })
          .select()
          .single();

        if (threadError) throw threadError;

        const messagesToInsert = history.map(msg => ({
          thread_id: threadData.id,
          sender_id: msg.role === 'user' ? userId : null,
          sender_role: msg.role === 'user' ? userRole : 'bot',
          message: msg.content,
        }));

        const { error: messageError } = await supabase.from('assistance_messages').insert(messagesToInsert);

        if (messageError) throw messageError;

        return threadData;
      };

      return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'creación de hilo de asistencia desde chatbot');
        throw err;
      });
    };

    export const getAssistanceThreadsForUser = async (userId) => {
      const operation = async () => {
        const { data, error } = await supabase
          .from('assistance_threads')
          .select('*')
          .eq('created_by', userId)
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      };
      return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'obtención de hilos de asistencia');
        throw err;
      });
    };

    export const getAllAssistanceThreads = async () => {
      const operation = async () => {
        const { data, error } = await supabase
          .from('assistance_threads')
          .select('*, created_by:profiles(id, full_name, email, avatar_url, phone)')
          .order('admin_has_unread', { ascending: false })
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      };
      return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'obtención de todos los hilos de asistencia (admin)');
        throw err;
      });
    };

    export const getMessagesForThread = async (threadId) => {
      const operation = async () => {
        const { data, error } = await supabase
          .from('assistance_messages')
          .select('*, sender:profiles(id, full_name, avatar_url)')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
      };
      return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'obtención de mensajes de hilo');
        throw err;
      });
    };

    export const addMessageToThread = async (threadId, senderId, senderRole, message, imageUrl = null) => {
      const operation = async () => {
        const { data, error } = await supabase
          .from('assistance_messages')
          .insert({
            thread_id: threadId,
            sender_id: senderId,
            sender_role: senderRole,
            message,
            image_url: imageUrl,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      };
      return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'envío de mensaje de asistencia');
        throw err;
      });
    };

    export const updateThreadStatus = async (threadId, status) => {
      const operation = async () => {
        const { data, error } = await supabase
          .from('assistance_threads')
          .update({ status })
          .eq('id', threadId);

        if (error) throw error;
        return data;
      };
      return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'actualización de estado de hilo');
        throw err;
      });
    };

    export const updateThreadAdminReadStatus = async (threadId, hasUnread) => {
        const operation = async () => {
          const { data, error } = await supabase
            .from('assistance_threads')
            .update({ admin_has_unread: hasUnread })
            .eq('id', threadId);

          if (error) throw error;
          return { data, error: null };
        };
        return NetworkErrorHandler.retryOperation(operation).catch(err => {
            NetworkErrorHandler.handleError(err, 'actualización de estado de lectura de hilo');
            return { data: null, error: err };
        });
    };

    export const markUserMessagesAsRead = async (threadId, userId) => {
      const operation = async () => {
        const { error: threadError } = await supabase
          .from('assistance_threads')
          .update({ user_has_unread: false })
          .eq('id', threadId);
        if (threadError) throw threadError;

        const { error: messagesError } = await supabase
          .from('assistance_messages')
          .update({ is_read_by_user: true })
          .eq('thread_id', threadId)
          .eq('sender_role', 'admin')
          .neq('sender_id', userId);
        if (messagesError) throw messagesError;

        return { error: null };
      };
      return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'marcando mensajes como leídos');
        return { error: err };
      });
    };

    export const getUserDetailsForAssistance = async (userId) => {
      const operation = async () => {
        const { data, error } = await supabase.rpc('get_user_assistance_details', {
          p_user_id: userId,
        });
        if (error) throw error;
        return data;
      };
      return NetworkErrorHandler.retryOperation(operation).catch(err => {
        NetworkErrorHandler.handleError(err, 'obtención de detalles de usuario para asistencia');
        throw err;
      });
    };

    export const uploadSupportImage = async (userId, file) => {
        const operation = async () => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from('assistance_uploads')
                .upload(filePath, file);

            if (error) {
                throw new Error(`Error al subir la imagen: ${error.message}`);
            }

            const { data: publicUrlData } = supabase.storage
                .from('assistance_uploads')
                .getPublicUrl(data.path);
            return publicUrlData.publicUrl;
        };
        return NetworkErrorHandler.retryOperation(operation).catch(err => {
            NetworkErrorHandler.handleError(err, 'subida de imagen de soporte');
            throw err;
        });
    };
    
    export const recordSupportUpload = async (threadId, messageId, userId, filePath, publicUrl) => {
        const operation = async () => {
            const { error } = await supabase.from('support_uploads').insert({
                thread_id: threadId,
                message_id: messageId,
                user_id: userId,
                file_path: filePath,
                public_url: publicUrl,
            });
            if (error) throw error;
        };
        return NetworkErrorHandler.retryOperation(operation).catch(err => {
            console.error('Error recording support upload:', err);
        });
    };