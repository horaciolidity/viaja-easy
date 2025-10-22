
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart2, DollarSign, Calendar, Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDriverStats } from '@/services/driverService';
import { useRide } from '@/contexts/RideContext';
import { formatCurrencyARS } from '@/utils/mercadoPago';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const DriverEarningsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allUserRides, loading: ridesLoading } = useRide();
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_driver_earnings_summary', { p_driver_id: user.id });
        if (error) throw error;
        setStats({
          today: data.today_total,
          week: data.week_total,
          month: data.month_total,
        });
      } catch (error) {
        console.error("Error fetching earnings summary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [user]);

  const recentTransactions = (allUserRides || [])
    .filter(ride => ride.status === 'completed' && ride.driver_id === user?.id)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 5);

  const earningsData = [
    { period: 'Hoy', amount: stats.today, icon: <DollarSign className="w-6 h-6 text-green-500" /> },
    { period: 'Esta Semana', amount: stats.week, icon: <Calendar className="w-6 h-6 text-blue-500" /> },
    { period: 'Este Mes', amount: stats.month, icon: <BarChart2 className="w-6 h-6 text-purple-500" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        className="p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 rounded-full bg-white shadow-md">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Mis Ganancias</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
          >
            {earningsData.map((item, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="p-3 bg-gray-100 rounded-full mb-3">
                  {item.icon}
                </div>
                <p className="text-sm text-gray-500 mb-1">{item.period}</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrencyARS(item.amount)}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          className="bg-white p-6 rounded-2xl shadow-lg mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Transacciones Recientes</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/driver/history')}>
              Ver Todo
            </Button>
          </div>
          {ridesLoading ? (
             <div className="flex justify-center items-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
             </div>
          ) : recentTransactions.length > 0 ? (
            <ul className="space-y-3">
              {recentTransactions.map(tx => {
                const destinationText = tx.destination_address 
                  ? tx.destination_address.split(',')[0]
                  : 'Destino no especificado';
                const dateText = tx.completed_at 
                  ? `${new Date(tx.completed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${new Date(tx.completed_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Fecha no disponible';
                const price = tx.driver_earnings || tx.actual_fare || tx.fare_estimated || 0;
                return (
                  <li key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-700">Viaje a {destinationText}</p>
                      <p className="text-xs text-gray-500">{dateText}</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrencyARS(price)}</p>
                  </li>
                );
               })}
            </ul>
          ) : (
             <p className="text-center text-gray-500 py-4">No hay transacciones recientes.</p>
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white h-12 rounded-xl text-base" onClick={() => toast({ title: "🚧 This feature isn't implemented yet", description: "You can request it in your next prompt! 🚀" })}>
            <Download className="w-5 h-5 mr-2" /> Descargar Reporte Mensual (PDF)
          </Button>
        </motion.div>
      </motion.div>
      <div className="bottom-safe-area" />
    </div>
  );
};

export default DriverEarningsPage;
