
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MapPin, DollarSign, Loader2, CheckCircle, X, Package, Car, Star, Route, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const RIDE_TYPE_DETAILS = {
  now: { label: 'Inmediato', icon: Car, color: 'text-green-500' },
  package: { label: 'Paquetería', icon: Package, color: 'text-orange-500' },
  default: { label: 'Viaje', icon: Car, color: 'text-gray-500' },
};

const RideCarouselCard = ({ ride, onAccept, onReject, isLoading }) => {
  const rideDetails = RIDE_TYPE_DETAILS[ride.ride_type] || RIDE_TYPE_DETAILS.default;
  const hasStops = ride.stops && ride.stops.length > 1;

  const handleImageError = (e) => {
    e.target.onerror = null; 
    e.target.src = '/images/default-avatar.png';
  };

  return (
    <motion.div
      key={ride.id}
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -300, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="absolute w-full h-full"
    >
      <Card className="w-full h-full flex flex-col justify-between bg-gradient-to-br from-gray-50 to-blue-50 shadow-2xl rounded-2xl border-2 border-primary/20">
        <CardHeader className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <rideDetails.icon className={`w-8 h-8 ${rideDetails.color}`} />
              <h3 className="text-2xl font-bold text-slate-800">{rideDetails.label}</h3>
            </div>
            <div className="text-3xl font-extrabold text-primary">
              {formatCurrencyARS(ride.estimated_fare)}
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-inner">
            <Avatar className="w-12 h-12 border-2 border-primary">
              <AvatarImage src={ride.passenger_avatar_url} alt={ride.passenger_name} onError={handleImageError} />
              <AvatarFallback>{ride.passenger_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{ride.passenger_name}</p>
              <div className="flex items-center text-sm text-slate-500">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                {ride.passenger_rating?.toFixed(1) || 'Nuevo'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 flex-grow">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-green-500 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Origen</p>
                <p className="font-medium text-slate-700">{ride.origin_address}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-red-500 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Destino</p>
                <p className="font-medium text-slate-700">{ride.destination_address}</p>
              </div>
            </div>
            {hasStops && (
              <div className="flex items-center space-x-2 pt-2 text-amber-600">
                <Route className="w-5 h-5" />
                <p className="font-semibold text-sm">Este viaje tiene múltiples paradas</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-6 grid grid-cols-2 gap-4">
          <Button onClick={() => onReject(ride.id)} variant="outline" size="lg" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold" disabled={isLoading}>
            <X className="w-5 h-5 mr-2" /> Rechazar
          </Button>
          <Button onClick={() => onAccept(ride)} size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />} Aceptar
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const RideCarousel = ({ rides, onAccept, onReject, isLoading, isOnline }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (rides.length > 0 && currentIndex >= rides.length) {
      setCurrentIndex(0);
    }
  }, [rides, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % rides.length);
  };
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + rides.length) % rides.length);
  };
  
  if (!isOnline) {
    return (
      <Card className="h-full flex flex-col items-center justify-center bg-gray-50 text-center p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-gray-700 mb-2">Estás desconectado</h3>
        <p className="text-gray-500">Conéctate para empezar a recibir ofertas de viajes.</p>
      </Card>
    );
  }

  if (isLoading && rides.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center bg-gray-50 text-center p-6 rounded-2xl">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-bold text-gray-700">Buscando viajes...</h3>
      </Card>
    );
  }
  
  if (rides.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center bg-gray-50 text-center p-6 rounded-2xl">
        <Car className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-700">Todo tranquilo por ahora</h3>
        <p className="text-gray-500">Te avisaremos cuando haya un nuevo viaje disponible.</p>
      </Card>
    );
  }
  
  const currentRide = rides[currentIndex];

  return (
    <div className="relative h-[28rem] md:h-[32rem]">
      <AnimatePresence initial={false}>
        <RideCarouselCard
          key={currentRide.id}
          ride={currentRide}
          onAccept={onAccept}
          onReject={(rideId) => {
            onReject(rideId);
            if(rides.length > 1) handleNext();
          }}
          isLoading={isLoading}
        />
      </AnimatePresence>

      {rides.length > 1 && (
        <>
          <Button variant="ghost" size="icon" onClick={handlePrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white/50 backdrop-blur-sm shadow-md hover:bg-white">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/50 backdrop-blur-sm shadow-md hover:bg-white">
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </Button>
        </>
      )}
    </div>
  );
};

export default RideCarousel;
