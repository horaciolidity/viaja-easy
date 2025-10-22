import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, DollarSign, Car, Clock, Users, Trophy, PieChart as PieChartIcon, Map } from 'lucide-react';

import * as analyticsService from '@/services/adminService';

import AnalyticsCard from '@/components/admin/analytics/AnalyticsCard';
import RidesRevenueChart from '@/components/admin/analytics/RidesRevenueChart';
import WaitTimeChart from '@/components/admin/analytics/WaitTimeChart';
import TopDriversCard from '@/components/admin/analytics/TopDriversCard';
import VehiclePieChart from '@/components/admin/analytics/VehiclePieChart';
import NewUsersChart from '@/components/admin/analytics/NewUsersChart';
import RequestHeatmap from '@/components/admin/analytics/RequestHeatmap';

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    dailyMetrics: [],
    waitTimes: [],
    topDrivers: [],
    vehicleDistribution: [],
    newPassengers: [],
    heatmap: [],
  });
  const [timeRange, setTimeRange] = useState('30');

  const fetchData = useCallback(async (days) => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const [
        dailyMetrics,
        waitTimes,
        topDrivers,
        vehicleDistribution,
        newPassengers,
        heatmap,
      ] = await Promise.all([
        analyticsService.getDailyMetrics(days),
        analyticsService.getAverageWaitTimes(days),
        analyticsService.getTopDrivers(),
        analyticsService.getVehicleDistribution(),
        analyticsService.getNewPassengersMonthly(),
        analyticsService.getHeatmapData(startDate.toISOString(), endDate.toISOString()),
      ]);

      setData({ dailyMetrics, waitTimes, topDrivers, vehicleDistribution, newPassengers, heatmap });
    } catch (error) {
      toast({
        title: 'Error al cargar analíticas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(parseInt(timeRange, 10));
  }, [fetchData, timeRange]);

  const summaryStats = React.useMemo(() => {
    if (loading || !data.dailyMetrics || data.dailyMetrics.length === 0) {
      return { totalRevenue: 0, totalRides: 0, avgWaitTime: 0 };
    }
    const totalRevenue = data.dailyMetrics.reduce((acc, item) => acc + parseFloat(item.total_revenue || 0), 0);
    const totalRides = data.dailyMetrics.reduce((acc, item) => acc + parseInt(item.ride_count || 0), 0);
    const avgWaitTime = data.waitTimes.length > 0 ? data.waitTimes.reduce((acc, item) => acc + parseFloat(item.avg_wait_minutes || 0), 0) / data.waitTimes.length : 0;
    
    return {
      totalRevenue: totalRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
      totalRides: totalRides.toLocaleString('es-AR'),
      avgWaitTime: `${avgWaitTime.toFixed(1)} min`,
    };
  }, [data, loading]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Analíticas</h2>
        <div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white shadow-sm">
              <SelectValue placeholder="Seleccionar Rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}><AnalyticsCard title={`Ingresos (${timeRange} días)`} value={summaryStats.totalRevenue} icon={DollarSign} loading={loading} /></motion.div>
        <motion.div variants={itemVariants}><AnalyticsCard title={`Viajes (${timeRange} días)`} value={summaryStats.totalRides} icon={Car} loading={loading} /></motion.div>
        <motion.div variants={itemVariants}><AnalyticsCard title="Espera Promedio" value={summaryStats.avgWaitTime} icon={Clock} loading={loading} /></motion.div>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <RidesRevenueChart data={data.dailyMetrics} loading={loading} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TopDriversCard data={data.topDrivers} loading={loading} />
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
         <motion.div variants={itemVariants}>
          <WaitTimeChart data={data.waitTimes} loading={loading} />
        </motion.div>
         <motion.div variants={itemVariants}>
          <VehiclePieChart data={data.vehicleDistribution} loading={loading} />
        </motion.div>
         <motion.div variants={itemVariants}>
          <NewUsersChart data={data.newPassengers} loading={loading} />
        </motion.div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <RequestHeatmap data={data.heatmap} loading={loading} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminAnalyticsPage;