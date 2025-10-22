import React from 'react';
import { BarChart3, Users, Car, MapPin, DollarSign, FileText, Settings, Bell, Tag, TrendingUp } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const AdminNavTabs = () => {
  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3, path: '/admin/overview' },
    { id: 'users', label: 'Usuarios', icon: Users, path: '/admin/users' },
    { id: 'drivers', label: 'Conductores', icon: Car, path: '/admin/drivers' },
    { id: 'rides', label: 'Viajes', icon: MapPin, path: '/admin/rides' },
    { id: 'payments', label: 'Pagos', icon: DollarSign, path: '/admin/payments' },
    { id: 'reports', label: 'Reportes', icon: FileText, path: '/admin/reports' },
    { id: 'promotions', label: 'Promociones', icon: Tag, path: '/admin/promotions' },
    { id: 'analytics', label: 'Analíticas', icon: TrendingUp, path: '/admin/analytics' },
    { id: 'notifications_admin', label: 'Notificaciones', icon: Bell, path: '/admin/notifications' },
    { id: 'settings_admin', label: 'Configuración', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md mb-6 mx-6 sticky top-[76px] z-30">
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 px-3 py-1 overflow-x-auto">
          {tabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center space-x-2 py-2.5 px-4 rounded-md transition-colors whitespace-nowrap text-sm font-medium
                ${isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AdminNavTabs;