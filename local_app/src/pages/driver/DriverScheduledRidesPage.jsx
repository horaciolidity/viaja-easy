
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScheduledRide } from '@/contexts/ScheduledRideContext';
import { useRide } from '@/contexts/RideContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar, CheckCircle, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { useAuth } from '@/contexts/AuthContext';

const DriverScheduledRidesPage = () => {
    const { 
        scheduledRides, 
        availableScheduledRides, 
        loading, 
        fetchDriverScheduledRides 
    } = useScheduledRide();
    const { acceptRide, loading: rideContextLoading } = useRide();
    const { profile } = useAuth();
    const [isClaiming, setIsClaiming] = React.useState(null);

    useEffect(() => {
        if (profile?.user_type === 'driver') {
            fetchDriverScheduledRides();
        }
    }, [fetchDriverScheduledRides, profile]);

    const handleClaim = async (ride) => {
        setIsClaiming(ride.id);
        const rideToAccept = { ...ride, ride_type: 'scheduled' };
        await acceptRide(rideToAccept);
        setIsClaiming(null);
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'scheduled': return 'default';
            case 'accepted': return 'secondary';
            case 'completed': return 'outline';
            case 'cancelled': return 'destructive';
            default: return 'default';
        }
    };

    const RideCard = ({ ride, isAvailable = false }) => (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardHeader className="flex flex-row items-start justify-between bg-slate-50 p-4 border-b">
                    <div>
                        <CardTitle className="text-lg text-slate-800">
                            Viaje a {ride.destination_address.split(',')[0]}
                        </CardTitle>
                        <CardDescription className="flex items-center text-sm pt-1 text-slate-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {format(new Date(ride.scheduled_pickup_time), "eeee, d 'de' MMMM, HH:mm'hs'", { locale: es })}
                        </CardDescription>
                    </div>
                    {!isAvailable && (
                        <Badge variant={getStatusVariant(ride.status)} className="capitalize">
                            {ride.status}
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-start text-slate-700">
                        <MapPin className="w-5 h-5 mr-3 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold">Desde</p>
                            <p className="text-sm text-slate-600">{ride.origin_address}</p>
                        </div>
                    </div>
                    <div className="border-t pt-3 mt-3">
                       <div className="flex justify-between items-center">
                           <div>
                               <p className="text-xs text-slate-500">Ganancia estimada</p>
                               <p className="text-lg font-bold text-green-600">{formatCurrencyARS(ride.fare_estimated * 0.8)}</p>
                           </div>
                           {isAvailable && (
                               <Button onClick={() => handleClaim(ride)} disabled={isClaiming === ride.id || rideContextLoading}>
                                   {isClaiming === ride.id ? (
                                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                   ) : (
                                       <CheckCircle className="w-4 h-4 mr-2" />
                                   )}
                                   Aceptar
                               </Button>
                           )}
                       </div>
                   </div>
                </CardContent>
            </Card>
        </motion.div>
    );

    const renderRideList = (list, isAvailable) => {
        if (list.length === 0) {
            return (
                <div className="text-center h-64 flex flex-col justify-center items-center bg-slate-100 rounded-lg mt-6">
                    <Calendar className="w-12 h-12 text-slate-400 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700">
                        {isAvailable ? 'No hay viajes disponibles' : 'No tienes viajes programados'}
                    </h2>
                    <p className="text-slate-500 mt-1">
                        {isAvailable ? 'Vuelve a consultar más tarde.' : 'Cuando aceptes uno, aparecerá aquí.'}
                    </p>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {list.map(ride => (
                    <RideCard key={ride.id} ride={ride} isAvailable={isAvailable} />
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 bg-slate-50 min-h-screen">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <h1 className="text-3xl font-bold text-slate-800">Viajes Programados</h1>
                <p className="text-slate-500 mt-1">Gestiona tus viajes aceptados y encuentra nuevas oportunidades.</p>
            </motion.div>

            <Tabs defaultValue="available" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="available">
                        Disponibles
                        <Badge variant="secondary" className="ml-2">{availableScheduledRides.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="my-rides">
                        Mis Viajes
                        <Badge variant="secondary" className="ml-2">{scheduledRides.length}</Badge>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="available">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : renderRideList(availableScheduledRides, true)}
                </TabsContent>
                <TabsContent value="my-rides">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : renderRideList(scheduledRides, false)}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DriverScheduledRidesPage;
