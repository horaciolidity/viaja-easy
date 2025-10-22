import React, { useState, useEffect } from 'react';
    import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
    import { Label } from '@/components/ui/label';
    import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
    import { useSettings } from '@/contexts/SettingsContext';
    import { formatCurrencyARS } from '@/utils/mercadoPago.js';
    import { useAuth } from '@/contexts/AuthContext';
    import { Loader2 } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';
    import { useRide } from '@/contexts/RideContext';

    const PASSENGER_CANCELLATION_REASONS = [
        { id: 'change_of_plans', label: 'Cambié de planes' },
        { id: 'driver_issue', label: 'Problema con el conductor' },
        { id: 'long_wait', label: 'El conductor tarda mucho' },
        { id: 'wrong_location', label: 'Me equivoqué de ubicación' },
        { id: 'other', label: 'Otro motivo' },
    ];

    const DRIVER_CANCELLATION_REASONS = [
        { id: 'passenger_no_show', label: 'El pasajero no aparece' },
        { id: 'passenger_issue', label: 'Problema con el pasajero' },
        { id: 'vehicle_issue', label: 'Problema con mi vehículo' },
        { id: 'wrong_pickup', label: 'Ubicación de recogida incorrecta' },
        { id: 'other', label: 'Otro motivo' },
    ];

    const CancelRideDialog = ({ onConfirm, ride }) => {
        const [reason, setReason] = useState('');
        const { settings } = useSettings();
        const { profile } = useAuth();
        const { cancelRide, loading } = useRide();
        const { toast } = useToast();
        const [penalty, setPenalty] = useState(0);
        const [penaltyMessage, setPenaltyMessage] = useState("Esta acción no se puede deshacer.");
        
        const isDriver = profile?.user_type === 'driver';
        const CANCELLATION_REASONS = isDriver ? DRIVER_CANCELLATION_REASONS : PASSENGER_CANCELLATION_REASONS;

        const handleConfirm = async () => {
            if(!reason) {
                toast({ title: 'Motivo requerido', description: 'Por favor, selecciona un motivo para cancelar.', variant: 'destructive'});
                return;
            }
            try {
                await onConfirm(reason);
            } catch (error) {
                 toast({ title: 'Error al cancelar', description: error.message || 'No se pudo cancelar el viaje.', variant: 'destructive'});
            }
        }


        useEffect(() => {
            if (!ride || !settings.appSettings) return;

            const opsSettings = settings.appSettings;
            let calculatedPenalty = 0;
            let message = "Esta acción no se puede deshacer.";

            if (!isDriver) { 
                const passengerCancellationFee = parseFloat(opsSettings.passenger_cancellation_fee || 0);
                message = ride.prepaid_amount > 0 ? "Se reembolsará el monto prepagado a tu billetera." : "Confirmas la cancelación del viaje.";

                if (ride.status === 'driver_arrived' && ride.arrived_at) {
                    const gracePeriodMinutes = parseFloat(opsSettings.grace_period_minutes || 2);
                    const waitFeePerMinute = parseFloat(opsSettings.wait_fee_per_minute || 50);
                    const waitingSeconds = (new Date().getTime() - new Date(ride.arrived_at).getTime()) / 1000;
                    
                    if (waitingSeconds > gracePeriodMinutes * 60) {
                        const penaltyMinutes = (waitingSeconds / 60) - gracePeriodMinutes;
                        const waitFee = penaltyMinutes * waitFeePerMinute;
                        calculatedPenalty = Math.max(passengerCancellationFee, waitFee);
                        if (calculatedPenalty > 0 && ride.prepaid_amount > 0) {
                            message = `Se aplicará un cargo por cancelación y tiempo de espera de aproximadamente ${formatCurrencyARS(calculatedPenalty)}. El resto será reembolsado.`;
                        }
                    } else {
                        calculatedPenalty = passengerCancellationFee;
                        if (calculatedPenalty > 0 && ride.prepaid_amount > 0) {
                            message = `Se aplicará un cargo por cancelación de ${formatCurrencyARS(calculatedPenalty)}. El resto será reembolsado.`;
                        }
                    }
                } else if (['driver_assigned', 'accepted', 'driver_arriving'].includes(ride.status)) {
                    calculatedPenalty = passengerCancellationFee;
                    if (calculatedPenalty > 0 && ride.prepaid_amount > 0) {
                        message = `Se aplicará un cargo por cancelación de ${formatCurrencyARS(calculatedPenalty)}. El resto será reembolsado.`;
                    }
                }
            } else { 
                const driverCancellationFee = parseFloat(opsSettings.driver_cancellation_fee || 0);
                if (['driver_assigned', 'accepted', 'driver_arriving', 'driver_arrived'].includes(ride.status)) {
                    calculatedPenalty = driverCancellationFee;
                    if (calculatedPenalty > 0) {
                        message = `Cancelar este viaje podría afectar tu tasa de cancelación y podría aplicarse una penalización.`;
                    } else {
                        message = 'Cancelar este viaje afectará tu tasa de cancelación.';
                    }
                }
            }
            
            setPenalty(calculatedPenalty);
            setPenaltyMessage(message);

        }, [ride, settings, profile, isDriver]);

        return (
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de cancelar el viaje?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <span className={penalty > 0 ? "text-orange-500 font-bold" : ""}>
                            {penaltyMessage}
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    <Label htmlFor="cancel-reason" className="font-semibold mb-3 block">Motivo de la cancelación</Label>
                    <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                        {CANCELLATION_REASONS.map((option) => (
                             <div key={option.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.label} id={option.id} />
                                <Label htmlFor={option.id} className="font-normal">{option.label}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700" disabled={loading || !reason}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sí, cancelar viaje
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        );
    };

    export default CancelRideDialog;