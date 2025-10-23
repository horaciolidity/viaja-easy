import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useRide } from '@/contexts/RideContext';
import CurrentRideStatusCard from '@/components/passenger/CurrentRideStatusCard';
import {
  Car,
  CalendarDays,
  Timer,
  MapPin,
  PackagePlus,
  Search,
  Users,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import SuspendedAccountNotice from '@/components/common/SuspendedAccountNotice';
import ReferralCard from '@/components/common/ReferralCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { currentRide } = useRide();
  const [searchTerm, setSearchTerm] = useState('');

  const handleNavigation = (path) => navigate(path);
  const handleSearch = () => {
    navigate('/booking', { state: { destinationQuery: searchTerm || '' } });
  };

  if (profile && (profile.accountBlocked || profile.status === 'suspended')) {
    return <SuspendedAccountNotice />;
  }

  const isVerified = profile?.verified;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
          ¡Hola, {profile?.full_name?.split(' ')[0] || 'Pasajero'}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400">¿A dónde vamos hoy?</p>
      </div>

      {/* Aviso de verificación */}
      {!isVerified && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-800 dark:text-yellow-300 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-3" />
            <p>Tu cuenta está pendiente de verificación. Algunas funciones están limitadas.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/upload-documents')}>
            Verificar ahora
          </Button>
        </div>
      )}

      <CurrentRideStatusCard ride={currentRide} />

      {/* Barra de búsqueda */}
      <motion.div
        className="p-4 rounded-2xl shadow-lg bg-white dark:bg-slate-800"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Ingresa tu destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full h-12 pl-12 pr-28 text-md rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary dark:focus:border-sky-500 dark:focus:ring-sky-500"
            disabled={!isVerified}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Button
                    onClick={handleSearch}
                    className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center bg-primary text-white hover:bg-primary/90 dark:bg-sky-500 dark:hover:bg-sky-600"
                    disabled={!isVerified}
                  >
                    <MapPin className="w-4 h-4 mr-1.5" />
                    Ir
                  </Button>
                </div>
              </TooltipTrigger>
              {!isVerified && (
                <TooltipContent>
                  <p>Debes verificar tus documentos para solicitar un viaje.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>

      {/* Envíos y viajes compartidos */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BannerCard
            title="Envíos de Paquetes"
            description="Mandá lo que necesites, rápido y seguro."
            icon={PackagePlus}
            onClick={() => isVerified && navigate('/packages')}
            disabled={!isVerified}
            bgColor="bg-gradient-to-tr from-emerald-400 to-cyan-400"
          />
          <BannerCard
            title="Viajes Compartidos"
            description="Ahorrá compartiendo tu viaje con otros."
            icon={Users}
            onClick={() => isVerified && navigate('/shared-rides-offers')}
            disabled={!isVerified}
            bgColor="bg-gradient-to-tr from-amber-400 to-orange-500"
          />
        </div>
      </section>

      {/* Servicios principales */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
          Planificá tu Viaje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MainServiceCard
            icon={Car}
            title="Viajar Ahora"
            description="Tu transporte inmediato a cualquier punto."
            onClick={() => isVerified && handleNavigation('/booking')}
            highlight
            disabled={!isVerified}
          />
          <MainServiceCard
            icon={CalendarDays}
            title="Agendar Viaje"
            description="Planifica con antelación y asegura tu movilidad."
            onClick={() => isVerified && handleNavigation('/schedule-ride')}
            disabled={!isVerified}
          />
          <MainServiceCard
            icon={Timer}
            title="Viaje por Horas"
            description="Un conductor exclusivo para tus diligencias."
            onClick={() => isVerified && handleNavigation('/hourly-ride')}
            disabled={!isVerified}
          />
        </div>
      </section>

      <section>
        <ReferralCard />
      </section>
    </div>
  );
};

/* ---------------------- Cards ---------------------- */
const BannerCard = ({ title, description, icon: Icon, onClick, bgColor, disabled }) => (
  <motion.div
    className={`relative p-6 rounded-2xl overflow-hidden text-white shadow-lg ${bgColor} ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'
    }`}
    onClick={disabled ? undefined : onClick}
    whileHover={!disabled ? { scale: 1.03, y: -4 } : {}}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <div className="relative z-10">
      <Icon className="w-10 h-10 mb-3 opacity-80" />
      <h3 className="font-bold text-xl">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
      <Button
        variant="secondary"
        className="mt-4 bg-white/20 hover:bg-white/30 text-white rounded-full"
        disabled={disabled}
      >
        Ingresar <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
    <Icon className="absolute -right-5 -bottom-5 w-28 h-28 text-white/10" />
  </motion.div>
);

const MainServiceCard = ({ icon: Icon, title, description, onClick, highlight, disabled }) => (
  <motion.div
    onClick={disabled ? undefined : onClick}
    className={`p-6 rounded-2xl shadow-lg transition-all transform ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1.5'
    } ${highlight ? 'shadow-xl' : 'bg-white dark:bg-slate-800'}`}
    style={{
      background: highlight
        ? 'linear-gradient(145deg, hsl(220, 80%, 60%) 0%, hsl(240, 90%, 70%) 100%)'
        : '',
    }}
    whileHover={!disabled ? { scale: 1.03 } : {}}
    whileTap={!disabled ? { scale: 0.98 } : {}}
  >
    <div
      className={`w-14 h-14 mb-4 rounded-xl flex items-center justify-center shadow-md ${
        highlight ? 'bg-white/20' : 'bg-primary dark:bg-sky-500'
      }`}
    >
      <Icon className="w-7 h-7 text-white" />
    </div>
    <h3
      className={`text-lg font-semibold mb-1 ${
        highlight ? 'text-white' : 'text-slate-800 dark:text-slate-100'
      }`}
    >
      {title}
    </h3>
    <p
      className={`text-xs ${
        highlight ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {description}
    </p>
  </motion.div>
);

export default PassengerDashboard;
