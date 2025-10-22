import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrencyARS } from '@/utils/mercadoPago';

const RIDE_TYPE_LABELS = {
  ride: 'Inmediato',
  scheduled: 'Agendado',
  hourly: 'Por Hora',
  package: 'Paquetería',
  shared: 'Compartido',
};

// CLAVES FIJAS: no generamos opciones dinámicas (evita duplicados)
const ALL_RIDE_TYPES = ['ride', 'scheduled', 'hourly', 'package', 'shared'];

const AdminDebtsPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [debtDetails, setDebtDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    driverId: 'all',
    rideType: 'all',
    startDate: '',
    endDate: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [driversRes, debtsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, phone, pending_debt')
            .eq('user_type', 'driver')
            .order('pending_debt', { ascending: false }),
          supabase
            .from('vw_cashlog_control')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);

        if (driversRes.error) throw driversRes.error;
        if (debtsRes.error) throw debtsRes.error;

        setDrivers(driversRes.data ?? []);
        setDebtDetails(debtsRes.data ?? []);
      } catch (error) {
        toast({
          title: 'Error al cargar datos de deudas',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const filteredDebtDetails = useMemo(() => {
    return (debtDetails ?? []).filter((detail) => {
      const detailDate = detail?.created_at ? new Date(detail.created_at) : null;
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      // driver
      const driverMatch =
        filters.driverId === 'all' || detail.driver_id === filters.driverId;

      // ride type: comparamos contra CLAVES (ride|scheduled|hourly|package|shared)
      const typeMatch =
        filters.rideType === 'all' || String(detail.ride_label) === filters.rideType;

      // fechas
      const startDateMatch = !startDate || (detailDate && detailDate >= startDate);
      const endDateMatch = !endDate || (detailDate && detailDate <= endDate);

      return driverMatch && typeMatch && startDateMatch && endDateMatch;
    });
  }, [debtDetails, filters]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-slate-800">Control de Deudas de Conductores</h1>

      {/* Resumen por conductor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User />
            Resumen de Deudas por Conductor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drivers.filter((d) => Number(d.pending_debt) > 0).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers
                .filter((d) => Number(d.pending_debt) > 0)
                .map((driver) => (
                  <div key={driver.id} className="p-4 border rounded-lg bg-slate-50">
                    <p className="font-semibold text-slate-800">{driver.full_name}</p>
                    <p className="text-sm text-slate-500">{driver.phone || '—'}</p>
                    <p className="text-lg font-bold text-red-600 mt-2">
                      {formatCurrencyARS(driver.pending_debt)}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-slate-500">No hay conductores con deudas pendientes.</p>
          )}
        </CardContent>
      </Card>

      {/* Detalle generadores de deuda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign />
            Detalle de Viajes en Efectivo (Generadores de Deuda)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4 p-4 bg-slate-50 rounded-lg border">
            <div className="flex-grow min-w-[220px]">
              <label className="text-sm font-medium text-slate-600">Conductor</label>
              <Select
                value={filters.driverId}
                onValueChange={(value) => setFilters((f) => ({ ...f, driverId: value }))}
              >
                <SelectTrigger><SelectValue placeholder="Todos los conductores" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los conductores</SelectItem>
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-grow min-w-[220px]">
              <label className="text-sm font-medium text-slate-600">Tipo de Viaje</label>
              <Select
                value={filters.rideType}
                onValueChange={(value) => setFilters((f) => ({ ...f, rideType: value }))}
              >
                <SelectTrigger><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {ALL_RIDE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {RIDE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-grow min-w-[180px]">
              <label className="text-sm font-medium text-slate-600">Fecha Inicio</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>

            <div className="flex-grow min-w-[180px]">
              <label className="text-sm font-medium text-slate-600">Fecha Fin</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>ID Viaje</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Estado Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebtDetails.length > 0 ? (
                  filteredDebtDetails.map((detail) => {
                    const commission =
                      Number(detail?.commission_fee ?? detail?.app_earnings ?? detail?.total_app_earnings ?? 0) || 0;

                    const key = String(detail?.ride_label || '');
                    const label = RIDE_TYPE_LABELS[key] || '—';
                    const status = detail?.payment_status || '—';

                    return (
                      <TableRow key={`${key}-${detail.id}`}>
                        <TableCell>{detail?.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{String(detail.id).substring(0, 8)}</TableCell>
                        <TableCell>{label}</TableCell>
                        <TableCell className="font-semibold text-red-600">
                          {formatCurrencyARS(commission)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No se encontraron registros con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminDebtsPage;