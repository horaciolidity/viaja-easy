import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  Car,
  User,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { user, isPassenger, isDriver } = useAuth();
  const { rideHistory, rateRide, loading } = useRide();

  const [selectedRide, setSelectedRide] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState([5]);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState('all');

  // 🧠 Filtrar viajes memorizado
  const filteredHistory = useMemo(() => {
    if (!rideHistory) return [];
    if (filter === 'all') return rideHistory;
    return rideHistory.filter((ride) => ride.status === filter);
  }, [rideHistory, filter]);

  const openRatingModal = (ride) => {
    setSelectedRide(ride);
    setRating([ride.rating || 5]);
    setComment(ride.comment || '');
    setShowRatingModal(true);
  };

  const handleRateRide = async () => {
    if (!selectedRide) return;
    try {
      await rateRide(selectedRide.id, rating[0], comment);
      setShowRatingModal(false);
    } catch {
      // El toast de error lo maneja el servicio
    }
  };

  const RideCard = ({ ride }) => (
    <motion.div
      className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 dark:bg-slate-800 dark:border-slate-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-gray-500 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(ride.date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {new Date(ride.date).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p
            className={`text-sm font-semibold mt-1 ${
              ride.status === 'completed'
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {ride.status === 'completed' ? 'Completado' : 'Cancelado'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${ride.price.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">{ride.distance} km</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm">
          <MapPin className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 truncate" title={ride.origin}>
            {ride.origin}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <MapPin className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 truncate" title={ride.destination}>
            {ride.destination}
          </span>
        </div>
      </div>

      <div className="border-t pt-3 mt-3 flex justify-between items-center dark:border-slate-700">
        <div className="flex items-center">
          {isPassenger && ride.driver ? (
            <>
              <Car className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {ride.driver.full_name}
              </span>
            </>
          ) : (
            isDriver &&
            ride.passenger && (
              <>
                <User className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {ride.passenger.full_name}
                </span>
              </>
            )
          )}
        </div>

        {ride.status === 'completed' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openRatingModal(ride)}
            className="text-xs"
          >
            {ride.rating
              ? `Calificado: ${ride.rating}`
              : 'Calificar'}{' '}
            <Star className="w-3 h-3 ml-1 fill-yellow-400 text-yellow-400" />
          </Button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-4 rounded-full bg-white shadow-md dark:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Historial de Viajes
          </h1>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex space-x-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm">
          {['all', 'completed', 'cancelled'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'ghost'}
              onClick={() => setFilter(f)}
              className={`flex-1 rounded-lg ${
                filter === f
                  ? 'gradient-primary text-white'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {f === 'all'
                ? 'Todos'
                : f === 'completed'
                ? 'Completados'
                : 'Cancelados'}
            </Button>
          ))}
        </div>

        {/* Listado */}
        {filteredHistory.length > 0 ? (
          <div className="space-y-4">
            {filteredHistory.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay viajes en esta categoría.</p>
          </div>
        )}
      </motion.div>

      {/* Modal Calificación */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Calificar Viaje</DialogTitle>
            <DialogDescription>
              Tu opinión nos ayuda a mejorar. Calificá tu experiencia con{' '}
              {selectedRide?.driver?.full_name || selectedRide?.passenger?.full_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rating" className="text-right col-span-1">
                Calificación
              </Label>
              <div className="col-span-3 flex items-center">
                <Slider
                  id="rating"
                  min={1}
                  max={5}
                  step={1}
                  value={rating}
                  onValueChange={setRating}
                  className="w-[calc(100%-3rem)]"
                />
                <span className="ml-4 w-8 text-center font-bold text-lg text-yellow-500">
                  {rating[0]}{' '}
                  <Star className="w-4 h-4 inline-block fill-current" />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comment" className="text-right col-span-1">
                Comentario
              </Label>
              <Input
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Opcional: Dejá un comentario..."
                className="col-span-3 h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRatingModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRateRide} disabled={loading} className="gradient-success text-white">
              {loading ? 'Enviando...' : 'Enviar Calificación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryPage;
