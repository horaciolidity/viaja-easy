import React, { useState, useEffect, useRef } from 'react';
    import { motion } from 'framer-motion';
    import { Car, Star } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import { supabase } from '@/lib/supabaseClient';
    import { getDriverStats } from '@/services/driverService';
    import DriverStatCard from './DriverStatCard';

    const DriverStats = ({ isOnline, availableRidesCount }) => {
      const { user } = useAuth();
      const [stats, setStats] = useState({ rating: 0, completedRides: 0 });
      const [loading, setLoading] = useState(true);
      const isMounted = useRef(true);

      useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
      }, []);

      useEffect(() => {
        const fetchDriverStats = async () => {
          if (!user?.id) return;
          
          if (isMounted.current) setLoading(true);
          try {
            const { data: updatedProfile, error: profileError } = await supabase
              .from('profiles')
              .select('rating, total_completed_rides')
              .eq('id', user.id)
              .single();
            
            if (profileError) throw profileError;
    
            if (isMounted.current) {
                setStats({
                  rating: updatedProfile.rating || 0,
                  completedRides: updatedProfile.total_completed_rides || 0
                });
            }
          } catch (error) {
            console.error('Error fetching driver stats:', error);
          } finally {
            if (isMounted.current) {
                setLoading(false);
            }
          }
        };
    
        fetchDriverStats();
        const interval = setInterval(fetchDriverStats, 60000);
        return () => clearInterval(interval);
    }, [user?.id]);

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full"
        >
          <DriverStatCard
            icon={Star}
            title="Calificación"
            value={stats.rating > 0 ? stats.rating.toFixed(1) : "N/A"}
            subtitle={`${stats.completedRides} viajes completados`}
            color="text-amber-500"
            isLoading={loading}
          />
          <DriverStatCard
            icon={Car}
            title={isOnline ? "Disponible" : "Desconectado"}
            value={isOnline ? availableRidesCount : "0"}
            subtitle={isOnline ? "viajes cerca" : "sin viajes"}
            color={isOnline ? "text-purple-500" : "text-red-500"}
            isLoading={loading}
          />
        </motion.div>
      );
    };

    export default DriverStats;