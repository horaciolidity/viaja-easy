import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import PassengerUserMenu from '@/components/passenger/PassengerUserMenu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const PassengerHeader = ({ setSidebarOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-600 dark:text-slate-300"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Abrir menú</span>
          <Menu className="h-6 w-6" />
        </Button>
        
        <div className="hidden md:block">
            <span className="text-xl font-bold text-yellow-500 dark:text-yellow-400">Viaja Fácil</span>
        </div>

        <div className="flex-1 md:hidden" />

        <div className="flex items-center space-x-2">
          <PassengerUserMenu />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 rounded-full"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PassengerHeader;