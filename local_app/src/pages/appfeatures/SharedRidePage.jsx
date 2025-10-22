import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { ArrowLeft, Users, AlertCircle } from 'lucide-react';
    import SharedRideTabs from '@/components/shared-ride/SharedRideTabs';
    import HelpButton from '@/components/common/HelpButton';
    import GuidedTour from '@/components/common/GuidedTour';

    const SharedRidePage = () => {
      const navigate = useNavigate();
      const { profile } = useAuth();
      const [runTour, setRunTour] = useState(false);

      const handleBackNavigation = () => {
        navigate('/driver');
      };

      const tourSteps = [
        {
          target: '#publish-ride-button',
          content: 'Desde aquí podés publicar un nuevo viaje para que otros se sumen.',
          disableBeacon: true,
        },
        {
          target: '#driver-ride-card',
          content: 'Esta es una tarjeta de uno de tus viajes. Podés ver el destino, la fecha y el estado.',
        },
        {
          target: '#reservations-list',
          content: 'Aquí verás las reservas de los pasajeros. ¡Podés confirmarlas o rechazarlas con los botones!',
        },
      ];

      return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
          <GuidedTour
            run={runTour}
            steps={tourSteps}
            onTourEnd={() => setRunTour(false)}
          />
          <header className="passenger-dashboard-header sticky top-0 z-10 py-4 px-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handleBackNavigation} className="mr-2 text-white hover:bg-white/20 rounded-full">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Viajes Compartidos</span>
              </h1>
            </div>
          </header>

          <main className="flex-grow p-4 space-y-6 overflow-y-auto pb-24">
            {!profile?.verified && (
                <div className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-3" />
                    <p>Tu cuenta debe ser verificada para poder ofrecer viajes.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/upload-documents')}>
                    Completar Documentación
                  </Button>
                </div>
              )}
            <SharedRideTabs profile={profile} />
          </main>
          
          <HelpButton onClick={() => setRunTour(true)} />
          
        </div>
      );
    };

    export default SharedRidePage;