import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Save, Bell, DollarSign, Shield, Car, Info, FileText as FileTextIcon, Palette, Smartphone as SmartphoneIcon, Loader2, Hourglass, CalendarClock, Route, Package as PackageIcon, Users as UsersIcon, Edit, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient.js';
import { getHourlyRideSettings, updateHourlyRideSettings } from '@/services/hourlyRideService.js';
import { updateAppSettings, getSharedRideSettings, updateSharedRideSettings, adminUpdateScheduledSettings, adminGetScheduledSettings } from '@/services/adminService';
import { getVehicleTypes, updateVehicleType } from '@/services/vehicleTypeService.js';
import ScheduledRidesSettings from '@/components/admin/settings/ScheduledRidesSettings';

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    platform_name: 'Tu App',
    default_currency: 'ARS',
    admin_email: 'admin@uberapp.com.ar',
    commission_rate: 18,
    surge_multiplier_threshold: 1.3,
    max_surge_multiplier: 2.5,
    max_driver_distance_for_request: 7,
    driver_cancellation_fee: 200,
    passenger_cancellation_fee: 150,
    enable_push_notifications: true,
    notify_on_new_ride: true,
    notify_on_ride_completion: true,
    enable_2fa_for_admins: false,
    max_login_attempts: 5,
    min_passenger_app_version: '1.3.0',
    min_driver_app_version: '1.2.5',
    maintenance_mode: false,
    maintenance_message: 'Estamos realizando tareas de mantenimiento. Volveremos pronto.',
    terms_and_conditions_url: '/legal/terminos-argentina',
    privacy_policy_url: '/legal/privacidad-argentina',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    app_logo_url: '/logo-ar.png',
    grace_period_minutes: 2,
    wait_fee_per_minute: 50,
    max_stops_immediate_ride: 4,
    price_per_stop: 100,
  });
  const [hourlySettings, setHourlySettings] = useState({
    min_hours: 1,
    max_hours: 12,
    base_rate_ars: 12600,
    included_km: 10,
    extra_km_rate_ars: 1260,
    platform_fee_pct: 20,
    is_active: true,
    start_ride_minutes_before: 30,
    booking_expiration_hours: 5,
  });
  const [scheduledSettings, setScheduledSettings] = useState({
    is_active: true,
    min_advance_notice_hours: 2,
    max_advance_booking_days: 30,
    cancellation_window_hours: 24,
    platform_fee_pct: 20,
    early_start_minutes: 30,
    start_proximity_meters: 50,
  });
  const [sharedRideSettings, setSharedRideSettings] = useState({
    is_active: true,
    min_passengers_to_confirm: 3,
    commission_pct: 15,
    min_booking_notice_hours: 1,
    max_booking_notice_days: 14,
  });
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAllSettings = async () => {
      setLoading(true);
      try {
        const [appSettingsResponse, hourlySettingsData, scheduledSettingsData, vehicleTypesData] = await Promise.all([
          supabase.from('app_settings').select('settings, shared_ride_settings').single(),
          getHourlyRideSettings(),
          adminGetScheduledSettings(),
          getVehicleTypes()
        ]);
        
        if (appSettingsResponse.error && appSettingsResponse.error.code !== 'PGRST116') {
          throw appSettingsResponse.error;
        }
        
        if (appSettingsResponse.data) {
          if (appSettingsResponse.data.settings) {
            setSettings(prev => ({ ...prev, ...appSettingsResponse.data.settings }));
          }
          if (appSettingsResponse.data.shared_ride_settings) {
            setSharedRideSettings(prev => ({ ...prev, ...appSettingsResponse.data.shared_ride_settings }));
          }
        }

        if (hourlySettingsData) {
            setHourlySettings(hourlySettingsData);
        }
        
        if (scheduledSettingsData) {
            setScheduledSettings(scheduledSettingsData);
        }

        if (vehicleTypesData) {
            setVehicleTypes(vehicleTypesData);
        }

      } catch (error) {
        toast({ title: "Error al cargar configuración", description: error.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchAllSettings();
  }, []);

  const handleInputChange = (e, targetState = 'app') => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value);
    
    let setter;
    if (targetState === 'hourly') setter = setHourlySettings;
    else if (targetState === 'scheduled') setter = setScheduledSettings;
    else if (targetState === 'shared') setter = setSharedRideSettings;
    else setter = setSettings;
    
    setter(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleVehicleTypeChange = (id, field, value) => {
    setVehicleTypes(prev => prev.map(vt => vt.id === id ? { ...vt, [field]: value } : vt));
  };

  const handleSwitchChange = (name, checked, targetState = 'app') => {
    let setter;
    if (targetState === 'hourly') setter = setHourlySettings;
    else if (targetState === 'scheduled') setter = setScheduledSettings;
    else if (targetState === 'shared') setter = setSharedRideSettings;
    else setter = setSettings;

    setter(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        const vehicleTypePromises = vehicleTypes.map(vt => 
            updateVehicleType(vt.id, {
                is_package_delivery_enabled: vt.is_package_delivery_enabled,
                max_weight_kg: vt.max_weight_kg ? parseFloat(vt.max_weight_kg) : 0,
                package_base_fare: vt.package_base_fare ? parseFloat(vt.package_base_fare) : 0,
                package_price_per_km: vt.package_price_per_km ? parseFloat(vt.package_price_per_km) : 0,
            })
        );

        await Promise.all([
            updateAppSettings(settings),
            updateHourlyRideSettings(hourlySettings),
            adminUpdateScheduledSettings(scheduledSettings),
            updateSharedRideSettings(sharedRideSettings),
            ...vehicleTypePromises
        ]);

        toast({ title: "Configuración Guardada", description: "Los cambios han sido aplicados exitosamente.", className: "bg-green-600 text-white" });
    } catch(error) {
        toast({ title: "Error al guardar", description: `No se pudo guardar la configuración: ${error.message}`, variant: "destructive" });
    } finally {
        setSaving(false);
    }
  };

  const settingsCategories = [
    { 
      id: 'general', title: "General", icon: <Info className="w-6 h-6 text-blue-600" />,
      fields: [
        { name: 'platform_name', label: 'Nombre de la Plataforma', type: 'text' },
        { name: 'default_currency', label: 'Moneda por Defecto', type: 'text', placeholder: 'ARS' },
        { name: 'admin_email', label: 'Email de Administrador Principal', type: 'email' },
      ]
    },
    { 
      id: 'commissions', title: "Comisiones y Tarifas Generales", icon: <DollarSign className="w-6 h-6 text-green-600" />,
      fields: [
        { name: 'commission_rate', label: 'Tasa de Comisión (%)', type: 'number', step: 0.1 },
      ]
    },
    {
      id: 'multistop', title: "Paradas Múltiples (Viajes Inmediatos)", icon: <Route className="w-6 h-6 text-lime-600" />,
      fields: [
        { name: 'max_stops_immediate_ride', label: 'Máximo de Paradas Adicionales', type: 'number', step: 1, min: 0, max: 10 },
        { name: 'price_per_stop', label: `Costo por Parada Adicional (${settings.default_currency})`, type: 'number', step: 10 },
      ]
    },
     { 
      id: 'hourly', title: "Reservas por Hora", icon: <Hourglass className="w-6 h-6 text-cyan-600" />,
      targetState: 'hourly',
      fields: [
        { name: 'is_active', label: 'Habilitar Reservas por Hora', type: 'switch' },
        { name: 'start_ride_minutes_before', label: 'Minutos antes para Iniciar Viaje', type: 'number', step: 1 },
        { name: 'booking_expiration_hours', label: 'Horas para Expiración de Reserva', type: 'number', step: 1 },
        { name: 'min_hours', label: 'Mínimo de Horas', type: 'number', step: 1 },
        { name: 'max_hours', label: 'Máximo de Horas', type: 'number', step: 1 },
        { name: 'base_rate_ars', label: `Tarifa Base por Hora (${settings.default_currency})`, type: 'number', step: 100 },
        { name: 'included_km', label: 'KM Incluidos por Hora', type: 'number', step: 1 },
        { name: 'extra_km_rate_ars', label: `Tarifa por KM Extra (${settings.default_currency})`, type: 'number', step: 10 },
        { name: 'platform_fee_pct', label: 'Comisión de Plataforma (%)', type: 'number', step: 1 },
      ]
    },
    { 
      id: 'shared', title: "Viajes Compartidos", icon: <UsersIcon className="w-6 h-6 text-teal-600" />,
      targetState: 'shared',
      fields: [
        { name: 'is_active', label: 'Habilitar Viajes Compartidos', type: 'switch' },
        { name: 'min_passengers_to_confirm', label: 'Mínimo de Pasajeros para Confirmar', type: 'number', step: 1 },
        { name: 'commission_pct', label: 'Comisión de Plataforma (%)', type: 'number', step: 1 },
        { name: 'min_booking_notice_hours', label: 'Mín. Horas de Antelación para Reservar', type: 'number', step: 1 },
        { name: 'max_booking_notice_days', label: 'Máx. Días de Antelación para Publicar', type: 'number', step: 1 },
      ]
    },
    {
      id: 'packages', title: "Envío de Paquetes", icon: <PackageIcon className="w-6 h-6 text-amber-600" />,
      isGrid: false,
      fields: vehicleTypes.map(vt => ({
        id: vt.id,
        name: vt.name,
        type: 'vehicle_package_settings',
        label: vt.name,
      }))
    },
    {
      id: 'operations', title: "Operaciones y Penalizaciones", icon: <Car className="w-6 h-6 text-orange-600" />,
      fields: [
        { name: 'max_driver_distance_for_request', label: 'Distancia Máx. Conductor para Solicitud (km)', type: 'number', step: 0.5 },
        { name: 'grace_period_minutes', label: 'Minutos de Gracia por Espera', type: 'number', step: 1 },
        { name: 'wait_fee_per_minute', label: `Tarifa por Minuto de Espera (${settings.default_currency})`, type: 'number', step: 1 },
        { name: 'driver_cancellation_fee', label: `Tarifa Cancelación Conductor (${settings.default_currency})`, type: 'number', step: 10 },
        { name: 'passenger_cancellation_fee', label: `Tarifa Cancelación Pasajero (${settings.default_currency})`, type: 'number', step: 10 },
        { name: 'surge_multiplier_threshold', label: 'Umbral Multiplicador Dinámico', type: 'number', step: 0.1 },
        { name: 'max_surge_multiplier', label: 'Multiplicador Dinámico Máximo', type: 'number', step: 0.1 },
      ]
    },
    {
      id: 'notifications', title: "Notificaciones", icon: <Bell className="w-6 h-6 text-yellow-500" />,
      fields: [
        { name: 'enable_push_notifications', label: 'Habilitar Notificaciones Push Globales', type: 'switch' },
        { name: 'notify_on_new_ride', label: 'Notificar a Conductores (Nuevo Viaje)', type: 'switch' },
        { name: 'notify_on_ride_completion', label: 'Notificar a Pasajeros (Viaje Completo)', type: 'switch' },
      ]
    },
    {
      id: 'security', title: "Seguridad", icon: <Shield className="w-6 h-6 text-red-600" />,
      fields: [
        { name: 'enable_2fa_for_admins', label: 'Habilitar 2FA para Administradores', type: 'switch' },
        { name: 'max_login_attempts', label: 'Intentos Máximos de Inicio de Sesión', type: 'number', step: 1 },
      ]
    },
    {
      id: 'app_management', title: "Gestión de Aplicación", icon: <SmartphoneIcon className="w-6 h-6 text-indigo-600" />,
      fields: [
        { name: 'min_passenger_app_version', label: 'Versión Mínima App Pasajero', type: 'text', placeholder: '1.0.0' },
        { name: 'min_driver_app_version', label: 'Versión Mínima App Conductor', type: 'text', placeholder: '1.0.0' },
        { name: 'maintenance_mode', label: 'Modo Mantenimiento', type: 'switch' },
        { name: 'maintenance_message', label: 'Mensaje de Mantenimiento', type: 'textarea' },
      ]
    },
    {
      id: 'legal', title: "Legal", icon: <FileTextIcon className="w-6 h-6 text-slate-600" />,
      fields: [
        { name: 'terms_and_conditions_url', label: 'URL Términos y Condiciones', type: 'text' },
        { name: 'privacy_policy_url', label: 'URL Política de Privacidad', type: 'text' },
      ]
    },
     {
      id: 'branding', title: "Marca y Personalización", icon: <Palette className="w-6 h-6 text-purple-600" />,
      fields: [
        { name: 'primary_color', label: 'Color Primario (Hex)', type: 'text', placeholder: '#3B82F6' },
        { name: 'secondary_color', label: 'Color Secundario (Hex)', type: 'text', placeholder: '#10B981' },
        { name: 'app_logo_url', label: 'URL del Logo de la App', type: 'text', placeholder: '/logo-ar.png' },
      ]
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-slate-600">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      <form onSubmit={handleSubmit} className="space-y-10">
        
        <ScheduledRidesSettings initialSettings={scheduledSettings} onSettingsChange={setScheduledSettings} />

        {settingsCategories.map((category, catIndex) => (
            <motion.div 
              key={category.id} 
              className="bg-white rounded-xl shadow-xl p-6 md:p-8"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * catIndex }}
            >
              <div className="flex items-center mb-6 pb-4 border-b border-slate-200"> {category.icon} <h3 className="text-xl font-semibold text-slate-800 ml-3">{category.title}</h3> </div>
              <div className={category.isGrid === false ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"}>
                {category.fields.map((field) => {
                    if (field.type === 'vehicle_package_settings') {
                      const vehicle = vehicleTypes.find(vt => vt.id === field.id);
                      if (!vehicle) return null;
                      return (
                        <div key={field.id} className="p-4 border rounded-lg bg-slate-50">
                          <h4 className="font-semibold mb-3">{field.label}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`package_enabled_${field.id}`} className="block text-sm font-medium text-slate-600 mb-1.5">Habilitar Envíos</Label>
                              <Switch id={`package_enabled_${field.id}`} checked={!!vehicle.is_package_delivery_enabled} onCheckedChange={(checked) => handleVehicleTypeChange(field.id, 'is_package_delivery_enabled', checked)} />
                            </div>
                            <div>
                              <Label htmlFor={`max_weight_${field.id}`} className="block text-sm font-medium text-slate-600 mb-1.5">Peso Máximo (kg)</Label>
                              <Input id={`max_weight_${field.id}`} type="number" value={vehicle.max_weight_kg || ''} onChange={(e) => handleVehicleTypeChange(field.id, 'max_weight_kg', e.target.value)} className="border-slate-300" />
                            </div>
                            <div>
                              <Label htmlFor={`package_base_fare_${field.id}`} className="block text-sm font-medium text-slate-600 mb-1.5">Tarifa Base Envío</Label>
                              <Input id={`package_base_fare_${field.id}`} type="number" value={vehicle.package_base_fare || ''} onChange={(e) => handleVehicleTypeChange(field.id, 'package_base_fare', e.target.value)} className="border-slate-300" />
                            </div>
                            <div>
                              <Label htmlFor={`package_price_per_km_${field.id}`} className="block text-sm font-medium text-slate-600 mb-1.5">Precio por Km Envío</Label>
                              <Input id={`package_price_per_km_${field.id}`} type="number" value={vehicle.package_price_per_km || ''} onChange={(e) => handleVehicleTypeChange(field.id, 'package_price_per_km', e.target.value)} className="border-slate-300" />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    let state;
                    if (category.targetState === 'hourly') state = hourlySettings;
                    else if (category.targetState === 'shared') state = sharedRideSettings;
                    else state = settings;
                    
                    const value = state[field.name];
                    
                    return(
                      <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <Label htmlFor={field.name} className="block text-sm font-medium text-slate-600 mb-1.5"> {field.label} </Label>
                        {field.type === 'switch' ? (
                          <div className="flex items-center space-x-3 pt-1">
                             <Switch id={field.name} name={field.name} checked={!!value} onCheckedChange={(checked) => handleSwitchChange(field.name, checked, category.targetState)} aria-label={field.label} />
                            <span className="text-sm text-slate-500">{value ? 'Habilitado' : 'Deshabilitado'}</span>
                          </div>
                        ) : field.type === 'textarea' ? (
                          <Textarea id={field.name} name={field.name} value={value || ''} onChange={(e) => handleInputChange(e, category.targetState)} placeholder={field.placeholder || ''} className="border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 min-h-[100px]" rows={3} />
                        ) : (
                          <Input id={field.name} name={field.name} type={field.type} value={value || ''} onChange={(e) => handleInputChange(e, category.targetState)} placeholder={field.placeholder || ''} step={field.step || undefined} className="border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-11" min={field.min} max={field.max} />
                        )}
                      </div>
                    )
                })}
              </div>
            </motion.div>
          ))}
        <div className="pt-6 flex justify-end sticky bottom-0 bg-slate-100/80 backdrop-blur-sm py-4 px-6 -mx-6 rounded-b-xl">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-lg text-base font-semibold shadow-lg hover:shadow-blue-500/50 transition-shadow disabled:opacity-70" disabled={saving}>
            {saving ? <><Loader2 className="w-5 h-5 mr-2.5 animate-spin" /> Guardando...</> : <><Save className="w-5 h-5 mr-2.5" /> Guardar Toda la Configuración</>}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default AdminSettingsPage;