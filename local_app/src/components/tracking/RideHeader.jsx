import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

const RideHeader = ({ rideId, status, otherUserName, onBack, onShowChat }) => {
  const { getUnreadCount } = useChat();
  const unreadCount = getUnreadCount(rideId);
  
  const getStatusColor = (s) => {
    switch (s) {
      case 'driver_assigned': return 'text-blue-600';
      case 'driver_arriving': return 'text-orange-600';
      case 'driver_arrived': return 'text-yellow-600';
      case 'in_progress': return 'text-green-600';
      case 'completed': return 'text-purple-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (s) => {
    switch (s) {
      case 'searching': return 'Buscando conductor';
      case 'driver_assigned': return 'Conductor asignado';
      case 'driver_arriving': return 'Conductor en camino';
      case 'driver_arrived': return 'Conductor ha llegado';
      case 'in_progress': return 'Viaje en curso';
      case 'completed': return 'Viaje completado';
      case 'cancelled': return 'Viaje cancelado';
      default: return 'Estado desconocido';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 shadow-sm p-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="w-10 h-10 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <h1 className="font-semibold text-gray-900 dark:text-slate-100">Viaje #{rideId.slice(-6)}</h1>
          <p className={`text-sm font-medium ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowChat}
            className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 relative"
            aria-label={`Chatear con ${otherUserName}`}
          >
            <MessageCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RideHeader;