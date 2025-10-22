import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare, Star, MapPin, Flag, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TripInfoPanel = ({ ride, user, profile, onAction, onCancel, isLoading }) => {
  const navigate = useNavigate();

  if (!ride) return null;

  const passenger = ride.passenger;
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'P';

  const handleAction = (status) => {
    if (status === 'in_progress') {
      // For starting the ride, we might need a PIN
      // This logic can be expanded in a modal
      onAction('in_progress');
    } else {
      onAction(status);
    }
  };
  
  const handleViewTrip = () => {
    navigate(`/tracking/${ride.id}`);
  };

  const renderActionButtons = () => {
    switch (ride.status) {
      case 'accepted':
      case 'driver_arriving':
        return (
          <Button onClick={() => handleAction('driver_arrived')} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Check className="mr-2 h-4 w-4" /> He llegado
          </Button>
        );
      case 'driver_arrived':
        return (
          <Button onClick={() => handleAction('in_progress')} className="w-full bg-green-600 hover:bg-green-700 text-white">
            <Check className="mr-2 h-4 w-4" /> Iniciar Viaje
          </Button>
        );
      case 'in_progress':
        return (
          <Button onClick={() => handleAction('completed')} className="w-full bg-red-600 hover:bg-red-700 text-white">
            <Flag className="mr-2 h-4 w-4" /> Finalizar Viaje
          </Button>
        );
      default:
        return null;
    }
  };

  const statusText = {
    accepted: 'Dirigiéndose al pasajero',
    driver_arriving: 'Cerca del pasajero',
    driver_arrived: 'Esperando al pasajero',
    in_progress: 'Viaje en curso',
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-auto md:right-4 md:w-96 z-50"
    >
      <Card className="rounded-t-2xl md:rounded-2xl shadow-2xl border-t-4 border-primary overflow-hidden">
        <CardHeader className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarImage src={passenger?.avatar_url} alt={passenger?.full_name} />
                <AvatarFallback>{getInitials(passenger?.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-lg">{passenger?.full_name || 'Pasajero'}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span>{passenger?.rating?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => navigate(`/chat/${ride.id}`)}>
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="outline" asChild>
                <a href={`tel:${passenger?.phone}`}>
                  <Phone className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-1 text-green-500" />
              <div>
                <p className="text-xs font-semibold text-gray-500">RECOGER EN</p>
                <p className="font-medium">{ride.origin_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Flag className="h-5 w-5 mt-1 text-red-500" />
              <div>
                <p className="text-xs font-semibold text-gray-500">DESTINO</p>
                <p className="font-medium">{ride.destination_address}</p>
              </div>
            </div>
          </div>
           <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{statusText[ride.status] || 'Viaje Activo'}</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 grid grid-cols-2 gap-3">
          {renderActionButtons()}
          <Button onClick={handleViewTrip} variant="secondary" className="w-full">
            Ver Viaje
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default TripInfoPanel;