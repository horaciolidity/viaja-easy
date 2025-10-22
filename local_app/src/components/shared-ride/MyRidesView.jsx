import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, UserCheck, UserX, Users, Clock, MapPin, Loader2, Star, PlayCircle, Car } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ReservationItem = ({ reservation, onManageReservation, isManaging }) => {
  const passengerName = reservation.passenger?.full_name || 'Pasajero';
  const passengerRating = reservation.passenger?.rating?.toFixed(1) || 'Nuevo';

  return (
    <li className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={reservation.passenger?.avatar_url} alt={passengerName} />
          <AvatarFallback>{passengerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <span className="font-semibold block text-slate-800">{passengerName}</span>
          <div className="flex items-center text-xs text-slate-500">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
            <span>{passengerRating}</span>
            <span className="mx-1.5">·</span>
            <Badge variant="outline" className="text-xs">{reservation.seats_reserved} asiento(s)</Badge>
          </div>
        </div>
      </div>
      {reservation.status === 'pending' && (
        <div className="flex gap-2">
          {isManaging === reservation.id ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          ) : (
            <>
              <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => onManageReservation(reservation.id, 'reject')}>
                <UserX className="w-4 h-4 mr-1.5" /> Rechazar
              </Button>
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => onManageReservation(reservation.id, 'confirm')}>
                <UserCheck className="w-4 h-4 mr-1.5" /> Confirmar
              </Button>
            </>
          )}
        </div>
      )}
      {reservation.status === 'confirmed' && <Badge variant="success" className="py-1 px-3">Confirmado</Badge>}
      {reservation.status === 'cancelled' && <Badge variant="destructive" className="py-1 px-3">Cancelado</Badge>}
    </li>
  );
};

const RideCard = ({ ride, onEdit, onDelete, onManageReservation, onStartPickup, isManaging }) => {
  const confirmedSeats = ride.reservations.filter(r => r.status === 'confirmed').reduce((acc, r) => acc + r.seats_reserved, 0);
  const canStartPickup = ride.status === 'scheduled' && confirmedSeats > 0;
  
  const statusConfig = {
    scheduled: { text: 'Programado', color: 'bg-blue-500' },
    collecting_passengers: { text: 'Buscando Pasajeros', color: 'bg-yellow-500' },
    in_progress: { text: 'En Curso', color: 'bg-purple-500' },
    completed: { text: 'Completado', color: 'bg-green-500' },
    cancelled: { text: 'Cancelado', color: 'bg-red-500' }
  };
  const currentStatus = statusConfig[ride.status] || { text: ride.status, color: 'bg-gray-500' };

  return (
    <Card key={ride.id} className="overflow-hidden shadow-lg flex flex-col" id="driver-ride-card">
      <CardHeader className="p-4 bg-gray-50 border-b">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> {ride.origin_city} a {ride.destination_city}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-1">
              {new Date(ride.departure_time).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })}
            </CardDescription>
          </div>
          <Badge className={`${currentStatus.color} text-white`}>{currentStatus.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between text-sm mb-4">
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-500" /> <span>{confirmedSeats} / {ride.available_seats} asientos</span></div>
          <div className="flex items-center gap-2 font-semibold">{formatCurrencyARS(ride.seat_price)} / asiento</div>
        </div>

        <div id="reservations-list">
          <h4 className="font-semibold text-sm mb-2">Reservas</h4>
          {ride.reservations.length > 0 ? (
            <ul className="space-y-2">
              {ride.reservations.map(res => (
                <ReservationItem key={res.id} reservation={res} onManageReservation={onManageReservation} isManaging={isManaging} />
              ))}
            </ul>
          ) : <p className="text-xs text-gray-500 text-center py-4">Aún no hay reservas.</p>}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 p-2 flex justify-between gap-2 border-t">
        {canStartPickup && (
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => onStartPickup(ride.id)} disabled={isManaging === ride.id}>
            {isManaging === ride.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Car className="w-4 h-4 mr-2" />}
            Iniciar Recorrido
          </Button>
        )}
        <div className="flex justify-end gap-2 flex-grow">
          <Button variant="outline" size="sm" onClick={() => onEdit(ride)}><Edit className="w-4 h-4 mr-1" /> Editar</Button>
          {ride.status !== 'cancelled' && 
            <Button variant="destructive" size="sm" onClick={() => onDelete(ride.id)}><Trash2 className="w-4 h-4 mr-1" /> Cancelar Viaje</Button>
          }
        </div>
      </CardFooter>
    </Card>
  );
};

const MyRidesView = ({ rides, onEdit, onDelete, onManageReservation, onStartPickup, isManaging }) => {
  if (rides.length === 0) {
    return <p className="text-center text-gray-500 mt-8 py-6 bg-white rounded-xl shadow">No has publicado ningún viaje compartido.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
      {rides.map(ride => (
        <RideCard 
          key={ride.id} 
          ride={ride} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          onManageReservation={onManageReservation}
          onStartPickup={onStartPickup}
          isManaging={isManaging}
        />
      ))}
    </div>
  );
};

export default MyRidesView;