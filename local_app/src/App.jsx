import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/customSupabaseClient';

/* ---------------- Contextos ---------------- */
import { NetworkStatusProvider } from '@/contexts/NetworkStatusContext';
import { AudioProvider } from '@/contexts/AudioContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { HourlyRideProvider } from '@/contexts/HourlyRideContext';
import { ScheduledRideProvider } from '@/contexts/ScheduledRideContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { RideProvider } from '@/contexts/RideContext';

/* ---------------- Componentes globales ---------------- */
import NetworkStatusBanner from '@/components/NetworkStatusBanner';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import MaintenanceModePage from '@/pages/MaintenanceModePage.jsx';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';
import AdminSidebar from '@/components/admin/AdminSidebar';

/* ---------------- Layouts ---------------- */
import DriverLayout from '@/layouts/DriverLayout';
import PassengerLayout from '@/layouts/PassengerLayout';

/* ---------------- Páginas principales ---------------- */
import LandingPage from '@/pages/LandingPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import VerificationPage from '@/pages/VerificationPage.jsx';
import PassengerDashboard from '@/pages/PassengerDashboard.jsx';
import DriverDashboard from '@/pages/driver/DriverDashboard.jsx';
import RideBookingPage from '@/pages/RideBookingPage.jsx';
import ChatPage from '@/pages/ChatPage.jsx';
import PaymentPage from '@/pages/PaymentPage.jsx';
import ProfilePage from '@/pages/ProfilePage.jsx';
import RideTracking from '@/pages/RideTracking.jsx';
import DocumentUploadPage from '@/pages/DocumentUploadPage.jsx';
import WalletPage from '@/pages/WalletPage.jsx';
import MercadoPagoCallbackPage from '@/pages/MercadoPagoCallbackPage.jsx';
import KycDniSelfie from '@/components/KycDniSelfie.jsx';
import FaceVerifyForm from '@/components/FaceVerifyForm.jsx';

/* ---------------- Páginas de funcionalidades ---------------- */
import SharedRidePage from '@/pages/appfeatures/SharedRidePage.jsx';
import ScheduleRidePage from '@/pages/appfeatures/ScheduleRidePage.jsx';
import HourlyRidePage from '@/pages/appfeatures/HourlyRidePage.jsx';
import ServicesPage from '@/pages/appfeatures/ServicesPage.jsx';
import PackageDeliveryPage from '@/pages/appfeatures/PackageDeliveryPage.jsx';
import SharedRidesOffersPage from '@/pages/appfeatures/SharedRidesOffersPage.jsx';
import RideDetailPage from '@/pages/appfeatures/RideDetailPage.jsx';
import RideHistoryPage from '@/pages/appfeatures/RideHistoryPage.jsx';
import PackageTracking from '@/pages/PackageTracking.jsx';

/* ---------------- Páginas de administración ---------------- */
import AdminOverviewTab from '@/components/admin/AdminOverviewTab.jsx';
import AdminUsersPage from '@/pages/admin/AdminUsersPage.jsx';
import AdminDriversPage from '@/pages/admin/AdminDriversPage.jsx';
import AdminPassengersPage from '@/pages/admin/AdminPassengersPage.jsx';
import AdminRidesPage from '@/pages/admin/AdminRidesPage.jsx';
import AdminLiveRidesPage from '@/pages/admin/AdminLiveRidesPage.jsx';
import AdminScheduledRidesPage from '@/pages/admin/AdminScheduledRidesPage.jsx';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage.jsx';
import AdminDriverPaymentsPage from '@/pages/admin/AdminDriverPaymentsPage.jsx';
import AdminWithdrawalsPage from '@/pages/admin/AdminWithdrawalsPage.jsx';
import AdminReportsPage from '@/pages/admin/AdminReportsPage.jsx';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage.jsx';
import AdminNotificationsPage from '@/pages/admin/AdminNotificationsPage.jsx';
import AdminPromotionsPage from '@/pages/admin/AdminPromotionsPage.jsx';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage.jsx';
import AdminVehicleTypesPage from '@/pages/admin/AdminVehicleTypesPage.jsx';
import AdminTariffsPage from '@/pages/admin/AdminTariffsPage.jsx';
import AdminPricingZonesPage from '@/pages/admin/AdminPricingZonesPage.jsx';
import AdminSurgePricingPage from '@/pages/admin/AdminSurgePricingPage.jsx';
import AdminDriverRequirementsPage from '@/pages/admin/AdminDriverRequirementsPage.jsx';
import AdminPassengerRulesPage from '@/pages/admin/AdminPassengerRulesPage.jsx';
import AdminSystemHealthPage from '@/pages/admin/AdminSystemHealthPage.jsx';
import AdminApiKeysPage from '@/pages/admin/AdminApiKeysPage.jsx';
import AdminLegalDocsPage from '@/pages/admin/AdminLegalDocsPage.jsx';
import AdminAppVersionsPage from '@/pages/admin/AdminAppVersionsPage.jsx';
import AdminAssistancePage from '@/pages/admin/AdminAssistancePage.jsx';
import UserDocumentsAdminPage from '@/pages/admin/UserDocumentsAdminPage.jsx';
import AdminFacialVerificationPage from '@/pages/admin/AdminFacialVerificationPage.jsx';
import AdminDebtsPage from '@/pages/admin/AdminDebtsPage.jsx';

/* ---------------- Páginas de conductor ---------------- */
import DriverVehiclePage from '@/pages/driver/DriverVehiclePage.jsx';
import DriverEarningsPage from '@/pages/driver/DriverEarningsPage.jsx';
import DriverHistoryPage from '@/pages/driver/DriverHistoryPage.jsx';
import DriverPaymentSettingsPage from '@/pages/driver/DriverPaymentSettingsPage.jsx';
import DriverHourlyRidesPage from '@/pages/driver/DriverHourlyRidesPage.jsx';
import DriverScheduledRidesPage from '@/pages/driver/DriverScheduledRidesPage.jsx';
import DriverAssistancePage from '@/pages/driver/DriverAssistancePage.jsx';

/* ---------------- Páginas de pasajero ---------------- */
import PassengerMyRidesPage from '@/pages/passenger/PassengerMyRidesPage.jsx';
import PassengerAssistancePage from '@/pages/passenger/PassengerAssistancePage.jsx';
import PassengerNotificationsPage from '@/pages/passenger/PassengerNotificationsPage.jsx';

/* ---------------- Otras páginas ---------------- */
import GeneralSettingsPage from '@/pages/SettingsPage.jsx';
import NotificationsPage from '@/pages/NotificationsPage.jsx';

/* -------------------------------------------------------------------------- */
/* 🧩 Rutas protegidas y auxiliares */
/* -------------------------------------------------------------------------- */

const ProtectedRoute = ({ children, allowedUserTypes }) => {
  const { user, profile, loading, isImpersonating } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();

  if (loading || settingsLoading) return <AppLoadingScreen />;
  if (!user || !profile) return <Navigate to="/login" replace />;

  if (settings.appSettings.maintenance_mode && profile.user_type !== 'admin' && !isImpersonating)
    return <Navigate to="/maintenance" replace />;

  const userType = profile.user_type;
  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
    if (userType === 'admin' && !isImpersonating) return <Navigate to="/admin" replace />;
    if (userType === 'driver') return <Navigate to="/driver" replace />;
    if (userType === 'passenger') return <Navigate to="/passenger" replace />;
    return <Navigate to="/" replace />;
  }

  const allowedPaths = ['/upload-documents', '/passenger', '/driver', '/driver/shared-rides'];
  if (!profile.verified && profile.user_type !== 'admin' && !allowedPaths.includes(window.location.pathname))
    return <Navigate to="/upload-documents" replace />;

  return children;
};

const AuthenticatedRedirect = ({ children }) => {
  const { user, profile, loading, isImpersonating } = useAuth();
  if (loading) return <AppLoadingScreen />;

  if (user && profile) {
    if (profile.user_type === 'passenger') return <Navigate to="/passenger" replace />;
    if (profile.user_type === 'driver') return <Navigate to="/driver" replace />;
    if (profile.user_type === 'admin' && !isImpersonating) return <Navigate to="/admin" replace />;
  }

  return children;
};

function AdminShell() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden p-6">
        <Outlet />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 🧭 Rutas principales */
/* -------------------------------------------------------------------------- */
const AppRoutes = () => {
  const { user, profile, isImpersonating } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();

  useEffect(() => {
    if (!user || profile?.user_type !== 'admin' || isImpersonating) return;

    const interval = setInterval(async () => {
      if (!navigator.onLine) return;
      try {
        const { error } = await supabase.rpc('cancel_stale_rides');
        if (error && !error.message.includes('Failed to fetch'))
          console.error('Error ejecutando cancel_stale_rides:', error.message);
      } catch {}
    }, 60000);

    return () => clearInterval(interval);
  }, [user, profile, isImpersonating]);

  if (settingsLoading) return <AppLoadingScreen />;

  if (settings.appSettings.maintenance_mode && profile?.user_type !== 'admin' && !isImpersonating) {
    return (
      <Routes>
        <Route path="/maintenance" element={<MaintenanceModePage />} />
        <Route path="*" element={<Navigate to="/maintenance" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <NetworkStatusBanner />
      {isImpersonating && <ImpersonationBanner />}
      <Routes>
        <Route path="/" element={<AuthenticatedRedirect><LandingPage /></AuthenticatedRedirect>} />
        <Route path="/login" element={<AuthenticatedRedirect><LoginPage /></AuthenticatedRedirect>} />
        <Route path="/register" element={<AuthenticatedRedirect><RegisterPage /></AuthenticatedRedirect>} />
        <Route path="/verification" element={<VerificationPage />} />

        <Route path="/mercadopago/callback" element={<ProtectedRoute allowedUserTypes={['passenger', 'driver']}><MercadoPagoCallbackPage /></ProtectedRoute>} />
        <Route path="/kyc" element={<ProtectedRoute allowedUserTypes={['passenger', 'driver', 'admin']}><KycDniSelfie /></ProtectedRoute>} />
        <Route path="/face-verify" element={<ProtectedRoute allowedUserTypes={['passenger', 'driver', 'admin']}><FaceVerifyForm /></ProtectedRoute>} />
        <Route path="/upload-documents" element={<ProtectedRoute allowedUserTypes={['passenger', 'driver']}><DocumentUploadPage /></ProtectedRoute>} />

        {/* Pasajero */}
        <Route path="/passenger" element={<ProtectedRoute allowedUserTypes={['passenger']}><PassengerLayout /></ProtectedRoute>}>
          <Route index element={<PassengerDashboard />} />
          <Route path="my-rides" element={<PassengerMyRidesPage />} />
          <Route path="shared-rides" element={<SharedRidesOffersPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="payment-methods" element={<PaymentPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<GeneralSettingsPage />} />
          <Route path="notifications" element={<PassengerNotificationsPage />} />
          <Route path="assistance" element={<PassengerAssistancePage />} />
        </Route>

        {/* Conductor */}
        <Route path="/driver" element={<ProtectedRoute allowedUserTypes={['driver']}><DriverLayout /></ProtectedRoute>}>
          <Route index element={<DriverDashboard />} />
          <Route path="shared-rides" element={<SharedRidePage />} />
          <Route path="earnings" element={<DriverEarningsPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="payment-methods" element={<PaymentPage />} />
          <Route path="payment-settings" element={<DriverPaymentSettingsPage />} />
          <Route path="vehicle" element={<DriverVehiclePage />} />
          <Route path="history" element={<DriverHistoryPage />} />
          <Route path="hourly-rides" element={<DriverHourlyRidesPage />} />
          <Route path="scheduled-rides" element={<DriverScheduledRidesPage />} />
          <Route path="settings" element={<GeneralSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="assistance" element={<DriverAssistancePage />} />
        </Route>

        {/* Generales */}
        <Route path="/tracking/:rideId" element={<ProtectedRoute allowedUserTypes={['passenger', 'driver']}><RideTracking /></ProtectedRoute>} />
        <Route path="/tracking/package/:packageId" element={<ProtectedRoute allowedUserTypes={['passenger', 'driver']}><PackageTracking /></ProtectedRoute>} />
        <Route path="/chat/:rideId" element={<ProtectedRoute allowedUserTypes={['passenger', 'driver']}><ChatPage /></ProtectedRoute>} />
        <Route path="/ride/:type/:id" element={<ProtectedRoute allowedUserTypes={['passenger', 'driver', 'admin']}><RideDetailPage /></ProtectedRoute>} />
        <Route path="/ride-history/:type/:id" element={<ProtectedRoute allowedUserTypes={['passenger', 'driver', 'admin']}><RideHistoryPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin" element={<ProtectedRoute allowedUserTypes={['admin']}><AdminShell /></ProtectedRoute>} >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverviewTab />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="passengers" element={<AdminPassengersPage />} />
          <Route path="drivers" element={<AdminDriversPage />} />
          <Route path="user-documents" element={<UserDocumentsAdminPage />} />
          <Route path="facial-verification" element={<AdminFacialVerificationPage />} />
          <Route path="rides" element={<AdminRidesPage />} />
          <Route path="scheduled-rides" element={<AdminScheduledRidesPage />} />
          <Route path="live-rides" element={<AdminLiveRidesPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="driver-payments" element={<AdminDriverPaymentsPage />} />
          <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="debts" element={<AdminDebtsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="vehicle-types" element={<AdminVehicleTypesPage />} />
          <Route path="tariffs" element={<AdminTariffsPage />} />
          <Route path="pricing-zones" element={<AdminPricingZonesPage />} />
          <Route path="surge-pricing" element={<AdminSurgePricingPage />} />
          <Route path="driver-requirements" element={<AdminDriverRequirementsPage />} />
          <Route path="passenger-rules" element={<AdminPassengerRulesPage />} />
          <Route path="system-health" element={<AdminSystemHealthPage />} />
          <Route path="api-keys" element={<AdminApiKeysPage />} />
          <Route path="legal-docs" element={<AdminLegalDocsPage />} />
          <Route path="app-versions" element={<AdminAppVersionsPage />} />
          <Route path="assistance" element={<AdminAssistancePage />} />
        </Route>
      </Routes>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* 🚀 App principal con Providers en orden optimizado */
/* -------------------------------------------------------------------------- */
const App = () => (
  <>
    <Helmet>
      <title>ViajaFácil</title>
      <meta
        name="description"
        content="Tu solución de movilidad urbana. Viajes rápidos, seguros y al mejor precio."
      />
    </Helmet>

    <Router>
      <NetworkStatusProvider>
        <AudioProvider>
          <AuthProvider>
            <SettingsProvider>
              <NotificationProvider>
                <LocationProvider>
                  <PaymentProvider>
                    <HourlyRideProvider>
                      <ScheduledRideProvider>
                        <ChatProvider>
                          <RideProvider>
                            <AppRoutes />
                            <Toaster />
                          </RideProvider>
                        </ChatProvider>
                      </ScheduledRideProvider>
                    </HourlyRideProvider>
                  </PaymentProvider>
                </LocationProvider>
              </NotificationProvider>
            </SettingsProvider>
          </AuthProvider>
        </AudioProvider>
      </NetworkStatusProvider>
    </Router>
  </>
);

export default App;
