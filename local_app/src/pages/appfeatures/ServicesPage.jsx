import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Car, Package, Calendar, Clock, Users, ArrowRight, ArrowLeft } from 'lucide-react';
    import { useSettings } from '@/contexts/SettingsContext';

    const ServiceCard = ({ icon, title, description, path, disabled, delay, highlight }) => {
      const navigate = useNavigate();
      const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } }
      };

      return (
        <motion.div variants={cardVariants}>
          <button
            onClick={() => navigate(path)}
            disabled={disabled}
            className={`w-full text-left p-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              ${highlight ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg hover:shadow-xl' : 'bg-white text-slate-800 shadow-md hover:shadow-lg'}
              ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 shadow-sm' : ''}`}
          >
            <div className={`mb-4 w-14 h-14 rounded-full flex items-center justify-center ${highlight ? 'bg-white/20' : 'bg-primary/10'}`}>
              {React.cloneElement(icon, { className: `w-7 h-7 ${highlight ? 'text-white' : 'text-primary'}` })}
            </div>
            <h3 className="text-lg font-bold mb-1">{title}</h3>
            <p className={`text-sm ${highlight ? 'text-white/80' : 'text-slate-500'}`}>{description}</p>
            {!disabled && (
              <div className="mt-4 flex justify-end">
                <ArrowRight className="w-5 h-5 opacity-70" />
              </div>
            )}
          </button>
        </motion.div>
      );
    };

    const ServicesPage = () => {
      const navigate = useNavigate();
      const { settings, loading } = useSettings();
      
      const hourlySettings = settings.hourlyRideSettings;
      const scheduledSettings = settings.scheduledRideSettings;
      
      const services = [
        {
          icon: <Car />,
          title: "Viaje Ahora",
          description: "Pedí un auto o moto para viajar al instante.",
          path: "/booking",
          highlight: true,
          disabled: false,
        },
        {
          icon: <Package />,
          title: "Envío de Paquetes",
          description: "Mandá o recibí paquetes de forma rápida y segura.",
          path: "/packages",
          highlight: false,
          disabled: false,
        },
        {
          icon: <Calendar />,
          title: "Programar Viaje",
          description: "Asegurá tu viaje con anticipación para cualquier ocasión.",
          path: "/schedule-ride",
          highlight: false,
          disabled: loading || !scheduledSettings?.is_active,
        },
        {
          icon: <Clock />,
          title: "Viaje por Horas",
          description: "Reservá un vehículo con conductor por el tiempo que necesites.",
          path: "/hourly-ride",
          highlight: false,
          disabled: loading || !hourlySettings?.is_active,
        },
        {
          icon: <Users />,
          title: "Viaje Compartido",
          description: "Dividí la tarifa del viaje con otros pasajeros.",
          path: "/shared-ride",
          highlight: false,
          disabled: true,
        },
      ];

      return (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-slate-200 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800">Elige tu Servicio</h1>
          </header>

          <main className="p-4 md:p-6">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              initial="hidden"
              animate="visible"
            >
              {services.map((service, index) => (
                <ServiceCard key={index} {...service} delay={index * 0.1} />
              ))}
            </motion.div>
          </main>
        </div>
      );
    };

    export default ServicesPage;