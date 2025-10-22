
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import { useLocation } from '@/contexts/LocationContext';
import { driverLocationService } from '@/services/driverLocationService';
import { toast } from '@/components/ui/use-toast';
import DriverHeader from '@/components/driver/DriverHeader';
import DriverQuickActions from '@/components/driver/DriverQuickActions';
import DriverMap from '@/components/driver/DriverMap';
import SuspendedAccountNotice from '@/components/common/SuspendedAccountNotice';
import PerformanceCard from '@/components/driver/PerformanceCard';
import ScheduledRideReminder from '@/components/driver/ScheduledRideReminder';
import DriverStats from '@/components/driver/DriverStats';
import DriverVerificationBanner from '@/components/driver/DriverVerificationBanner';
import { useDriverVerification } from '@/hooks/useDriverVerification';
import { useFaceVerificationClient } from '@/hooks/useFaceVerificationClient';
import FaceVerifyModal from '@/components/FaceVerifyModal';
import OngoingRideBanner from '@/components/driver/OngoingRideBanner';
import RideCarousel from '@/components/driver/RideCarousel';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { availableRides, loadAvailableRides, loading: loadingRides, currentRide, acceptRide, setCurrentRide, dismissRide } = useRide();
  const { data: driverVerificationData, loading: driverVerificationLoading } = useDriverVerification();
  
  const { startLocationTracking, stopLocationTracking, isTracking, currentLocation } = useLocation();
  const { pendingRequest, isModalOpen, onModalOpen, onModalClose } = useFaceVerificationClient();
  
  const [isOnline, setIsOnline] = useState(profile?.status === 'available');
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(null);

  const checkLocationPermission = useCallback(async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermissionGranted(permission.state === 'granted');
      permission.onchange = () => {
        const hasPermission = permission.state === 'granted';
        setLocationPermissionGranted(hasPermission);
        if (!hasPermission && isOnline) handleGoOffline();
      };
      return permission.state === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }, [isOnline]);

  useEffect(() => {
    checkLocationPermission();
  }, [checkLocationPermission]);

  useEffect(() => {
    setIsOnline(profile?.status === 'available');

    if (profile?.status === 'available' && user?.id && locationPermissionGranted) {
      if (!isTracking) startLocationTracking();
      driverLocationService.startTracking(user.id);
    } else {
      if (isTracking) stopLocationTracking();
      driverLocationService.stopTracking();
    }

    return () => driverLocationService.stopTracking();
  }, [profile?.status, user?.id, locationPermissionGranted, isTracking, startLocationTracking, stopLocationTracking]);

  const handleGoOnline = async () => {
    if(!profile?.verified){
      toast({ title: "Cuenta no verificada", description: "Debes verificar tu cuenta para poder conectarte.", variant: "destructive" });
      return;
    }
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      toast({ title: "Permiso de Ubicación Requerido", description: "Necesitas habilitar la ubicación para conectarte.", variant: "destructive" });
      return;
    }
    try {
      await updateProfile({ status: 'available' });
      toast({ title: "¡Conectado!", description: "Ahora estás disponible para recibir viajes." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo conectar. Intenta de nuevo.", variant: "destructive" });
    }
  };

  const handleGoOffline = async () => {
    try {
      await updateProfile({ status: 'offline' });
      toast({ title: "Desconectado", description: "Ya no recibirás nuevas solicitudes de viaje." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo desconectar. Intenta de nuevo.", variant: "destructive" });
    }
  };

  const handleAcceptRide = async (ride) => {
    if (!user || isAccepting || !profile?.verified) return;
    setIsAccepting(ride.id);

    try {
      const acceptedRide = await acceptRide(ride);
      if (acceptedRide) {
        setCurrentRide(acceptedRide);
        const trackingPath = acceptedRide.ride_type === 'package' ? `/tracking/package/${acceptedRide.id}` : `/tracking/${acceptedRide.id}`;
        navigate(trackingPath, { state: { rideType: acceptedRide.ride_type || 'now' } });
      } else {
        throw new Error('No se recibió el viaje aceptado.');
      }
    } catch (error) {
      console.error('Error al aceptar viaje:', error);
      toast({
        title: "Error al aceptar",
        description: error.message || "Ocurrió un error inesperado al aceptar el viaje.",
        variant: "destructive"
      });
      loadAvailableRides();
    } finally {
      setIsAccepting(null);
    }
  };
  
  const handleRefreshRides = () => {
    if (!profile?.verified) {
      toast({ title: "Cuenta no verificada", description: "Verifica tu cuenta para ver viajes.", variant: "destructive" });
      return;
    }
    loadAvailableRides();
    toast({ title: "Actualizando", description: "Buscando nuevos viajes disponibles..." });
  };

  const mainDashboardRides = useMemo(() => {
    return (availableRides || []).filter(r => r.ride_type === 'now' || r.ride_type === 'package' || r.ride_type === 'pending');
  }, [availableRides]);
  
  if (!user || !profile || driverVerificationLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (profile.accountBlocked || profile.status === 'suspended') {
    return <SuspendedAccountNotice />;
  }

  const isVerified = driverVerificationData?.is_verified;

  return (
    <div className="relative min-h-screen bg-slate-100">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="p-4 md:p-6 space-y-6 flex-1">
        <DriverHeader driverName={profile.full_name} isOnline={isOnline} hasActiveRide={!!currentRide} />
        
        {currentRide && <OngoingRideBanner ride={currentRide} />}

        <DriverVerificationBanner />

        {pendingRequest && (
          <FaceVerifyModal isOpen={isModalOpen} onOpen={onModalOpen} onClose={onModalClose} request={pendingRequest} />
        )}

        <DriverStats isOnline={isOnline} availableRidesCount={availableRides.length} />

        <DriverQuickActions isOnline={isOnline} onGoOnline={handleGoOnline} onGoOffline={handleGoOffline} onRefreshRides={handleRefreshRides} hasLocationPermission={locationPermissionGranted} loading={loadingRides || !!isAccepting} isVerified={isVerified} />
        
        {isVerified ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <RideCarousel 
                rides={mainDashboardRides} 
                onAccept={handleAcceptRide} 
                onReject={dismissRide}
                isLoading={loadingRides || !!isAccepting}
                isOnline={isOnline}
               />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <ScheduledRideReminder />
              <PerformanceCard stats={profile.performance_stats} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Verifica tu cuenta</h3>
            <p className="text-sm text-gray-500 mt-1">Una vez que tus documentos sean aprobados, podrás ver y aceptar viajes.</p>
          </div>
        )}
        
        <div className="h-96 md:h-[500px] w-full rounded-lg overflow-hidden shadow-lg">
          <DriverMap currentLocation={currentLocation} availableRides={availableRides} isOnline={isOnline} />
        </div>
      </motion.div>
    </div>
  );
};

export default DriverDashboard;
