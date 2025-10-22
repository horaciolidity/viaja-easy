import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';

const CompleteRideModal = ({ isOpen, onOpenChange, onConfirm, isLoading, ride }) => {
  const [totalFare, setTotalFare] = useState(ride?.fare_estimated?.toFixed(2) || '');
  const [driverCash, setDriverCash] = useState('');

  const handleConfirm = () => {
    onConfirm({
      actual_fare: totalFare,
      driver_cash: driverCash,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar Viaje</DialogTitle>
          <DialogDescription>
            Confirma la tarifa final y el efectivo recibido del pasajero.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total-fare" className="text-right">
              Tarifa Total (ARS)
            </Label>
            <Input
              id="total-fare"
              type="number"
              value={totalFare}
              onChange={(e) => setTotalFare(e.target.value)}
              className="col-span-3"
              placeholder="Ej: 1500.50"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driver-cash" className="text-right">
              Efectivo Recibido
            </Label>
            <Input
              id="driver-cash"
              type="number"
              value={driverCash}
              onChange={(e) => setDriverCash(e.target.value)}
              className="col-span-3"
              placeholder="Opcional"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Confirmar y Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteRideModal;