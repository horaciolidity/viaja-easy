import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

const CreateSharedRideForm = ({ open, onOpenChange, onRideCreated, rideToEdit }) => {
  const [originCity, setOriginCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState(1);
  const [seatPrice, setSeatPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (rideToEdit) {
      setOriginCity(rideToEdit.origin_city || '');
      setDestinationCity(rideToEdit.destination_city || '');
      setDepartureTime(new Date(rideToEdit.departure_time).toISOString().slice(0, 16));
      setAvailableSeats(rideToEdit.available_seats);
      setSeatPrice(rideToEdit.seat_price);
      setNotes(rideToEdit.notes || '');
    } else {
      setOriginCity('');
      setDestinationCity('');
      setDepartureTime('');
      setAvailableSeats(1);
      setSeatPrice('');
      setNotes('');
    }
  }, [rideToEdit, open]);

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('shared_rides')
      .update({
        origin_city: originCity,
        destination_city: destinationCity,
        origin_address: originCity,
        destination_address: destinationCity,
        departure_time: departureTime,
        available_seats: parseInt(availableSeats, 10),
        seat_price: parseFloat(seatPrice),
        notes: notes,
      })
      .eq('id', rideToEdit.id);
    
    return { error };
  };

  const handleCreate = async () => {
    const { data, error } = await supabase.rpc('create_shared_ride', {
      p_origin_city: originCity,
      p_destination_city: destinationCity,
      p_departure_time: departureTime,
      p_available_seats: parseInt(availableSeats, 10),
      p_seat_price: parseFloat(seatPrice),
      p_notes: notes,
    });
    return { data, error };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!originCity || !destinationCity || !departureTime || !availableSeats || !seatPrice) {
      toast({ title: 'Error', description: 'Por favor, completa todos los campos requeridos.', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const { data, error } = rideToEdit ? await handleUpdate() : await handleCreate();

    setLoading(false);
    if (error || (data && !data.success)) {
      const message = rideToEdit ? 'Error al actualizar' : 'Error al crear el viaje';
      toast({ title: message, description: error?.message || data?.message, variant: 'destructive' });
    } else {
      const message = rideToEdit ? 'Tu viaje compartido ha sido actualizado.' : 'Tu viaje compartido ha sido publicado.';
      toast({ title: '¡Éxito!', description: message });
      onRideCreated();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{rideToEdit ? 'Editar Viaje Compartido' : 'Publicar un Nuevo Viaje Compartido'}</DialogTitle>
          <DialogDescription>Completa los detalles de tu viaje para que otros puedan unirse.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2"><Label htmlFor="origin">Ciudad de Origen</Label><Input id="origin" value={originCity} onChange={(e) => setOriginCity(e.target.value)} placeholder="Ej: Buenos Aires" /></div>
          <div className="grid gap-2"><Label htmlFor="destination">Ciudad de Destino</Label><Input id="destination" value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} placeholder="Ej: Rosario" /></div>
          <div className="grid gap-2"><Label htmlFor="departureTime">Fecha y Hora de Salida</Label><Input id="departureTime" type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label htmlFor="availableSeats">Asientos Disponibles</Label><Input id="availableSeats" type="number" min="1" max="6" value={availableSeats} onChange={(e) => setAvailableSeats(e.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="seatPrice">Precio por Asiento (ARS)</Label><Input id="seatPrice" type="number" step="0.01" min="0" value={seatPrice} onChange={(e) => setSeatPrice(e.target.value)} /></div>
          </div>
          <div className="grid gap-2"><Label htmlFor="notes">Notas (Opcional)</Label><Textarea id="notes" placeholder="Ej: Solo equipaje de mano." value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </form>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (rideToEdit ? 'Actualizando...' : 'Publicando...') : (rideToEdit ? 'Guardar Cambios' : 'Publicar Viaje')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSharedRideForm;