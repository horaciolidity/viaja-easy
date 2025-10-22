import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, Bell, User, DollarSign, Car, Settings, Clock, Package as PackageIcon, Users } from 'lucide-react';

const iconComponents = {
  Home,
  Compass,
  Bell,
  User,
  DollarSign,
  Car,
  Settings,
  Clock,
  PackageIcon,
  Users
};

const navItems = {
  passenger: [
    { href: '/passenger', icon: 'Home', label: 'Inicio' },
    { href: '/services', icon: 'Compass', label: 'Servicios' },
    { href: '/shared-ride', icon: 'Users', label: 'Compartir' },
    { href: '/passenger/notifications', icon: 'Bell', label: 'Alertas' },
    { href: '/passenger/profile', icon: 'User', label: 'Perfil' },
  ],
  driver: [
    { href: '/driver', icon: 'Home', label: 'Inicio' },
    { href: '/shared-ride', icon: 'Users', label: 'Ofrecer' },
    { href: '/driver/earnings', icon: 'DollarSign', label: 'Ganancias' },
    { href: '/driver/vehicle', icon: 'Car', label: 'Vehículo' },
    { href: '/driver/settings', icon: 'Settings', label: 'Ajustes' },
  ],
  admin: [
    { href: '/admin/overview', icon: 'Home', label: 'Resumen' },
    { href: '/admin/users', icon: 'Users', label: 'Usuarios' },
    { href: '/admin/rides', icon: 'Car', label: 'Viajes' },
    { href: '/admin/payments', icon: 'DollarSign', label: 'Pagos' },
    { href: '/admin/settings', icon: 'Settings', label: 'Ajustes' },
  ]
};


const BottomNavBar = ({ userType = 'passenger' }) => {
  const location = useLocation();
  const items = navItems[userType] || navItems.passenger;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.06)] md:hidden z-40">
      <div className="flex justify-around items-center h-full">
        {items.map((item) => {
          const Icon = iconComponents[item.icon];
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              to={item.href}
              key={item.label}
              className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-blue-600 transition-colors duration-200"
            >
              <div className="relative">
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-blue-600' : ''}`} />
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-blue-600 rounded-full"
                  />
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : ''}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavBar;