import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, MapPin, Eye, EyeOff, Route as RouteIcon, Timer } from 'lucide-react';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { formatDistance, formatDuration } from '@/utils/geolocation';

const LiveRidesTable = ({ rides, selectedRideId, onSelectRide, onCancelRide }) => {
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingRideId, setCancellingRideId] = useState(null);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'searching': { variant: 'secondary', label: 'Buscando', color: 'bg-yellow-100 text-yellow-800' },
      'pending': { variant: 'secondary', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      'driver_assigned': { variant: 'default', label: 'Asignado', color: 'bg-blue-100 text-blue-800' },
      'driver_arriving': { variant: 'default', label: 'En camino', color: 'bg-orange-100 text-orange-800' },
      'driver_arrived': { variant: 'default', label: 'Llegó', color: 'bg-purple-100 text-purple-800' },
      'in_progress': { variant: 'default', label: 'En viaje', color: 'bg-green-100 text-green-800' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleCancelConfirm = async () => {
    if (cancellingRideId && cancelReason.trim()) {
      await onCancelRide(cancellingRideId, cancelReason);
      setCancellingRideId(null);
      setCancelReason('');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Viajes Activos ({rides.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rides.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay viajes activos en este momento
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Hora</th>
                  <th className="text-left p-3">Pasajero</th>
                  <th className="text-left p-3">Conductor</th>
                  <th className="text-left p-3">Origen → Destino</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Info. Viaje</th>
                  <th className="text-center p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((ride) => (
                  <motion.tr
                    key={ride.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-b hover:bg-gray-50 transition-colors ${
                      selectedRideId === ride.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <td className="p-3 text-sm text-gray-600">
                      {formatTime(ride.created_at)}
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{ride.passenger?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{ride.passenger?.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      {ride.driver ? (
                        <div>
                          <div className="font-medium">{ride.driver.full_name}</div>
                          <div className="text-sm text-gray-500">
                            {ride.driver.vehicle_info?.brand} {ride.driver.vehicle_info?.model}
                          </div>
                          <div className="text-xs text-gray-400">
                            {ride.driver.vehicle_info?.plate}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="text-sm">
                        <div className="truncate font-medium text-green-600">
                          📍 {ride.origin_address?.split(',')[0] || 'N/A'}
                        </div>
                        <div className="truncate text-red-600">
                          🏁 {ride.destination_address?.split(',')[0] || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(ride.status)}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col text-xs">
                        <span className="font-medium">{formatCurrencyARS(ride.estimated_fare || 0)}</span>
                        <span className="text-slate-500 flex items-center gap-1"><RouteIcon className="w-3 h-3"/>{formatDistance(ride.estimated_distance_km || ride.estimated_distance)}</span>
                        <span className="text-slate-500 flex items-center gap-1"><Timer className="w-3 h-3"/>{formatDuration(ride.estimated_duration)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 justify-center">
                        <Button
                          variant={selectedRideId === ride.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => onSelectRide(ride.id)}
                          className="flex items-center gap-1"
                        >
                          {selectedRideId === ride.id ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Ver
                            </>
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setCancellingRideId(ride.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar Viaje</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que quieres cancelar este viaje? Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                              <Label htmlFor="cancel-reason">Razón de cancelación</Label>
                              <Input
                                id="cancel-reason"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Ingresa la razón de la cancelación..."
                                className="mt-2"
                              />
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => {
                                setCancellingRideId(null);
                                setCancelReason('');
                              }}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCancelConfirm}
                                disabled={!cancelReason.trim()}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Confirmar Cancelación
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveRidesTable;