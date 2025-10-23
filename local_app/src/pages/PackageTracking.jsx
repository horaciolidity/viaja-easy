// src/pages/PackageTracking.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Home, CreditCard, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';

const RETRY_MS = 600; // intervalo entre reintentos
const RETRY_WINDOW_MS = 10000; // ventana total de reintentos (10s)

const statusLabels = {
  pending: 'Pendiente',
  searching_driver: 'Buscando conductor',
  assigned: 'Conductor asignado',
  picked_up: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const paymentLabels = {
  pending: 'Pendiente',
  succeeded: 'Aprobado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
};

const PackageTracking = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const channelRef = useRef(null);
  const cancelledRef = useRef(false);

  const fetchOnce = async () => {
    const { data, error } = await supabase
      .from('package_deliveries')
      .select('*')
      .eq('id', packageId)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener paquete:', error.message);
      return null;
    }
    return data || null;
  };

  const fetchWithRetry = async () => {
    setLoading(true);
    setNotFound(false);
    const start = Date.now();
    let data = await fetchOnce();

    // reintenta mientras no aparezca y no venza la ventana
    while (!cancelledRef.current && !data && Date.now() - start < RETRY_WINDOW_MS) {
      await new Promise((r) => setTimeout(r, RETRY_MS));
      data = await fetchOnce();
    }

    if (cancelledRef.current) return;

    if (data) {
      setPkg(data);
      setLoading(false);

      // engancha realtime una sola vez
      if (!channelRef.current) {
        const ch = supabase
          .channel(`pkg-${packageId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'package_deliveries',
              filter: `id=eq.${packageId}`,
            },
            async () => {
              const fresh = await fetchOnce();
              if (!cancelledRef.current && fresh) setPkg(fresh);
            }
          )
          .subscribe();
        channelRef.current = ch;
      }
    } else {
      setLoading(false);
      setNotFound(true);
    }
  };

  useEffect(() => {
    if (!packageId) return;
    cancelledRef.current = false;
    fetchWithRetry();

    return () => {
      cancelledRef.current = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [packageId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          Creando el envío y preparando el tracking…
        </p>
      </div>
    );
  }

  if (notFound || !pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-slate-900">
        <p className="text-lg text-slate-700 dark:text-slate-300">
          No se encontró el envío.
        </p>
        <Button onClick={() => navigate('/passenger')}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen p-6 bg-gray-50 dark:bg-slate-900 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Tracking de Envío
          </h1>
          <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">ID: {pkg.id}</p>

        {/* Estado principal */}
        <div className="mb-4">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Estado:
          </span>
          <span
            className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
              pkg.status === 'delivered'
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                : pkg.status === 'cancelled'
                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            }`}
          >
            {statusLabels[pkg.status] || pkg.status}
          </span>
        </div>

        {/* Detalles */}
        <div className="space-y-3 text-slate-700 dark:text-slate-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Origen:</span>
            <span>{pkg.pickup_address || 'No especificado'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-green-500" />
            <span className="font-semibold">Destino:</span>
            <span>{pkg.delivery_address || 'No especificado'}</span>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">Método de pago:</span>
            <span>{pkg.payment_method || 'Wallet'}</span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold">Estado del pago:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                pkg.payment_status === 'succeeded'
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                  : pkg.payment_status === 'pending'
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
              }`}
            >
              {paymentLabels[pkg.payment_status] || pkg.payment_status}
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={() => navigate('/passenger')}>
            Volver
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PackageTracking;
