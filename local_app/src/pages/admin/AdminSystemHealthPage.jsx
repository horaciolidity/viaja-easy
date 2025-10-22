import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Server, Database, Wifi, Smartphone, Clock } from 'lucide-react';

const StatusIndicator = ({ status, label }) => {
  let IconComponent;
  let colorClass;

  switch (status) {
    case 'operational':
      IconComponent = CheckCircle;
      colorClass = 'text-green-500';
      break;
    case 'degraded':
      IconComponent = AlertTriangle;
      colorClass = 'text-yellow-500';
      break;
    case 'outage':
      IconComponent = AlertTriangle;
      colorClass = 'text-red-500';
      break;
    default:
      IconComponent = CheckCircle;
      colorClass = 'text-slate-500';
  }

  return (
    <div className="flex items-center space-x-2">
      <IconComponent className={`w-5 h-5 ${colorClass}`} />
      <span className="text-sm text-slate-700">{label}</span>
      <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full border ${
        status === 'operational' ? 'bg-green-100 text-green-700 border-green-200' :
        status === 'degraded' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
        status === 'outage' ? 'bg-red-100 text-red-700 border-red-200' :
        'bg-slate-100 text-slate-700 border-slate-200'
      }`}>
        {status.replace('_', ' ')}
      </span>
    </div>
  );
};

const AdminSystemHealthPage = () => {
  const systemServices = [
    { id: 'api', name: 'API Principal', status: 'operational', icon: <Server className="w-8 h-8 text-blue-500" /> },
    { id: 'database', name: 'Base de Datos', status: 'operational', icon: <Database className="w-8 h-8 text-green-500" /> },
    { id: 'geolocation', name: 'Servicio de Geolocalización', status: 'operational', icon: <Wifi className="w-8 h-8 text-purple-500" /> },
    { id: 'notifications', name: 'Servicio de Notificaciones Push', status: 'degraded', icon: <Smartphone className="w-8 h-8 text-yellow-500" /> },
    { id: 'payment_gateway', name: 'Pasarela de Pagos', status: 'operational', icon: <Server className="w-8 h-8 text-red-500" /> },
    { id: 'background_jobs', name: 'Procesos en Segundo Plano', status: 'operational', icon: <Clock className="w-8 h-8 text-indigo-500" /> },
  ];

  const overallStatus = systemServices.some(s => s.status === 'outage') ? 'outage' :
                        systemServices.some(s => s.status === 'degraded') ? 'degraded' : 'operational';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-xl shadow-xl p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-semibold text-slate-800">Salud del Sistema</h2>
        <div className={`flex items-center px-4 py-2 rounded-lg border ${
          overallStatus === 'operational' ? 'bg-green-50 border-green-200' :
          overallStatus === 'degraded' ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <span className={`mr-2 text-sm font-medium ${
            overallStatus === 'operational' ? 'text-green-700' :
            overallStatus === 'degraded' ? 'text-yellow-700' :
            'text-red-700'
          }`}>
            Estado General:
          </span>
          <StatusIndicator status={overallStatus} label="" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemServices.map((service) => (
          <motion.div 
            key={service.id}
            className="bg-slate-50/70 border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: systemServices.indexOf(service) * 0.05, duration: 0.3 }}
          >
            <div className="flex items-center mb-3">
              <div className="p-2 bg-white rounded-full shadow-inner mr-3">
                {service.icon}
              </div>
              <h3 className="text-md font-semibold text-slate-700">{service.name}</h3>
            </div>
            <StatusIndicator status={service.status} label="Estado:" />
            <p className="text-xs text-slate-500 mt-2">Última comprobación: Hace 2 minutos</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Métricas Clave del Sistema (Simulado)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <p className="text-xs text-blue-600 font-medium">Tiempo de Respuesta API (promedio)</p>
            <p className="text-xl font-bold text-blue-700">120 ms</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <p className="text-xs text-green-600 font-medium">Uso de CPU Base de Datos</p>
            <p className="text-xl font-bold text-green-700">35%</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
            <p className="text-xs text-purple-600 font-medium">Tasa de Errores (última hora)</p>
            <p className="text-xl font-bold text-purple-700">0.05%</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-xs text-yellow-600 font-medium">Notificaciones Pendientes</p>
            <p className="text-xl font-bold text-yellow-700">12</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSystemHealthPage;