import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Car, CheckCircle, Clock, X } from 'lucide-react';

const statusConfig = {
  open: { label: 'Abierto', color: 'bg-green-500 border-green-500', icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: 'Cerrado', color: 'bg-red-500 border-red-500', icon: <X className="w-3 h-3" /> },
  in_review: { label: 'En Revisión', color: 'bg-yellow-500 border-yellow-500', icon: <Clock className="w-3 h-3" /> },
};

const roleConfig = {
  passenger: { label: 'Pasajero', color: 'bg-blue-100 text-blue-800', icon: <User className="w-3 h-3" /> },
  driver: { label: 'Conductor', color: 'bg-purple-100 text-purple-800', icon: <Car className="w-3 h-3" /> },
};

const AssistanceList = ({ threads, selectedThread, onSelectThread }) => {
  if (threads.length === 0) {
    return <div className="p-4 text-center text-slate-500">No se encontraron mensajes.</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {threads.map(thread => (
        <motion.div
          key={thread.id}
          onClick={() => onSelectThread(thread)}
          className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${selectedThread?.id === thread.id ? 'bg-blue-100' : 'hover:bg-slate-50'}`}
          layout
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarImage src={thread.created_by?.avatar_url} alt={thread.created_by?.full_name} />
                <AvatarFallback className="bg-slate-200 text-slate-600">{thread.created_by?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              {thread.admin_has_unread && (
                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white" title="No leído" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-slate-800 truncate">{thread.created_by?.full_name || 'Usuario'}</p>
                <p className="text-xs text-slate-400 flex-shrink-0 ml-2">{formatDistanceToNow(new Date(thread.last_message_at || thread.created_at), { addSuffix: true, locale: es })}</p>
              </div>
              <p className="text-sm text-slate-600 font-medium truncate">{thread.subject}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <Badge variant="outline" className={`${roleConfig[thread.role]?.color} border-0`}>
              {roleConfig[thread.role]?.icon}
              <span className="ml-1.5">{roleConfig[thread.role]?.label}</span>
            </Badge>
            <Badge variant="outline" className={`${statusConfig[thread.status].color} text-white border-0`}>
              {statusConfig[thread.status].icon}
              <span className="ml-1.5">{statusConfig[thread.status].label}</span>
            </Badge>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AssistanceList;