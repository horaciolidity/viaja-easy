
import React, { useState, useEffect, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { useHourlyRide } from '@/contexts/HourlyRideContext';
    import { useRide } from '@/contexts/RideContext';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Loader2, Clock, Calendar, FileText, CheckCircle, MapPin, Play, Square, HelpCircle } from 'lucide-react';
    import { format, differenceInMinutes, parseISO } from 'date-fns';
    import { es } from 'date-fns/locale';
    import { formatCurrencyARS } from '@/utils/mercadoPago';
    import { useAuth } from '@/contexts/AuthContext';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogTrigger,
    } from "@/components/ui/dialog"

    const DriverHourlyRidesPage = () => {
        const { 
            driverBookings, 
            availableBookings, 
            loadingDriverBookings, 
            fetchDriverHourlyBookings,
            startHourlyRide,
            completeHourlyRide,
            settings
        } = useHourlyRide();
        const { acceptRide, loading: rideContextLoading } = useRide();
        const { profile } = useAuth();
        
        const [isClaiming, setIsClaiming] = useState(null);
        const [currentTime, setCurrentTime] = useState(new Date());

        useEffect(() => {
            if (profile?.user_type === 'driver') {
                fetchDriverHourlyBookings();
            }
        }, [fetchDriverHourlyBookings, profile]);

        useEffect(() => {
            const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
            return () => clearInterval(timer);
        }, []);

        const handleClaim = async (booking) => {
            setIsClaiming(booking.id);
            const rideToAccept = { ...booking, ride_type: 'hourly' };
            await acceptRide(rideToAccept);
            setIsClaiming(null);
        };

        const getStatusVariant = (status) => {
            switch (status) {
                case 'pending': return 'default';
                case 'accepted': return 'secondary';
                case 'in_progress': return 'outline';
                case 'completed': return 'outline';
                case 'cancelled': return 'destructive';
                default: return 'default';
            }
        };

        const getStatusText = (status) => {
            const statusMap = {
                pending: 'Pendiente',
                accepted: 'Aceptado',
                in_progress: 'En Curso',
                completed: 'Finalizado',
                cancelled: 'Cancelado',
            };
            return statusMap[status] || status;
        };
        
        const HelpDialog = () => (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-slate-500 hover:bg-slate-200">
                <HelpCircle className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ayuda para Reservas por Hora</DialogTitle>
                <DialogDescription>
                  Aquí te explicamos cómo funcionan las reservas por hora.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div>
                  <h4 className="font-semibold">1. Aceptar un Viaje</h4>
                  <p>En la pestaña "Disponibles", verás todas las solicitudes pendientes. Revisa los detalles y presiona "Aceptar" para asignarte el viaje.</p>
                </div>
                <div>
                  <h4 className="font-semibold">2. Iniciar el Viaje</h4>
                  <p>Una vez aceptado, el viaje aparecerá en "Mis Reservas". Podrás iniciar el viaje cuando falten <span className="font-bold">{settings?.start_ride_minutes_before || 30} minutos</span> o menos para la hora de inicio programada. El botón "Iniciar Viaje" se habilitará automáticamente.</p>
                </div>
                <div>
                  <h4 className="font-semibold">3. Finalizar y Cobrar</h4>
                  <p>Cuando el servicio termine, presiona "Finalizar Viaje". Esto marcará la reserva como completada y el pago se procesará y se añadirá automáticamente a tu billetera en la app.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );

        const BookingCard = ({ booking, isAvailable = false }) => {
            const canStartRide = useMemo(() => {
                if (booking.status !== 'accepted' || !settings || !booking.start_datetime) return false;
                const rideStartTime = parseISO(booking.start_datetime);
                const minutesToStart = differenceInMinutes(rideStartTime, currentTime);
                return minutesToStart <= settings.start_ride_minutes_before;
            }, [booking, currentTime, settings]);

            return (
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
                                    Reserva por {booking.booked_hours}hs
                                </CardTitle>
                                <CardDescription className="flex items-center text-sm pt-1 text-slate-600">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {booking.start_datetime ? format(new Date(booking.start_datetime), "eeee, d 'de' MMMM", { locale: es }) : 'Fecha no disponible'}
                                </CardDescription>
                            </div>
                            {!isAvailable && (
                                <Badge variant={getStatusVariant(booking.status)} className="capitalize">
                                    {getStatusText(booking.status)}
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center text-slate-700">
                                <Clock className="w-5 h-5 mr-3 text-primary" />
                                <div>
                                    <p className="font-semibold">
                                        {booking.start_datetime ? format(new Date(booking.start_datetime), "HH:mm'hs'") : 'Hora no disponible'}
                                    </p>
                                    <p className="text-xs text-slate-500">Hora de inicio</p>
                                </div>
                            </div>
                             <div className="flex items-start text-slate-700">
                                <MapPin className="w-5 h-5 mr-3 text-primary flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold">Punto de Partida</p>
                                    <p className="text-sm text-slate-600">{booking.start_location_address}</p>
                                </div>
                            </div>
                            <div className="flex items-start text-slate-700">
                                <FileText className="w-5 h-5 mr-3 text-primary flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold">Descripción del servicio</p>
                                    <p className="text-sm text-slate-600 italic">"{booking.description}"</p>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4 mt-4">
                               <div className="flex justify-between items-center">
                                   <div>
                                       <p className="text-xs text-slate-500">Ganancia estimada</p>
                                       <p className="text-lg font-bold text-green-600">{formatCurrencyARS(booking.total_fare)}</p>
                                   </div>
                                   {isAvailable ? (
                                       <Button onClick={() => handleClaim(booking)} disabled={isClaiming === booking.id || rideContextLoading}>
                                           {isClaiming === booking.id ? (
                                               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                           ) : (
                                               <CheckCircle className="w-4 h-4 mr-2" />
                                           )}
                                           Aceptar
                                       </Button>
                                   ) : booking.status === 'accepted' ? (
                                       <Button onClick={() => startHourlyRide(booking.id)} disabled={!canStartRide}>
                                         <Play className="w-4 h-4 mr-2" />
                                         Iniciar Viaje
                                       </Button>
                                   ) : booking.status === 'in_progress' ? (
                                       <Button variant="destructive" onClick={() => completeHourlyRide(booking)}>
                                           <Square className="w-4 h-4 mr-2" />
                                           Finalizar Viaje
                                       </Button>
                                   ) : null}
                               </div>
                           </div>
                        </CardContent>
                    </Card>
                </motion.div>
            );
        }

        const renderBookingList = (list, isAvailable) => {
            if (list.length === 0) {
                return (
                    <div className="text-center h-64 flex flex-col justify-center items-center bg-slate-100 rounded-lg mt-6">
                        <Clock className="w-12 h-12 text-slate-400 mb-4" />
                        <h2 className="text-xl font-semibold text-slate-700">
                            {isAvailable ? 'No hay reservas disponibles' : 'No tienes reservas por hora'}
                        </h2>
                        <p className="text-slate-500 mt-1">
                            {isAvailable ? 'Vuelve a consultar más tarde.' : 'Cuando aceptes una, aparecerá aquí.'}
                        </p>
                    </div>
                );
            }
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {list.map(booking => (
                        <BookingCard key={booking.id} booking={booking} isAvailable={isAvailable} />
                    ))}
                </div>
            );
        };

        return (
            <div className="p-4 md:p-6 lg:p-8 bg-slate-50 min-h-screen relative">
                <HelpDialog />
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <h1 className="text-3xl font-bold text-slate-800">Reservas por Hora</h1>
                    <p className="text-slate-500 mt-1">Gestiona tus viajes por hora aceptados y encuentra nuevas oportunidades.</p>
                </motion.div>

                <Tabs defaultValue="available" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="available">
                            Disponibles
                            <Badge variant="secondary" className="ml-2">{availableBookings.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="my-bookings">
                            Mis Reservas
                            <Badge variant="secondary" className="ml-2">{driverBookings.length}</Badge>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="available">
                        {loadingDriverBookings ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : renderBookingList(availableBookings, true)}
                    </TabsContent>
                    <TabsContent value="my-bookings">
                        {loadingDriverBookings ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : renderBookingList(driverBookings, false)}
                    </TabsContent>
                </Tabs>
            </div>
        );
    };

    export default DriverHourlyRidesPage;
