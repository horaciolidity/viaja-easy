import React from 'react';
    import { NavLink, useNavigate } from 'react-router-dom';
    import {
      LayoutDashboard,
      DollarSign,
      Wallet,
      CreditCard,
      Car,
      History,
      CalendarClock,
      Clock,
      User,
      Bell,
      LifeBuoy,
      LogOut,
      Users,
      X,
    } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { motion, AnimatePresence } from 'framer-motion';

    const DriverSidebar = ({ isOpen, setIsOpen }) => {
      const { logout, profile } = useAuth();
      const navigate = useNavigate();

      const handleLogout = async () => {
        await logout();
        navigate('/login');
      };

      const menuItems = [
        { icon: LayoutDashboard, label: 'Panel Principal', path: '/driver', exact: true },
        { icon: DollarSign, label: 'Mis Ganancias', path: '/driver/earnings' },
        { icon: Wallet, label: 'Mi Billetera', path: '/driver/wallet' },
        { icon: CreditCard, label: 'Config. Pagos', path: '/driver/payment-settings' },
        { icon: Car, label: 'Mi Vehículo', path: '/driver/vehicle' },
        { icon: History, label: 'Historial Viajes', path: '/driver/history' },
        { icon: Users, label: 'Viajes Compartidos', path: '/driver/shared-rides' },
        { icon: CalendarClock, label: 'Viajes Programados', path: '/driver/scheduled-rides' },
        { icon: Clock, label: 'Reservas por Hora', path: '/driver/hourly-rides' },
        { icon: User, label: 'Mi Perfil', path: '/driver/profile' },
        { icon: Bell, label: 'Notificaciones', path: '/driver/notifications' },
        { icon: LifeBuoy, label: 'Asistencia', path: '/driver/assistance' },
      ];

      const SidebarContent = () => (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-20 border-b px-4">
            <div className="flex items-center space-x-2">
              <img src="https://horizons-cdn.hostinger.com/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/3a09a949b47cc959adb2761d2bc44da5.png" alt="ViajaFacil Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-gray-800">ViajaFácil</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="mt-6">
              <ul>
                {menuItems.map((item) => (
                  <li key={item.label} className="px-4 mb-2">
                    <NavLink
                      to={item.path}
                      end={item.exact}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          isActive
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="p-4 border-t">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      );

      return (
        <>
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
            <SidebarContent />
          </aside>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 z-40 md:hidden"
                  onClick={() => setIsOpen(false)}
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed top-0 left-0 h-full w-64 bg-white z-50 md:hidden"
                >
                  <SidebarContent />
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </>
      );
    };

    export default DriverSidebar;