import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, CreditCard, DollarSign, Save, AlertCircle, CheckCircle, Info } from 'lucide-react';

const DriverPaymentSettingsPage = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    mercadopago_alias: '',
    mercadopago_cvu: ''
  });
  const [loading, setLoading] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

  useEffect(() => {
    if (profile) {
      setFormData({
        mercadopago_alias: profile.mercadopago_alias || '',
        mercadopago_cvu: profile.mercadopago_cvu || ''
      });
    }
    fetchPendingAmount();
  }, [profile]);

  const fetchPendingAmount = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_payments')
        .select('amount')
        .eq('driver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const total = data.reduce((sum, payment) => sum + payment.amount, 0);
      setPendingAmount(total);
    } catch (error) {
      console.error('Error fetching pending amount:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateCVU = (cvu) => {
    return /^\d{22}$/.test(cvu);
  };

  const validateAlias = (alias) => {
    return alias.length >= 6 && alias.length <= 20 && /^[a-zA-Z0-9._-]+$/.test(alias);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.mercadopago_alias && !formData.mercadopago_cvu) {
      toast({
        title: "Error",
        description: "Debes completar al menos el alias o el CVU",
        variant: "destructive"
      });
      return;
    }

    if (formData.mercadopago_cvu && !validateCVU(formData.mercadopago_cvu)) {
      toast({
        title: "CVU Inválido",
        description: "El CVU debe tener exactamente 22 dígitos",
        variant: "destructive"
      });
      return;
    }

    if (formData.mercadopago_alias && !validateAlias(formData.mercadopago_alias)) {
      toast({
        title: "Alias Inválido",
        description: "El alias debe tener entre 6 y 20 caracteres, solo letras, números, puntos, guiones y guiones bajos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        mercadopago_alias: formData.mercadopago_alias.trim() || null,
        mercadopago_cvu: formData.mercadopago_cvu.trim() || null
      });

      toast({
        title: "Configuración Guardada",
        description: "Tus datos de pago han sido actualizados correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrencyARS = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="status-bar">
        <span>9:41</span>
        <span>Configuración de Pagos</span>
        <span>100%</span>
      </div>

      <motion.div
        className="p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 rounded-full bg-white shadow-md">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Pagos</h1>
        </div>

        {pendingAmount > 0 && (
          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg mb-6 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Saldo Pendiente</h3>
                <p className="text-3xl font-bold">{formatCurrencyARS(pendingAmount)}</p>
                <p className="text-green-100 text-sm mt-1">Listo para cobrar</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-200" />
            </div>
          </motion.div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-blue-500" />
              <span>Información Importante</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>• Configura tu alias o CVU de MercadoPago para recibir tus pagos automáticamente</p>
            <p>• El administrador podrá enviarte todos tus pagos pendientes de una sola vez</p>
            <p>• Puedes completar solo uno de los dos campos, pero se recomienda el alias por ser más fácil</p>
            <p>• Los pagos se procesan de forma segura a través de MercadoPago</p>
          </CardContent>
        </Card>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <span>Datos de MercadoPago</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mercadopago_alias" className="text-sm font-medium text-gray-700">
                  Alias de MercadoPago (Recomendado)
                </Label>
                <Input
                  id="mercadopago_alias"
                  name="mercadopago_alias"
                  value={formData.mercadopago_alias}
                  onChange={handleInputChange}
                  placeholder="mi.alias.mp"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tu alias personalizado de MercadoPago (ej: juan.perez, mi.alias.mp)
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">O</span>
                </div>
              </div>

              <div>
                <Label htmlFor="mercadopago_cvu" className="text-sm font-medium text-gray-700">
                  CVU de MercadoPago
                </Label>
                <Input
                  id="mercadopago_cvu"
                  name="mercadopago_cvu"
                  value={formData.mercadopago_cvu}
                  onChange={handleInputChange}
                  placeholder="0000003100010000000001"
                  maxLength={22}
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tu CVU de 22 dígitos (Clave Virtual Uniforme)
                </p>
              </div>

              {(formData.mercadopago_alias || formData.mercadopago_cvu) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-700">
                    <p className="font-medium">Configuración válida</p>
                    <p>Podrás recibir pagos con esta información</p>
                  </div>
                </div>
              )}

              {!formData.mercadopago_alias && !formData.mercadopago_cvu && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-700">
                    <p className="font-medium">Configuración incompleta</p>
                    <p>Completa al menos un campo para recibir pagos</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Guardando...
              </div>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>
        </form>
      </motion.div>
      <div className="bottom-safe-area" />
    </div>
  );
};

export default DriverPaymentSettingsPage;