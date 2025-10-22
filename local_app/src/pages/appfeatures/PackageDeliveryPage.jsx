import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Package, MapPin, DollarSign, User, Bike, Car, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { usePayment } from '@/contexts/PaymentContext';
import { toast } from '@/components/ui/use-toast';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import LocationInput from '@/components/common/LocationInput';
import PaymentModal from '@/components/ride-booking/PaymentModal';
import { getActiveVehicleTypes } from '@/services/vehicleTypeService';

const SectionTitle = ({ icon: Icon, title, color = 'text-primary' }) => (
  <div className="flex items-center mb-4">
    <Icon className={`w-6 h-6 ${color} mr-3`} />
    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
  </div>
);

const PackageDeliveryPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { wallet } = usePayment();
  const { calculateRoute } = useLocation();

  const [formData, setFormData] = useState({
    pickupAddress: null,
    deliveryAddress: null,
    senderName: profile?.full_name || '',
    senderPhone: profile?.phone || '',
    recipientName: '',
    recipientPhone: '',
    packageDescription: '',
    packageWeight: '',
    vehicleTypeId: '',
    usePin: false,
  });

  // actualizar remitente cuando cargue el perfil
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      senderName: profile?.full_name || prev.senderName,
      senderPhone: profile?.phone || prev.senderPhone,
    }));
  }, [profile?.full_name, profile?.phone]);

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Ruta calculada (para enviar distancia/duración al RPC)
  const [routeInfo, setRouteInfo] = useState({ distance: null, duration: null });

  // Modal de pago
  const [showPay, setShowPay] = useState(false);
  const [payDetails, setPayDetails] = useState({ totalAmount: 0, payload: null, estimated: 0 });

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const data = await getActiveVehicleTypes();
        const packageVehicleTypes = (data || []).filter(vt => vt.is_package_delivery_enabled);
        if (packageVehicleTypes.length === 0) {
          toast({ title: 'Error', description: 'No hay tipos de vehículo configurados para paquetería.', variant: 'destructive' });
        } else {
          setVehicleTypes(packageVehicleTypes);
          setFormData(prev => ({ ...prev, vehicleTypeId: packageVehicleTypes[0].id }));
        }
      } catch {
        toast({ title: 'Error', description: 'No se pudieron cargar los tipos de vehículo.', variant: 'destructive' });
      }
    };
    fetchVehicleTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (name, location) => {
    setFormData(prev => ({ ...prev, [name]: location }));
  };

  const calculateFareInternal = useCallback(async () => {
    if (!formData.pickupAddress || !formData.deliveryAddress || !formData.vehicleTypeId) {
      setEstimatedFare(null);
      setRouteInfo({ distance: null, duration: null });
      return;
    }
    setIsCalculating(true);
    try {
      const route = await calculateRoute(formData.pickupAddress, formData.deliveryAddress);
      const selectedVehicle = vehicleTypes.find(v => v.id === formData.vehicleTypeId);

      if (!route || typeof route.distance !== 'number') throw new Error('Ruta inválida');
      if (!selectedVehicle) throw new Error('Vehículo inválido');

      const distanceKm = Number(route.distance) || 0;
      const durationMin = Number(route.duration) || 0;

      setRouteInfo({ distance: distanceKm, duration: durationMin });

      const base = Number(selectedVehicle.package_base_fare) || 0;
      const perKm = Number(selectedVehicle.package_price_per_km) || 0;

      const fare = base + distanceKm * perKm;
      setEstimatedFare(Number.isFinite(fare) ? Math.max(0, fare) : null);
    } catch {
      setEstimatedFare(null);
      setRouteInfo({ distance: null, duration: null });
      toast({ title: 'Error de cálculo', description: 'No se pudo calcular la tarifa. Intenta con otras direcciones.', variant: 'destructive' });
    } finally {
      setIsCalculating(false);
    }
  }, [formData.pickupAddress, formData.deliveryAddress, formData.vehicleTypeId, calculateRoute, vehicleTypes]);

  useEffect(() => {
    const t = setTimeout(() => { calculateFareInternal(); }, 800);
    return () => clearTimeout(t);
  }, [calculateFareInternal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      toast({ title: 'Sesión requerida', description: 'Inicia sesión para continuar.', variant: 'destructive' });
      return;
    }

    const selectedVehicle = vehicleTypes.find(v => v.id === formData.vehicleTypeId);
    if (!selectedVehicle) {
      toast({ title: 'Falta seleccionar vehículo', description: 'Elegí un tipo de vehículo.', variant: 'destructive' });
      return;
    }

    const weight = Number(formData.packageWeight);
    if (!Number.isFinite(weight) || weight <= 0) {
      toast({ title: 'Peso inválido', description: 'Ingresa un peso válido en kg.', variant: 'destructive' });
      return;
    }

    if (selectedVehicle.max_weight_kg && weight > Number(selectedVehicle.max_weight_kg)) {
      toast({ title: 'Peso excedido', description: `El peso máximo para ${selectedVehicle.name} es ${selectedVehicle.max_weight_kg} kg.`, variant: 'destructive' });
      return;
    }

    if (!formData.pickupAddress || !formData.deliveryAddress) {
      toast({ title: 'Direcciones faltantes', description: 'Seleccioná origen y destino del envío.', variant: 'destructive' });
      return;
    }

    if (!estimatedFare) {
      toast({ title: 'Sin tarifa', description: 'Calculá la tarifa antes de solicitar.', variant: 'destructive' });
      return;
    }

    // Payload exacto que espera el RPC (se guarda en metadata)
    const deliveryPayload = {
      pickup_address: formData.pickupAddress.address,
      pickup_lat: formData.pickupAddress.lat,
      pickup_lng: formData.pickupAddress.lng,
      dropoff_address: formData.deliveryAddress.address,
      dropoff_lat: formData.deliveryAddress.lat,
      dropoff_lng: formData.deliveryAddress.lng,
      sender_name: formData.senderName,
      sender_phone: formData.senderPhone,
      recipient_name: formData.recipientName,
      recipient_phone: formData.recipientPhone,
      package_description: formData.packageDescription,
      package_weight_kg: weight,
      vehicle_type_id: formData.vehicleTypeId,
      estimated_distance_km: routeInfo.distance,      // puede ir null, el RPC lo tolera
      estimated_duration_min: routeInfo.duration,     // puede ir null
      security_pin: formData.usePin ? Math.floor(1000 + Math.random() * 9000).toString() : null,
    };

    const totalAmount = Number(estimatedFare) + Number(profile?.pending_debt || 0);

    setPayDetails({
      totalAmount,
      payload: deliveryPayload,
      estimated: Number(estimatedFare),
    });
    setShowPay(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary text-white p-4 flex items-center sticky top-0 z-20 shadow-md">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 hover:bg-white/20 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Solicitar Envío Express</h1>
      </header>

      <form id="package-delivery-form" onSubmit={handleSubmit} className="flex-grow p-4 space-y-6 overflow-y-auto pb-24">
        <motion.div className="bg-white p-4 rounded-xl shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <SectionTitle icon={MapPin} title="Dirección de Recogida" />
          <LocationInput
            value={formData.pickupAddress}
            onLocationSelect={loc => handleLocationSelect('pickupAddress', loc)}
            placeholder="Ej: Av. Corrientes 1234, CABA"
          />
        </motion.div>

        <motion.div className="bg-white p-4 rounded-xl shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionTitle icon={MapPin} title="Dirección de Entrega" color="text-green-500" />
          <LocationInput
            value={formData.deliveryAddress}
            onLocationSelect={loc => handleLocationSelect('deliveryAddress', loc)}
            placeholder="Ej: Av. Santa Fe 5678, CABA"
          />
        </motion.div>

        <motion.div className="bg-white p-4 rounded-xl shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionTitle icon={User} title="Datos del Remitente" />
          <div className="space-y-3">
            <Input name="senderName" value={formData.senderName} onChange={handleInputChange} placeholder="Nombre completo" required />
            <Input name="senderPhone" value={formData.senderPhone} onChange={handleInputChange} placeholder="Teléfono" type="tel" required />
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-xl shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SectionTitle icon={User} title="Datos del Destinatario" color="text-green-500" />
          <div className="space-y-3">
            <Input name="recipientName" value={formData.recipientName} onChange={handleInputChange} placeholder="Nombre completo" required />
            <Input name="recipientPhone" value={formData.recipientPhone} onChange={handleInputChange} placeholder="Teléfono" type="tel" required />
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-xl shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <SectionTitle icon={Package} title="Detalles del Paquete" />
          <div className="space-y-3">
            <Textarea
              name="packageDescription"
              value={formData.packageDescription}
              onChange={handleInputChange}
              placeholder="Ej: Documentos importantes, caja pequeña, frágil."
              className="resize-none"
            />
            <Input
              name="packageWeight"
              value={formData.packageWeight}
              onChange={handleInputChange}
              placeholder="Peso aproximado en kg"
              type="number"
              step="0.1"
              required
            />
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-xl shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <SectionTitle icon={Car} title="Tipo de Vehículo" />
          <RadioGroup value={formData.vehicleTypeId} onValueChange={val => setFormData(p => ({ ...p, vehicleTypeId: val }))} className="flex gap-4">
            {vehicleTypes.map(vt => (
              <Label
                key={vt.id}
                htmlFor={vt.id}
                className={`flex-1 p-3 border rounded-lg cursor-pointer text-center ${formData.vehicleTypeId === vt.id ? 'border-primary bg-primary/10' : ''}`}
              >
                <RadioGroupItem value={vt.id} id={vt.id} className="sr-only" />
                {vt.name === 'Moto' || vt.name === 'Bicicleta' ? <Bike className="mx-auto mb-1" /> : <Car className="mx-auto mb-1" />}
                <span className="text-sm font-medium">{vt.name}</span>
                <span className="text-xs block text-slate-500">Max {vt.max_weight_kg}kg</span>
              </Label>
            ))}
          </RadioGroup>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-xl shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="flex items-center justify-between">
            <Label htmlFor="usePin" className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              <span className="font-medium">Añadir PIN de seguridad</span>
            </Label>
            <Switch id="usePin" checked={formData.usePin} onCheckedChange={checked => setFormData(p => ({ ...p, usePin: checked }))} />
          </div>
        </motion.div>
      </form>

      <footer className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-top z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-slate-600">Tarifa estimada:</span>
          {isCalculating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="text-xl font-bold">{Number.isFinite(estimatedFare) ? formatCurrencyARS(estimatedFare) : '...'}</span>
          )}
        </div>
        <Button
          type="submit"
          form="package-delivery-form"
          className="w-full h-12 text-base"
          disabled={!Number.isFinite(estimatedFare) || isCalculating || showPay}
        >
          <DollarSign className="w-5 h-5 mr-2" />
          Solicitar Envío
        </Button>
      </footer>

      {showPay && (
        <PaymentModal
          isOpen={showPay}
          onClose={() => setShowPay(false)}
          totalAmount={Number(estimatedFare) + Number(profile?.pending_debt || 0)}
          walletBalance={wallet?.balance || 0}
          rideData={payDetails.payload}
          fare_estimated={payDetails.estimated}
          mode="delivery"
          onWalletOnlySuccess={(data) => {
            const id = data?.delivery_id || data?.ride?.id;
            if (id) navigate(`/tracking/package/${id}`);
          }}
        />
      )}
    </div>
  );
};

export default PackageDeliveryPage;
