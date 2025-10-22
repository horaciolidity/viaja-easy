import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Save, Loader2, DollarSign, Edit, Check, X, CalendarClock } from 'lucide-react';
import { adminListTariffs, adminUpsertTariff } from '@/services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrencyARS } from '@/utils/mercadoPago.js';

const ScheduledTariffsCard = () => {
    const [tariffs, setTariffs] = useState([]);
    const [editingRow, setEditingRow] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTariffs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminListTariffs();
            const scheduledTariffs = data
                .filter(t => t.ride_type === 'scheduled' || !data.some(o => o.vehicle_type_id === t.vehicle_type_id && o.ride_type === 'scheduled'))
                .map(t => ({...t, ride_type: 'scheduled', id: t.vehicle_type_id}));
            
            const uniqueTariffs = Array.from(new Map(scheduledTariffs.map(item => [item.id, item])).values());
            setTariffs(uniqueTariffs);

        } catch (error) {
            toast({ title: "Error al cargar tarifas", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTariffs();
    }, [fetchTariffs]);

    const handleEdit = (row) => {
        setEditingRow({ ...row });
    };

    const handleCancel = () => {
        setEditingRow(null);
    };

    const handleSave = async () => {
        if (!editingRow) return;

        if (editingRow.base_fare < 0 || editingRow.price_per_km <= 0 || editingRow.price_per_minute < 0) {
            toast({ title: "Datos inválidos", description: "Las tarifas deben ser valores positivos. El precio por km debe ser mayor a cero.", variant: "destructive" });
            return;
        }

        try {
            await adminUpsertTariff({
                p_vehicle_type_id: editingRow.vehicle_type_id,
                p_ride_type: 'scheduled',
                p_base_fare: editingRow.base_fare,
                p_price_per_km: editingRow.price_per_km,
                p_price_per_minute: editingRow.price_per_minute
            });
            toast({ title: "Tarifa guardada", description: `La tarifa para ${editingRow.vehicle_name} ha sido actualizada.`, className: "bg-green-600 text-white" });
            setEditingRow(null);
            fetchTariffs();
        } catch (error) {
            toast({ title: "Error al guardar tarifa", description: error.message, variant: "destructive" });
        }
    };
    
    const handleEditingChange = (e) => {
        const { name, value } = e.target;
        setEditingRow(prev => ({...prev, [name]: parseFloat(value) || 0}));
    }

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg"><DollarSign className="w-5 h-5 text-green-600 mr-2" />Tarifas por Vehículo</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left py-2 px-3 font-semibold text-slate-600">Vehículo</th>
                                <th className="text-left py-2 px-3 font-semibold text-slate-600">Tarifa Base</th>
                                <th className="text-left py-2 px-3 font-semibold text-slate-600">Precio/km</th>
                                <th className="text-left py-2 px-3 font-semibold text-slate-600">Precio/min</th>
                                <th className="text-right py-2 px-3 font-semibold text-slate-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {tariffs.map(tariff => (
                                <tr key={tariff.id}>
                                    <td className="py-2 px-3">{tariff.vehicle_name}</td>
                                    {editingRow && editingRow.id === tariff.id ? (
                                        <>
                                            <td><Input type="number" name="base_fare" value={editingRow.base_fare} onChange={handleEditingChange} className="h-8"/></td>
                                            <td><Input type="number" name="price_per_km" value={editingRow.price_per_km} onChange={handleEditingChange} className="h-8"/></td>
                                            <td><Input type="number" name="price_per_minute" value={editingRow.price_per_minute} onChange={handleEditingChange} className="h-8"/></td>
                                            <td className="text-right space-x-2">
                                                <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={handleSave}><Check className="w-4 h-4"/></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}><X className="w-4 h-4"/></Button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-2 px-3">{formatCurrencyARS(tariff.base_fare || 0)}</td>
                                            <td className="py-2 px-3">{formatCurrencyARS(tariff.price_per_km || 0)}</td>
                                            <td className="py-2 px-3">{formatCurrencyARS(tariff.price_per_minute || 0)}</td>
                                            <td className="text-right">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(tariff)}><Edit className="w-4 h-4"/></Button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const ScheduledRidesSettings = ({ initialSettings, onSettingsChange }) => {
    const [settings, setSettings] = useState(initialSettings);
    
    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value);
        const newSettings = { ...settings, [name]: finalValue };
        setSettings(newSettings);
        onSettingsChange(newSettings);
    };

    const handleSwitchChange = (name, checked) => {
        const newSettings = { ...settings, [name]: checked };
        setSettings(newSettings);
        onSettingsChange(newSettings);
    };

    const fields = [
        { name: 'is_active', label: 'Habilitar Viajes Programados', type: 'switch' },
        { name: 'min_advance_notice_hours', label: 'Mín. Horas de Antelación', type: 'number', step: 1 },
        { name: 'max_advance_booking_days', label: 'Máx. Días de Antelación', type: 'number', step: 1 },
        { name: 'cancellation_window_hours', label: 'Ventana de Cancelación Gratuita (Horas)', type: 'number', step: 1 },
        { name: 'platform_fee_pct', label: 'Comisión de Plataforma (%)', type: 'number', step: 1 },
        { name: 'early_start_minutes', label: 'Minutos antes para Iniciar', type: 'number', step: 1, default: 30 },
        { name: 'start_proximity_meters', label: 'Distancia Máxima para Iniciar (m)', type: 'number', step: 10, default: 50 },
    ];
    
    return (
        <motion.div
            className="bg-white rounded-xl shadow-xl p-6 md:p-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex items-center mb-6 pb-4 border-b border-slate-200">
                <CalendarClock className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-semibold text-slate-800 ml-3">Viajes Programados</h3>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Configuración General</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {fields.map(field => (
                            <div key={field.name}>
                                <Label htmlFor={`scheduled_${field.name}`} className="block text-sm font-medium text-slate-600 mb-1.5">{field.label}</Label>
                                {field.type === 'switch' ? (
                                    <div className="flex items-center space-x-3 pt-1">
                                        <Switch id={`scheduled_${field.name}`} name={field.name} checked={!!settings[field.name]} onCheckedChange={(checked) => handleSwitchChange(field.name, checked)} />
                                        <span className="text-sm text-slate-500">{settings[field.name] ? 'Habilitado' : 'Deshabilitado'}</span>
                                    </div>
                                ) : (
                                    <Input id={`scheduled_${field.name}`} name={field.name} type={field.type} value={settings[field.name] || ''} onChange={handleInputChange} className="border-slate-300 h-11" />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <ScheduledTariffsCard />
            </div>
        </motion.div>
    );
};

export default ScheduledRidesSettings;