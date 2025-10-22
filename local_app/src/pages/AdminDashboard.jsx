import React, { useState, useEffect } from 'react';
    import { useNavigate, Outlet, useLocation, Navigate } from 'react-router-dom';
    import { useAuth } from '@/contexts/AuthContext';
    import AdminHeader from '@/components/admin/AdminHeader';
    import AdminSidebar from '@/components/admin/AdminSidebar';
    import AdminStatsCards from '@/components/admin/AdminStatsCards';

    const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/a319dd2f382da4be3c0fac5ce0d849c5.png";

    const AdminDashboard = () => {
      const navigate = useNavigate();
      const location = useLocation();
      const { user, logout, isAdmin, loading: authLoading } = useAuth(); 
      const [isSidebarOpen, setSidebarOpen] = useState(false);
      
      const [stats, setStats] = useState({
        totalUsers: 0,
        activeDrivers: 0,
        totalRides: 0,
        revenue: 0,
        avgRating: 0
      });

      useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
          navigate('/login', { replace: true });
        }
        
        const mockStats = {
          totalUsers: 15420,
          activeDrivers: 1250,
          totalRides: 8930,
          revenue: 12543050.00, 
          avgRating: 4.7
        };
        setStats(mockStats);
      }, [user, isAdmin, navigate, authLoading]);

      const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
      };
      
      const getCurrentPageTitle = () => {
        const path = location.pathname;
        if (path.endsWith('/admin') || path.endsWith('/admin/overview')) return 'Resumen General';
        if (path.includes('/users')) return 'Gestión de Usuarios';
        if (path.includes('/drivers')) return 'Gestión de Conductores';
        if (path.includes('/rides') && !path.includes('/live-rides')) return 'Gestión de Viajes';
        if (path.includes('/live-rides')) return 'Viajes en Vivo';
        if (path.includes('/payments') && !path.includes('/driver-payments')) return 'Gestión de Pagos';
        if (path.includes('/driver-payments')) return 'Pagos a Conductores';
        if (path.includes('/debts')) return 'Control de Deudas';
        if (path.includes('/reports')) return 'Reportes';
        if (path.includes('/settings')) return 'Configuración General';
        if (path.includes('/notifications')) return 'Notificaciones Push';
        if (path.includes('/support')) return 'Soporte y Tickets';
        if (path.includes('/promotions')) return 'Promociones y Descuentos';
        if (path.includes('/analytics')) return 'Analíticas de Plataforma';
        if (path.includes('/vehicle-types')) return 'Tipos de Vehículo';
        if (path.includes('/pricing-zones')) return 'Zonas de Precios';
        if (path.includes('/surge-pricing')) return 'Tarifas Dinámicas (Surge)';
        if (path.includes('/driver-requirements')) return 'Requisitos para Conductores';
        if (path.includes('/passenger-rules')) return 'Reglas para Pasajeros';
        if (path.includes('/system-health')) return 'Salud del Sistema';
        if (path.includes('/api-keys')) return 'Gestión de Claves API';
        if (path.includes('/legal-docs')) return 'Documentos Legales';
        if (path.includes('/app-versions')) return 'Versiones de Aplicación';
        return 'Panel de Administración';
      };

      if (authLoading) {
        return <div className="flex justify-center items-center min-h-screen bg-slate-900 text-white text-xl">Verificando Acceso...</div>;
      }

      if (!user || !isAdmin) {
         return <Navigate to="/login" replace />;
      }

      const isOverviewPage = location.pathname === '/admin' || location.pathname === '/admin/overview';

      return (
        <div className="min-h-screen bg-slate-100 flex">
          <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
            <AdminSidebar 
              user={user} 
              onLogout={handleLogout}
            />
          </div>
          
          <AdminSidebar 
            user={user} 
            isOpen={isSidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            onLogout={handleLogout}
            isMobile
          />

          <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out lg:ml-72">
            <AdminHeader 
              user={user} 
              onMenuClick={() => setSidebarOpen(true)} 
              pageTitle={getCurrentPageTitle()}
              onLogout={handleLogout}
            />
            
            {isOverviewPage && <AdminStatsCards stats={stats} />}
            
            <main className="flex-grow p-6">
              <Outlet />
            </main>
          </div>
        </div>
      );
    };

    export default AdminDashboard;