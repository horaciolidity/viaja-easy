import React, { useState } from 'react';
    import { Outlet } from 'react-router-dom';
    import PassengerSidebar from '@/components/passenger/PassengerSidebar';
    import { useAuth } from '@/contexts/AuthContext';
    import AppLoadingScreen from '@/components/AppLoadingScreen';
    import { Menu } from 'lucide-react';
    import { Button } from '@/components/ui/button';

    const PassengerLayout = () => {
        const { user, profile, loading } = useAuth();
        const [isSidebarOpen, setIsSidebarOpen] = useState(false);

        if (loading) {
            return <AppLoadingScreen />;
        }

        if (!user || !profile) {
            return <div>Error: No se pudo cargar el perfil del pasajero.</div>;
        }

        return (
            <div className="flex h-screen bg-gray-100">
                <PassengerSidebar 
                    sidebarOpen={isSidebarOpen} 
                    setSidebarOpen={setIsSidebarOpen} 
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="md:hidden bg-white p-2 text-gray-800 flex justify-start items-center border-b">
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                    </header>
                    <main className="flex-1 overflow-x-hidden overflow-y-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        );
    };

    export default PassengerLayout;