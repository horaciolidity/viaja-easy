import React from 'react';
import { motion } from 'framer-motion';
import { Users, Car, DollarSign, MapPin, Star } from 'lucide-react';

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
    <div className={`p-5 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl ${selectedColor.bg} border border-transparent hover:border-current`}>
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


const AdminStatsCards = ({ stats }) => {
  if (!stats) return null;

  const displayStats = {
    totalUsers: { value: stats.totalUsers?.toLocaleString('es-AR') || '0', icon: <Users />, color: 'blue', change: '+5.2%', type: 'positive' },
    activeDrivers: { value: stats.activeDrivers?.toLocaleString('es-AR') || '0', icon: <Car />, color: 'green', change: '+2.1%', type: 'positive' },
    totalRides: { value: stats.totalRides?.toLocaleString('es-AR') || '0', icon: <MapPin />, color: 'purple', change: '-1.5%', type: 'negative' },
    revenue: { value: formatCurrencyARS(stats.revenue || 0), icon: <DollarSign />, color: 'yellow', change: '+8.0%', type: 'positive' },
    avgRating: { value: `${stats.avgRating?.toString() || '0.0'} ★`, icon: <Star />, color: 'orange', change: '+0.1', type: 'positive' },
  };


  return (
    <motion.div
      className="px-6 py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
         {Object.entries(displayStats).map(([key, stat]) => (
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
    </motion.div>
  );
};

export default AdminStatsCards;