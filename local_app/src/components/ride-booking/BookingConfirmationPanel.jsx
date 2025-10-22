import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Car, Bike, Users, Wallet, CreditCard, Loader2, ChevronUp, Timer, Route as RouteIcon, DollarSign } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { formatDuration, formatDistance } from '@/utils/geolocation';
import { usePayment } from '@/contexts/PaymentContext';
import { supabase } from '@/lib/supabaseClient';

const vehicleIcons = {
    'Auto': <Car className="w-8 h-8 text-slate-800 dark:text-slate-100" />,
    'Moto': <Bike className="w-8 h-8 text-slate-800 dark:text-slate-100" />,
};

const FemaleDriverPreference = ({ preference, setPreference, onInsufficient, available }) => {
  const handleToggle = (checked) => {
    if (checked && !available) {
      onInsufficient();
    } else {
      setPreference(checked ? 'female' : 'any');
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <Label htmlFor="female-driver" className="flex flex-col">
        <span className="font-medium text-slate-700 dark:text-slate-200">¿Preferís una conductora mujer?</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">Sujeto a disponibilidad.</span>
      </Label>
      <Switch
        id="female-driver"
        checked={preference === 'female'}
        onCheckedChange={handleToggle}
        disabled={!available}
      />
    </div>
  );
};

const BookingConfirmationPanel = ({
    route,
    onConfirm,
    isLoading,
    vehicleTypes,
    selectedVehicleTypeId,
    setSelectedVehicleTypeId,
    selectedVehicleType,
    numPassengers,
    setNumPassengers,
    driverGenderPreference,
    setDriverGenderPreference,
    stopsCount,
}) => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { defaultPaymentMethod } = usePayment();
    const controls = useAnimation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [femaleDriversAvailable] = useState(true);
    const [fares, setFares] = useState({});

    useEffect(() => {
        controls.start({ y: 0, transition: { type: 'spring', damping: 40, stiffness: 300 } });
    }, [controls]);

    const calculateAllFares = async () => {
        if (!route) return;
        const newFares = {};
        for (const vt of vehicleTypes) {
            const { data, error } = await supabase.rpc('calculate_fare_with_stops', {
                p_vehicle_type_id: vt.id,
                p_distance_km: route.distance,
                p_duration_min: route.duration,
                p_stops_count: stopsCount
            });
            if (!error) {
                newFares[vt.id] = data;
            }
        }
        setFares(newFares);
    };

    useEffect(() => {
        calculateAllFares();
    }, [route, vehicleTypes, stopsCount]);

    const handleDragEnd = (event, info) => {
        const shouldExpand = info.velocity.y < -200 || (info.point.y < window.innerHeight * 0.8 && !isExpanded);
        const shouldCollapse = info.velocity.y > 200 || (info.point.y > window.innerHeight * 0.8 && isExpanded);
        if (shouldExpand) {
            controls.start({ y: -220 });
            setIsExpanded(true);
        } else if (shouldCollapse) {
            controls.start({ y: 0 });
            setIsExpanded(false);
        }
    };

    const toggleExpansion = () => {
        if (isExpanded) {
            controls.start({ y: 0 });
        } else {
            controls.start({ y: -220 });
        }
        setIsExpanded(!isExpanded);
    };
    
    const handleInsufficientFemaleDrivers = () => {
        toast({
          title: "Conductoras no disponibles",
          description: "Actualmente no hay conductoras disponibles. Podés esperar o continuar sin preferencia de género.",
          action: (
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.dismiss()}>Esperar</Button>
                <Button size="sm" onClick={() => { setDriverGenderPreference('any'); toast.dismiss(); }}>Continuar</Button>
            </div>
          ),
        });
    };
    
    const isFemalePassengerVerified = profile?.gender === 'female' && profile?.verified === true;

    const currentFare = fares[selectedVehicleTypeId] || 0;

    const getPaymentIcon = () => {
        if (!defaultPaymentMethod) return <CreditCard className="w-6 h-6 text-slate-500 mr-3" />;
        switch(defaultPaymentMethod.id) {
            case 'cash': return <DollarSign className="w-6 h-6 text-green-500 mr-3" />;
            case 'wallet': return <Wallet className="w-6 h-6 text-blue-500 mr-3" />;
            case 'mercadopago': return <img src="https://img.icons8.com/color/48/mercado-pago.png" alt="MercadoPago" className="w-6 h-6 mr-3" />;
            default: return <CreditCard className="w-6 h-6 text-slate-500 mr-3" />;
        }
    }

    return (
        <motion.div
            drag="y"
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={controls}
            dragConstraints={{ top: -220, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 1 }}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-700 z-40"
        >
            <div className="w-full cursor-grab active:cursor-grabbing" onClick={toggleExpansion}>
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto my-4" />
            </div>

            <div className="p-6 pt-0 pb-safe-bottom">
                <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={toggleExpansion} >
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Confirma tu viaje</h2>
                    <ChevronUp className={`w-6 h-6 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
                
                 <div className="flex justify-around items-center text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl mb-4">
                    <div className="flex flex-col items-center gap-1">
                        <Timer className="w-4 h-4 text-purple-500" />
                        <span className="font-bold">{formatDuration(route.duration * 60)}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <RouteIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">{formatDistance(route.distance)}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex justify-around bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                        {vehicleTypes.map((vt) => {
                            const typeFare = fares[vt.id] || 0;
                            return (
                                <button
                                    key={vt.id}
                                    onClick={() => setSelectedVehicleTypeId(vt.id)}
                                    className={`flex-1 p-3 rounded-lg text-center transition-all duration-200 ${selectedVehicleTypeId === vt.id ? 'bg-white dark:bg-slate-900 shadow-md' : 'bg-transparent'}`}
                                >
                                    <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full ${selectedVehicleTypeId === vt.id ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}>
                                      {vehicleIcons[vt.name] || <Car className="w-8 h-8 text-slate-800 dark:text-slate-200"/>}
                                    </div>
                                    <p className="font-semibold text-sm mt-2 text-slate-800 dark:text-slate-200">{vt.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrencyARS(typeFare)}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <motion.div
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    className="overflow-hidden"
                >
                    <div className="py-4 space-y-4">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="passengers" className="text-slate-600 dark:text-slate-300 flex items-center"><Users className="mr-2 w-5 h-5"/>Pasajeros</Label>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{numPassengers[0]}</span>
                        </div>
                        <Slider
                            id="passengers"
                            min={1}
                            max={selectedVehicleType?.capacity || 4}
                            step={1}
                            value={numPassengers}
                            onValueChange={setNumPassengers}
                        />
                        {isFemalePassengerVerified && (
                          <FemaleDriverPreference 
                              preference={driverGenderPreference}
                              setPreference={setDriverGenderPreference}
                              available={femaleDriversAvailable}
                              onInsufficient={handleInsufficientFemaleDrivers}
                          />
                        )}
                    </div>
                </motion.div>

                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl mb-4">
                    <div className="flex items-center">
                        {getPaymentIcon()}
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{defaultPaymentMethod?.name || 'Seleccionar método'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {defaultPaymentMethod?.id === 'wallet' 
                                    ? `Saldo: ${formatCurrencyARS(defaultPaymentMethod.balance)}` 
                                    : 'Método de pago predeterminado'}
                            </p>
                        </div>
                    </div>
                    <Button variant="link" size="sm" onClick={() => navigate('/passenger/payment-methods')}>Cambiar</Button>
                </div>
                
                <Button
                    onClick={() => onConfirm(currentFare)}
                    disabled={isLoading}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-shadow"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : null}
                    Confirmar {selectedVehicleType?.name || 'Viaje'} por {formatCurrencyARS(currentFare)}
                </Button>
            </div>
        </motion.div>
    );
};

export default BookingConfirmationPanel;