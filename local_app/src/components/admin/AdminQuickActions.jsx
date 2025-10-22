import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TrendingUp, ShieldCheck, BarChartHorizontalBig, Settings2, Tag, MessageSquare as MessageSquareWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminQuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { label: 'Crear Promoción', icon: Tag, path: '/admin/promotions', color: 'text-purple-600', hover: 'hover:bg-purple-50' },
    { label: 'Ver Reportes', icon: BarChartHorizontalBig, path: '/admin/reports', color: 'text-blue-600', hover: 'hover:bg-blue-50' },
    { label: 'Analíticas Clave', icon: TrendingUp, path: '/admin/analytics', color: 'text-green-600', hover: 'hover:bg-green-50' },
    { label: 'Configuración General', icon: Settings2, path: '/admin/settings', color: 'text-slate-600', hover: 'hover:bg-slate-100' },
  ];

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
    >
      <h3 className="text-lg font-semibold text-slate-800 mb-5">Acciones Rápidas</h3>
      
      <div className="space-y-3">
        {actions.map((actionItem, index) => (
          <Button 
            key={index}
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium py-3 px-4 rounded-lg transition-colors duration-150 ${actionItem.color} ${actionItem.hover}`}
            onClick={() => navigate(actionItem.path)}
          >
            <actionItem.icon className={`w-5 h-5 mr-3 ${actionItem.color}`} />
            {actionItem.label}
          </Button>
        ))}
      </div>
    </motion.div>
  );
};

export default AdminQuickActions;