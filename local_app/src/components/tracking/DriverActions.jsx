import React, { useState, useEffect } from 'react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    } from '@/components/ui/dialog';
    import {
      AlertDialog,
      AlertDialogTrigger,
    } from "@/components/ui/alert-dialog";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { motion, AnimatePresence } from 'framer-motion';
    import ActionButton from '@/components/common/ActionButton';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/supabaseClient';
    import { useLocation } from '@/contexts/LocationContext';
    import { Html5QrcodeScanner } from 'html5-qrcode';
    import { KeyRound, QrCode } from 'lucide-react';
    import CancelRideDialog from './CancelRideDialog';

    const QrScanner = ({ onScanSuccess, onScanError }) => {
      useEffect(() => {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
    
        function success(decodedText, decodedResult) {
          scanner.clear().catch(error => {
            console.error("Failed to clear html5-qrcode-scanner.", error);
          });
          onScanSuccess(decodedText, decodedResult);
        }
    
        function error(err) {
        }
    
        scanner.render(success, error);
    
        return () => {
          scanner.clear().catch(error => {
            console.error("Failed to clear html5-qrcode-scanner.", error);
          });
        };
      }, [onScanSuccess, onScanError]);
    
      return <div id="qr-reader" className="w-full"></div>;
    };

    const DriverActions = ({ ride, onStatusUpdate, onCancel, onComplete }) => {
      const [showVerificationModal, setShowVerificationModal] = useState(false);
      const [pin, setPin] = useState('');
      const [isPinLoading, setIsPinLoading] = useState(false);
      const [showCompleteDialog, setShowCompleteDialog] = useState(false);
      const [fare, setFare] = useState('');
      const [canStart, setCanStart] = useState(false);
      const { currentLocation } = useLocation();

      const isScheduledOrHourly = ride.ride_type === 'scheduled' || ride.ride_type === 'hourly';

      useEffect(() => {
        const checkCanStart = async () => {
          if (!isScheduledOrHourly || !currentLocation || ride.status !== 'accepted') {
            setCanStart(!isScheduledOrHourly);
            return;
          }
          
          const { data, error } = await supabase.rpc('can_start_ride', {
            p_ride_id: ride.id,
            p_ride_type: ride.ride_type,
            p_driver_lat: currentLocation.lat,
            p_driver_lng: currentLocation.lng,
          });

          if (error) {
            console.error("Error checking can_start_ride:", error);
            setCanStart(false);
            return;
          }

          setCanStart(data);
        };

        if (isScheduledOrHourly) {
            checkCanStart();
            const interval = setInterval(checkCanStart, 30000); 
            return () => clearInterval(interval);
        } else {
            setCanStart(true);
        }
      }, [ride.id, ride.ride_type, ride.status, isScheduledOrHourly, currentLocation]);


      const handleStartRide = () => {
        if (!canStart && isScheduledOrHourly) {
          toast({
            title: "No se puede iniciar el viaje",
            description: "Podrás iniciar el viaje solo si faltan 30 min o menos y estás a ≤ 50 m del punto de recogida.",
            variant: "destructive",
          });
          return;
        }
        setShowVerificationModal(true);
      };
      
      const handlePinSubmit = async (pinToSubmit) => {
        setIsPinLoading(true);
        try {
          const { success, error } = await onStatusUpdate('in_progress', { pin_code: pinToSubmit });
          if (success) {
            setShowVerificationModal(false);
            setPin('');
          } else {
            toast({ title: 'Error', description: error || 'PIN incorrecto', variant: 'destructive' });
          }
        } finally {
          setIsPinLoading(false);
        }
      };
    
      const handleQrScanSuccess = (decodedText) => {
        try {
            let qrPin;
            if (decodedText.startsWith('{')) { 
                const qrData = JSON.parse(decodedText);
                if (qrData.ride_id === ride.id && qrData.pin) {
                    qrPin = qrData.pin;
                }
            } else { 
                qrPin = decodedText;
            }

            if (qrPin) {
                handlePinSubmit(qrPin);
            } else {
                toast({ title: 'QR Inválido', description: 'Este código QR no corresponde a este viaje.', variant: 'destructive' });
            }
        } catch (e) {
          toast({ title: 'QR Inválido', description: 'No se pudo leer el código QR.', variant: 'destructive' });
        }
      };
      
      const handleCompleteRide = () => {
        if (ride.payment_method === 'cash') {
          setShowCompleteDialog(true);
        } else {
          onComplete({ actual_fare: ride.fare_estimated, driver_cash: 0 });
        }
      };

      const handleCompleteSubmit = () => {
        onComplete({ actual_fare: parseFloat(fare), driver_cash: parseFloat(fare) });
        setShowCompleteDialog(false);
        setFare('');
      };

      const renderActions = () => {
        switch (ride.status) {
          case 'accepted':
          case 'driver_assigned':
          case 'driver_arriving':
            return (
               <>
                <ActionButton onClick={() => onStatusUpdate('driver_arrived')} className="bg-green-500 hover:bg-green-600" icon="Check">Llegué</ActionButton>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <ActionButton className="bg-red-500 hover:bg-red-600" icon="X">Cancelar</ActionButton>
                  </AlertDialogTrigger>
                  <CancelRideDialog onConfirm={onCancel} ride={ride} isLoading={isPinLoading} />
                </AlertDialog>
              </>
            );
          case 'driver_arrived':
            return (
              <>
                <ActionButton onClick={handleStartRide} disabled={isScheduledOrHourly && !canStart} className="bg-green-500 hover:bg-green-600" icon="Shield">
                  Iniciar Viaje
                </ActionButton>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <ActionButton className="bg-red-500 hover:bg-red-600" icon="X">Cancelar</ActionButton>
                  </AlertDialogTrigger>
                  <CancelRideDialog onConfirm={onCancel} ride={ride} isLoading={isPinLoading} />
                </AlertDialog>
              </>
            );
          case 'in_progress':
            return (
              <>
                <ActionButton onClick={handleCompleteRide} className="bg-green-500 hover:bg-green-600" icon="Check">
                  Completar
                </ActionButton>
              </>
            );
          default:
            return null;
        }
      };

      return (
        <>
          <div className="p-4 space-y-4">
            <div className="flex justify-around items-center gap-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={ride.status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex gap-3"
                >
                  {renderActions()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Verificación de Seguridad</DialogTitle>
                <DialogDescription>
                  Pide al pasajero su PIN o escanea su código QR para iniciar el viaje.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="pin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pin"><KeyRound className="w-4 h-4 mr-2"/>Ingresar PIN</TabsTrigger>
                  <TabsTrigger value="qr"><QrCode className="w-4 h-4 mr-2"/>Escanear QR</TabsTrigger>
                </TabsList>
                <TabsContent value="pin">
                  <div className="py-4">
                    <Label htmlFor="pin" className="sr-only">PIN</Label>
                    <Input
                      id="pin"
                      type="tel"
                      maxLength="4"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-2xl tracking-[1rem]"
                      placeholder="----"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowVerificationModal(false)}>Cancelar</Button>
                    <Button onClick={() => handlePinSubmit(pin)} disabled={pin.length !== 4 || isPinLoading}>
                      {isPinLoading ? 'Verificando...' : 'Confirmar e Iniciar'}
                    </Button>
                  </DialogFooter>
                </TabsContent>
                <TabsContent value="qr">
                  <div className="py-4 flex justify-center">
                    <QrScanner onScanSuccess={handleQrScanSuccess} onScanError={(err) => console.warn(err)} />
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Completar Viaje en Efectivo</DialogTitle>
                <DialogDescription>
                  Ingresa el monto final que te pagó el pasajero.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="fare">Monto Recibido (ARS)</Label>
                <Input
                  id="fare"
                  type="number"
                  value={fare}
                  onChange={(e) => setFare(e.target.value)}
                  placeholder="Ej: 1500.00"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Cancelar</Button>
                <Button onClick={handleCompleteSubmit} disabled={!fare || parseFloat(fare) <= 0}>Confirmar Pago</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    };

    export default DriverActions;