import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Filter, Download, Users, Car, DollarSign, MapPin, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import AdminRecentActivity from '@/components/admin/AdminRecentActivity';
import AdminQuickActions from '@/components/admin/AdminQuickActions';

const formatCurrencyARS = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

const StatCard = ({ title, value, icon, colorName, change, changeType }) => {
  const colors = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', iconBg: 'bg-blue-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-600', iconBg: 'bg-green-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', iconBg: 'bg-purple-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', iconBg: 'bg-yellow-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-600', iconBg: 'bg-orange-500/20' },
  };
  const selectedColor = colors[colorName] || colors.blue;

  return (
    <div className={`p-5 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl ${selectedColor.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-medium ${selectedColor.text}`}>{title}</p>
        <div className={`w-10 h-10 rounded-lg ${selectedColor.iconBg} flex items-center justify-center`}>
          {React.cloneElement(icon, { className: `w-5 h-5 ${selectedColor.text}` })}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      {change && (
        <p className={`text-xs ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
          {changeType === 'positive' ? '▲' : '▼'} {change} vs mes anterior
        </p>
      )}
    </div>
  );
};

const AdminOverviewTab = () => {
  const overviewStats = {
    totalUsers: { value: 15420, icon: <Users />, color: 'blue', change: '+5.2%', type: 'positive' },
    activeDrivers: { value: 1250, icon: <Car />, color: 'green', change: '+2.1%', type: 'positive' },
    totalRides: { value: 8930, icon: <MapPin />, color: 'purple', change: '-1.5%', type: 'negative' },
    revenue: { value: formatCurrencyARS(12543050.00), icon: <DollarSign />, color: 'yellow', change: '+8.0%', type: 'positive' },
    avgRating: { value: '4.7 ★', icon: <Star />, color: 'orange', change: '+0.1', type: 'positive' },
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {Object.entries(overviewStats).map(([key, stat]) => (
          <StatCard 
            key={key}
            title={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
            value={stat.value} 
            icon={stat.icon} 
            colorName={stat.color}
            change={stat.change}
            changeType={stat.type}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-slate-800">Gráfico de Ingresos Mensuales</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="text-slate-600 border-slate-300 hover:bg-slate-100">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm" className="text-slate-600 border-slate-300 hover:bg-slate-100">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
          <div className="h-80 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg flex items-center justify-center p-4">
            <img
              className="w-full h-full object-contain rounded-md"
              alt="Gráfico de barras mostrando ingresos mensuales"
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <AdminRecentActivity />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-5">Mapa de Actividad de Viajes</h2>
            <div className="h-80 bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 rounded-lg flex items-center justify-center p-4">
              <img
                className="w-full h-full object-contain rounded-md"
                alt="Mapa de calor mostrando zonas de mayor actividad de viajes"
                src="https://images.unsplash.com/photo-1604357209793-f0508eb8f924?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
              />
            </div>
          </div>
        <div className="space-y-6">
          <AdminQuickActions />
        </div>
      </div>
    </motion.div>
  );
};

export default AdminOverviewTab;