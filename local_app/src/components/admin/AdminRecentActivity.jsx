import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, UserPlus, DollarSign, AlertTriangle, Clock, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatCurrencyARS = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
};

const getActivityIcon = (type) => {
  switch (type) {
    case 'ride_completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'driver_registered': return <UserPlus className="w-5 h-5 text-blue-500" />;
    case 'payment_processed': return <DollarSign className="w-5 h-5 text-emerald-500" />;
    case 'user_complaint': return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case 'vehicle_added': return <Car className="w-5 h-5 text-indigo-500" />;
    default: return <Clock className="w-5 h-5 text-slate-500" />;
  }
};

const AdminRecentActivity = ({ activities = [] }) => {
  const navigate = useNavigate();
  const defaultActivities = [
    { id: 1, type: 'ride_completed', description: 'Viaje completado por Juan Pérez', timestamp: new Date(Date.now() - 5 * 60000), amount: 1550.00 },
    { id: 2, type: 'driver_registered', description: 'Nuevo conductor: María García', timestamp: new Date(Date.now() - 15 * 60000) },
    { id: 3, type: 'payment_processed', description: 'Pago procesado para ID: 1234', timestamp: new Date(Date.now() - 30 * 60000), amount: 8925.75 },
    { id: 4, type: 'user_complaint', description: 'Nueva queja - Ticket #5678', timestamp: new Date(Date.now() - 45 * 60000), priority: 'high' },
    { id: 5, type: 'vehicle_added', description: 'Vehículo agregado por Conductor ID: 567', timestamp: new Date(Date.now() - 65 * 60000) },
  ];
  const activitiesToDisplay = activities.length > 0 ? activities : defaultActivities;


  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
    >
      <h3 className="text-lg font-semibold text-slate-800 mb-5">Actividad Reciente</h3>
      
      <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {activitiesToDisplay.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex-shrink-0 mt-1 p-2 bg-slate-100 rounded-full">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{activity.description}</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-slate-500">{formatTimeAgo(activity.timestamp)}</p>
                {activity.amount && (
                  <span className="text-xs font-semibold text-emerald-600">
                    {formatCurrencyARS(activity.amount)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {activitiesToDisplay.length > 0 && (
         <Button 
            variant="outline" 
            className="w-full mt-5 text-sm text-blue-600 border-blue-500 hover:bg-blue-50"
            onClick={() => navigate('/admin/activity-log')}
          >
           Ver toda la actividad
         </Button>
      )}
      {activitiesToDisplay.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">No hay actividad reciente.</p>
      )}
    </motion.div>
  );
};

export default AdminRecentActivity;