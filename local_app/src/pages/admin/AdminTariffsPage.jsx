import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp, Loader2, Edit, Save, X, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyARS } from '@/utils/mercadoPago.js';
import { adminListTariffs, adminUpsertTariff } from '@/services/adminService';

const AdminTariffsPage = () => {
  const [tariffs, setTariffs] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [newTariff, setNewTariff] = useState(null);

  const fetchTariffsAndVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const [tariffsData, vehiclesData] = await Promise.all([
        adminListTariffs(),
        supabase.from('vehicle_types').select('id, name')
      ]);
      
      setTariffs(tariffsData || []);
      setVehicleTypes(vehiclesData.data || []);
    } catch (error) {
      toast({
        title: "Error al cargar datos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTariffsAndVehicles();
  }, [fetchTariffsAndVehicles]);

  const handleEdit = (tariff) => {
    setEditingRow({ ...tariff });
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  const handleSave = async () => {
    if (!editingRow) return;
    try {
      await adminUpsertTariff({
        p_vehicle_type_id: editingRow.vehicle_type_id,
        p_ride_type: editingRow.ride_type,
        p_base_fare: parseFloat(editingRow.base_fare),
        p_price_per_km: parseFloat(editingRow.price_per_km),
        p_price_per_minute: parseFloat(editingRow.price_per_minute),
      });
      toast({ title: "Tarifa guardada", description: "La tarifa se ha actualizado correctamente.", className: "bg-green-600 text-white" });
      setEditingRow(null);
      fetchTariffsAndVehicles();
    } catch (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    }
  };
  
  const handleSaveNew = async () => {
    if (!newTariff) return;
    try {
      await adminUpsertTariff({
        p_vehicle_type_id: newTariff.vehicle_type_id,
        p_ride_type: newTariff.ride_type,
        p_base_fare: parseFloat(newTariff.base_fare),
        p_price_per_km: parseFloat(newTariff.price_per_km),
        p_price_per_minute: parseFloat(newTariff.price_per_minute),
      });
      toast({ title: "Tarifa Creada", description: "La nueva tarifa se ha guardado correctamente.", className: "bg-green-600 text-white" });
      setNewTariff(null);
      fetchTariffsAndVehicles();
    } catch (error) {
      toast({ title: "Error al crear", description: error.message, variant: "destructive" });
    }
  };

  const handleInputChange = (e, key) => {
    if (editingRow) {
      setEditingRow(prev => ({ ...prev, [key]: e.target.value }));
    }
  };
  
  const handleNewTariffChange = (key, value) => {
    setNewTariff(prev => ({ ...prev, [key]: value }));
  };

  const startNewTariff = () => {
    setNewTariff({
      vehicle_type_id: '',
      ride_type: 'now',
      base_fare: '',
      price_per_km: '',
      price_per_minute: '',
    });
  };

  const renderTariffRow = (tariff) => {
    const isEditing = editingRow && editingRow.vehicle_type_id === tariff.vehicle_type_id && editingRow.ride_type === tariff.ride_type;
    return (
      <TableRow key={`${tariff.vehicle_type_id}-${tariff.ride_type}`}>
        <TableCell>{tariff.vehicle_name}</TableCell>
        <TableCell><Badge>{tariff.ride_type}</Badge></TableCell>
        <TableCell>
          {isEditing ? (
            <Input type="number" value={editingRow.base_fare} onChange={(e) => handleInputChange(e, 'base_fare')} className="w-24" />
          ) : (
            formatCurrencyARS(tariff.base_fare)
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Input type="number" value={editingRow.price_per_km} onChange={(e) => handleInputChange(e, 'price_per_km')} className="w-24" />
          ) : (
            formatCurrencyARS(tariff.price_per_km)
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Input type="number" value={editingRow.price_per_minute} onChange={(e) => handleInputChange(e, 'price_per_minute')} className="w-24" />
          ) : (
            formatCurrencyARS(tariff.price_per_minute)
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4" /></Button>
              <Button size="sm" variant="outline" onClick={handleCancel}><X className="w-4 h-4" /></Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => handleEdit(tariff)}><Edit className="w-4 h-4" /></Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Tarifas</h2>
        <Button onClick={startNewTariff}><PlusCircle className="w-4 h-4 mr-2" /> Nueva Tarifa</Button>
      </div>

      {newTariff && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Tarifa</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <label>Vehículo</label>
              <Select onValueChange={(value) => handleNewTariffChange('vehicle_type_id', value)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map(vt => <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label>Tipo de Viaje</label>
              <Select defaultValue="now" onValueChange={(value) => handleNewTariffChange('ride_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Inmediato</SelectItem>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="hourly">Por Hora</SelectItem>
                  <SelectItem value="package">Paquetería</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label>Tarifa Base</label>
              <Input type="number" placeholder="250.00" onChange={(e) => handleNewTariffChange('base_fare', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label>Precio/km</label>
              <Input type="number" placeholder="120.50" onChange={(e) => handleNewTariffChange('price_per_km', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label>Precio/min</label>
              <Input type="number" placeholder="30.00" onChange={(e) => handleNewTariffChange('price_per_minute', e.target.value)} />
            </div>
            <div className="flex gap-2 col-span-full md:col-span-1 justify-end">
              <Button onClick={handleSaveNew}><Save className="w-4 h-4 mr-2" /> Guardar</Button>
              <Button variant="outline" onClick={() => setNewTariff(null)}><X className="w-4 h-4 mr-2" /> Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehículo</TableHead>
              <TableHead>Tipo de Viaje</TableHead>
              <TableHead>Tarifa Base</TableHead>
              <TableHead>Precio por Km</TableHead>
              <TableHead>Precio por Minuto</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin inline-block w-8 h-8 text-primary" /></TableCell></TableRow>
            ) : (
              tariffs.map(renderTariffRow)
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default AdminTariffsPage;