import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Car, CalendarClock, Hourglass, MapPin, PackageSearch, Search, Users, Route as RouteIcon, Sparkles, ShieldCheck, LogOut } from 'lucide-react';
    import LocationInput from '@/components/common/LocationInput';
    import { toast } from '@/components/ui/use-toast';
    import { Helmet } from 'react-helmet-async';

    const newPrimaryColor = "hsl(210, 90%, 50%)"; 
    const newPrimaryLight = "hsl(210, 85%, 92%)";
    const newSecondaryColor = "hsl(180, 75%, 45%)"; 
    const newAccentColor = "hsl(35, 100%, 60%)"; 
    const logoUrl = "https://horizons-cdn.hostinger.com/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/3a09a949b47cc959adb2761d2bc44da5.png";

    const HeroActionCard = ({ icon: Icon, title, description, onClick }) => (
      <motion.div
        onClick={onClick}
        className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center cursor-pointer transition-all hover:shadow-2xl hover:scale-105 transform"
        style={{ borderColor: newPrimaryLight, borderWidth: '1px' }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${newPrimaryColor} 0%, ${newSecondaryColor} 100%)` }}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: newPrimaryColor }}>{title}</h3>
        <p className="text-xs text-gray-600">{description}</p>
      </motion.div>
    );

    const FeatureHighlightCard = ({ icon: Icon, title, description, onClick }) => (
      <motion.div
        onClick={onClick}
        className="bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 rounded-2xl shadow-lg cursor-pointer transition-all hover:shadow-xl border border-transparent hover:border-primary-light flex items-start space-x-4"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: newPrimaryLight }}>
          <Icon className="w-6 h-6" style={{ color: newPrimaryColor }} />
        </div>
        <div>
          <h4 className="text-md font-semibold mb-1" style={{ color: newPrimaryColor }}>{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </motion.div>
    );


    const LandingPage = () => {
      const navigate = useNavigate();
      const { user, profile, logout } = useAuth();
      const [destination, setDestination] = useState(null);

      const isAuthenticated = !!user;

      const handleNavigation = (path) => {
        navigate(path);
      };
      
      const handleDashboardNavigation = () => {
        if (profile?.user_type === 'driver') navigate('/driver');
        else if (profile?.user_type === 'passenger') navigate('/passenger');
        else if (profile?.user_type === 'admin') navigate('/admin');
        else navigate('/');
      };

      const handleSearch = () => {
        if (destination) {
          navigate('/booking', { state: { destinationQuery: destination.address, destinationCoords: { lat: destination.lat, lng: destination.lng } } });
        }
      };

      const handleLogout = async () => {
        await logout();
        navigate('/');
      };

      return (
        <>
        <Helmet>
            <title>ViajaFácil – Transporte inmediato, agendado, por horas, compartido y envíos express</title>
            <meta name="description" content="ViajaFácil te conecta con viajes inmediatos, programados, por horas y compartidos, además de envíos express de paquetería. Reserva rápido y paga con app, efectivo o Mercado Pago." />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-b from-slate-100 to-gray-200 flex flex-col">
          <header className="sticky top-0 z-30 shadow-sm bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                <img src={logoUrl} alt="ViajaFacil Logo" className="h-24 w-auto" />
              </div>
              <div className="space-x-2 flex items-center">
                {isAuthenticated ? (
                  <>
                    <Button
                      onClick={handleDashboardNavigation}
                      className="rounded-full text-sm font-medium text-white"
                      style={{backgroundColor: newPrimaryColor}}
                    >
                      Ir al Panel
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 rounded-full"
                      aria-label="Cerrar sesión"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={() => navigate('/login')}
                      variant="outline"
                      className="rounded-full text-sm font-medium"
                      style={{borderColor: newPrimaryColor, color: newPrimaryColor}}
                    >
                      Ingresar
                    </Button>
                    <Button 
                      onClick={() => navigate('/register')}
                      className="rounded-full text-sm font-medium text-white"
                      style={{backgroundColor: newAccentColor}}
                    >
                      Crear Cuenta
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="flex-grow container mx-auto px-4 md:px-6 py-8 md:py-12 space-y-12 md:space-y-16">
            <section className="text-center pt-6 md:pt-10">
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="block" style={{color: newPrimaryColor}}>Tu Ciudad!</span>
                <span className="block" style={{color: newSecondaryColor}}>Tu Viaje. Simplificado.</span>
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Descubre la libertad de moverte a tu manera. Rápido, seguro y siempre a tu alcance.
              </motion.p>
              
              <motion.div 
                className="max-w-2xl mx-auto"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="relative flex items-center w-full">
                  <div className="w-full">
                    <LocationInput
                      onLocationSelect={setDestination}
                      placeholder="¿A dónde te llevamos hoy?"
                      value={destination}
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
                    className="ml-2 h-12 text-md font-semibold text-white"
                    style={{ background: newPrimaryColor }}
                    disabled={!destination}
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Buscar
                  </Button>
                </div>
              </motion.div>
            </section>

            <section>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
                <HeroActionCard icon={Car} title="Viajar Ahora" description="Pide un viaje y llega a tu destino en minutos." onClick={() => handleNavigation('/booking')} />
                <HeroActionCard icon={CalendarClock} title="Agendar Viaje" description="Programa tus viajes con anticipación y sin estrés." onClick={() => handleNavigation('/schedule-ride')} />
                <HeroActionCard icon={Hourglass} title="Viaje por Horas" description="Un conductor a tu disposición por el tiempo que necesites." onClick={() => handleNavigation('/hourly-ride')} />
              </div>
            </section>
            
            <motion.section 
              className="p-6 md:p-8 rounded-2xl shadow-xl text-white overflow-hidden relative"
              style={{ background: `linear-gradient(145deg, ${newSecondaryColor} 0%, ${newPrimaryColor} 100%)`}}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Sparkles className="absolute -top-4 -left-4 w-24 h-24 text-white/10 transform rotate-12" />
              <Sparkles className="absolute -bottom-6 -right-2 w-20 h-20 text-white/10 transform rotate-45" />
              <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
                <div className="mb-6 md:mb-0 md:mr-8 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold">Envíos Express Confiables</h2>
                  <p className="text-md opacity-90 mt-2">Tus paquetes importantes, entregados con la máxima prioridad y seguridad.</p>
                </div>
                <Button 
                  variant="outline" 
                  className="bg-white/95 hover:bg-white border-transparent rounded-full px-8 py-3 text-md font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  style={{ color: newPrimaryColor }}
                  onClick={() => handleNavigation('/packages')}
                >
                  <PackageSearch className="w-5 h-5 mr-2" />
                  Realizar un Envío
                </Button>
              </div>
            </motion.section>

            <motion.section 
              className="p-6 md:p-8 rounded-2xl shadow-xl text-white overflow-hidden relative"
              style={{ background: `linear-gradient(145deg, ${newAccentColor} 0%, hsl(35, 100%, 50%) 100%)`}}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Users className="absolute -top-4 -left-4 w-24 h-24 text-white/10 transform rotate-12" />
              <Users className="absolute -bottom-6 -right-2 w-20 h-20 text-white/10 transform rotate-45" />
              <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
                <div className="mb-6 md:mb-0 md:mr-8 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold">Viajes Compartidos</h2>
                  <p className="text-md opacity-90 mt-2">Ahorrá en tus viajes y conocé gente nueva. ¡La forma más inteligente de moverte!</p>
                </div>
                <Button 
                  variant="outline" 
                  className="bg-white/95 hover:bg-white border-transparent rounded-full px-8 py-3 text-md font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  style={{ color: newAccentColor }}
                  onClick={() => handleNavigation('/shared-rides-offers')}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Ver Viajes
                </Button>
              </div>
            </motion.section>

            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8 text-center">Más que solo viajes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <FeatureHighlightCard
                  icon={RouteIcon}
                  title="Rutas Personalizadas"
                  description="Define múltiples paradas en tu recorrido y optimiza tu tiempo al máximo."
                  onClick={() => handleNavigation('/booking')}
                />
                <FeatureHighlightCard
                  icon={ShieldCheck}
                  title="Seguridad y Confianza"
                  description="Viaja con tranquilidad gracias a nuestros conductores verificados y seguimiento en tiempo real."
                  onClick={() => { toast({ title: 'Tu seguridad es nuestra prioridad. ¡Viaja con confianza!'}) }}
                />
              </div>
            </section>
          </main>

          <footer className="py-8 text-center border-t" style={{borderColor: newPrimaryLight}}>
            <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} ViajaFacil. Todos los derechos reservados.</p>
          </footer>
        </div>
        </>
      );
    };

    export default LandingPage;