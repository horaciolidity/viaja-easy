import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, CreditCard, Clock, Shield, Bell, LifeBuoy, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/passenger', icon: Home, label: 'Inicio' },
  { href: '/passenger/my-rides', icon: Clock, label: 'Mis Viajes' },
  { href: '/passenger/wallet', icon: CreditCard, label: 'Billetera' },
  { href: '/passenger/notifications', icon: Bell, label: 'Notificaciones' },
  { href: '/passenger/profile', icon: User, label: 'Mi Perfil' },
  { href: '/passenger/assistance', icon: LifeBuoy, label: 'Ayuda' },
];

const SidebarLink = ({ to, icon: Icon, label, currentPath, setSidebarOpen }) => (
  <Link
    to={to}
    onClick={() => setSidebarOpen(false)}
    className={`flex items-center p-3 rounded-lg transition-colors text-base font-medium ${
      currentPath === to 
        ? 'bg-blue-100 text-blue-700 dark:bg-sky-800 dark:text-sky-100'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
    }`}
  >
    <Icon className="w-6 h-6 mr-4" />
    <span>{label}</span>
  </Link>
);

const PassengerSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { user, profile, logout } = useAuth();

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <div
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-xl z-40 transform transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <Link to="/passenger" className="text-2xl font-bold text-blue-600 dark:text-sky-400">
              ViajaFacil
            </Link>
          </div>

          <div className="px-6 mb-8">
            <div className="flex items-center">
              <img
                src={profile?.avatar_url || '/images/default-avatar.png'}
                alt="Avatar"
                className="w-14 h-14 rounded-full object-cover mr-4 border-2 border-blue-200 dark:border-sky-700"
              />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{profile?.full_name || 'Pasajero'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pasajero</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-6 space-y-2">
            {navLinks.map((link) => (
              <SidebarLink 
                key={link.href} 
                to={link.href} 
                icon={link.icon} 
                label={link.label} 
                currentPath={location.pathname} 
                setSidebarOpen={setSidebarOpen}
              />
            ))}
          </nav>
          
          <div className="px-6 py-8">
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:bg-red-100 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-800/20 dark:hover:text-red-400"
            >
              <LogOut className="w-6 h-6 mr-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PassengerSidebar;