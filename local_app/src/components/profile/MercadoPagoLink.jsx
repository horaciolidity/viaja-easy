import React from 'react';
import { useMercadoPagoAuth } from '@/hooks/useMercadoPagoAuth';
import { Button } from '@/components/ui/button';
import { Loader2, Link, CheckCircle, XCircle } from 'lucide-react';

const MercadoPagoLink = () => {
  const { beginLinking, unlinkAccount, loading, isLinked } = useMercadoPagoAuth();

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
            <img src="https://img.icons8.com/color/48/mercado-pago.png" alt="Mercado Pago" className="mr-4" />
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Cuenta de Mercado Pago</h3>
                {isLinked ? (
                    <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span>Vinculada</span>
                    </div>
                ) : (
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                        <XCircle className="w-4 h-4 mr-1" />
                        <span>No vinculada</span>
                    </div>
                )}
            </div>
        </div>
        
        {isLinked ? (
            <Button variant="destructive" onClick={unlinkAccount} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Desvincular
            </Button>
        ) : (
            <Button onClick={beginLinking} disabled={loading} className="bg-blue-500 hover:bg-blue-600">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link className="mr-2 h-4 w-4" />}
                Vincular cuenta MP
            </Button>
        )}
      </div>
    </div>
  );
};

export default MercadoPagoLink;