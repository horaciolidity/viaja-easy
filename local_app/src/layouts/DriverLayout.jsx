import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DriverSidebar from '@/components/driver/DriverSidebar';
import DriverSideMenu from '@/components/driver/DriverSideMenu';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

const DriverLayout = () => {
  const { user, profile, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) return <AppLoadingScreen />;

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600 font-medium">
        Error: No se pudo cargar el perfil del conductor.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DriverSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header móvil */}
        <header className="md:hidden bg-white p-2 text-gray-800 flex justify-start items-center border-b shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-grow text-center">
            <img
              src="https://horizons-cdn.hostinger.com/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/3a09a949b47cc959adb2761d2bc44da5.png"
              alt="Logo de ViajaFácil"
              className="h-8 w-auto inline-block"
            />
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
          <DriverSideMenu />
        </main>
      </div>
    </div>
  );
};

export default DriverLayout;
