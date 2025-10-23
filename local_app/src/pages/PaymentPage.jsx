import React, { useEffect, useState } from 'react';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Wallet,
  CreditCard,
  Banknote,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import MercadoPagoLink from '@/components/profile/MercadoPagoLink';
import { createPreference } from '@/services/paymentService';

const primaryColor = 'hsl(210, 90%, 50%)';

const iconMap = {
  wallet: Wallet,
  mercadopago: CreditCard,
  cash: Banknote,
};

const PaymentPage = () => {
  const { paymentMethods, defaultPaymentMethod, setAsDefault, loading } = usePayment();
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  /* ----------------------- Handle MercadoPago link callback ----------------------- */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mpStatus = params.get('mercadoPago');

    if (!mpStatus) return;

    if (mpStatus === 'ok') {
      toast({
        title: '¡Vinculación Exitosa!',
        description: 'Tu cuenta de Mercado Pago ha sido conectada.',
        className: 'bg-green-500 text-white',
      });
    } else if (mpStatus === 'fail') {
      toast({
        title: 'Error de Vinculación',
        description: 'No se pudo conectar tu cuenta de Mercado Pago. Por favor, intentá de nuevo.',
        variant: 'destructive',
      });
    }

    // Evita loop al recargar
    setTimeout(() => navigate('/passenger/payment-methods', { replace: true }), 1500);
  }, [location.search, navigate]);

  /* ----------------------- Pago de prueba ----------------------- */
  const handlePayWithMP = async () => {
    try {
      const toPay = 1000;
      const externalReference = `test-payment-${profile.id}`;
      const url = await createPreference({
        amount: toPay,
        externalReference,
        description: 'Pago de prueba',
      });
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo obtener la URL de pago.');
      toast({
        title: 'Error al pagar',
        description: err.message || 'No se pudo obtener la URL de pago.',
        variant: 'destructive',
      });
    }
  };

  /* ----------------------- Loading ----------------------- */
  if (loading && !paymentMethods.length) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* ----------------------- Render ----------------------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-8 max-w-4xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Métodos de Pago</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Gestioná tus métodos de pago y elegí tu opción predeterminada.
        </p>
      </header>

      {/* ---------------- Métodos disponibles ---------------- */}
      <Card className="bg-white dark:bg-slate-800 shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Wallet className="mr-2 h-6 w-6 text-blue-500" />
            Tus Métodos
          </CardTitle>
          <CardDescription>
            Seleccioná un método de pago para tus viajes.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Aviso si la cuenta está bloqueada */}
          {profile?.account_blocked && (
            <motion.div
              className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 rounded-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">Cuenta bloqueada</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    No podés cambiar tu método de pago porque tu cuenta está bloqueada.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Lista de métodos */}
          <RadioGroup
            value={defaultPaymentMethod?.id}
            onValueChange={(id) => setAsDefault(id)}
            disabled={loading || profile?.account_blocked}
            className="space-y-4"
          >
            {paymentMethods.map((method) => {
              const Icon = iconMap[method.type];
              const isDefault = defaultPaymentMethod?.id === method.id;
              return (
                <motion.div
                  key={method.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label
                    htmlFor={method.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-300 ${
                      isDefault
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    <RadioGroupItem value={method.id} id={method.id} className="mr-4" />
                    <Icon
                      className={`h-8 w-8 mr-4 ${
                        isDefault
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {method.name}
                      </p>
                      {method.type === 'wallet' && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Saldo: {formatCurrencyARS(method.balance)}
                        </p>
                      )}
                    </div>
                    {isDefault && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </motion.div>
                    )}
                    {loading && defaultPaymentMethod?.id === method.id && (
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    )}
                  </Label>
                </motion.div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* ---------------- Vincular Mercado Pago ---------------- */}
      <div className="space-y-4">
        <MercadoPagoLink />

        <Card className="bg-white dark:bg-slate-800 shadow-lg border-none">
          <CardContent className="p-6">
            <button
              onClick={() => navigate('/passenger/wallet')}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center">
                <Wallet className="mr-4 h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Gestionar Billetera
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ver historial y recargar saldo.
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-transform transform group-hover:translate-x-1" />
            </button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PaymentPage;
