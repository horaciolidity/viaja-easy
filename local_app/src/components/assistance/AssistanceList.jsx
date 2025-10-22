import React from 'react';
    import { motion } from 'framer-motion';
    import { Badge } from '@/components/ui/badge';
    import { MessageSquare } from 'lucide-react';
    import { formatDistanceToNow } from 'date-fns';
    import { es } from 'date-fns/locale';
    import { Skeleton } from '@/components/ui/skeleton';

    const statusConfig = {
      open: { label: 'Abierto', color: 'bg-green-500' },
      closed: { label: 'Cerrado', color: 'bg-red-500' },
      in_review: { label: 'En Revisión', color: 'bg-yellow-500' },
    };

    const AssistanceList = ({ threads, onSelectThread, loading, error }) => {
      if (loading) {
        return (
          <div className="space-y-4 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border p-4 rounded-lg"><Skeleton className="h-10 w-full" /></div>
            ))}
          </div>
        );
      }

      if (error) {
        return <p className="text-red-500 text-center py-12">{error}</p>;
      }

      return (
        <div className="space-y-4 p-4">
          {threads.length > 0 ? (
            threads.map(thread => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => onSelectThread(thread)}
                className="border p-4 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-slate-800">{thread.subject}</p>
                  <Badge className={`${statusConfig[thread.status].color} text-white`}>{statusConfig[thread.status].label}</Badge>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-slate-500">
                    Última act.: {formatDistanceToNow(new Date(thread.last_message_at || thread.created_at), { addSuffix: true, locale: es })}
                  </p>
                  {thread.user_has_unread && <span className="h-3 w-3 rounded-full bg-blue-500" title="Nuevo mensaje"></span>}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              <p>No tienes solicitudes de asistencia.</p>
              <p>Crea una si necesitas ayuda.</p>
            </div>
          )}
        </div>
      );
    };

    export default AssistanceList;