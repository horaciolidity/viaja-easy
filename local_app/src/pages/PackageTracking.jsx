import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';

const RETRY_MS = 600;        // intervalo entre reintentos
const RETRY_WINDOW_MS = 10000; // ventana total de reintentos (10s)

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
      // opcional: puedes loguear error si te interesa
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-slate-600">Creando el envío y preparando el tracking…</p>
      </div>
    );
  }

  if (notFound || !pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-slate-700">No se encontró el envío.</p>
        <Button onClick={() => navigate('/passenger')}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-1">Tracking de Envío</h1>
      <p className="text-slate-600 mb-6">ID: {pkg.id}</p>

      <div className="grid gap-2">
        <div><span className="font-semibold">Estado:</span> {pkg.status}</div>
        <div><span className="font-semibold">Origen:</span> {pkg.pickup_address}</div>
        <div><span className="font-semibold">Destino:</span> {pkg.delivery_address}</div>
        <div><span className="font-semibold">Método de pago:</span> {pkg.payment_method || 'wallet'}</div>
        <div><span className="font-semibold">Estado de pago:</span> {pkg.payment_status || 'approved'}</div>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => navigate('/passenger')}>Volver</Button>
      </div>
    </div>
  );
};

export default PackageTracking;
