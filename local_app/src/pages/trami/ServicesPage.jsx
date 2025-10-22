import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Car, Package, Shield, ShoppingBag } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';

const ServiceCard = ({ icon: Icon, title, description, onClick }) => (
  <motion.div
    onClick={onClick}
    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-start space-x-4"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    whileHover={{ scale: 1.03 }}
  >
    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <div>
      <h3 className="text-md font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </motion.div>
);

const ServicesPage = () => {
  const navigate = useNavigate();

  const services = [
    { icon: Car, title: "Viajes Personales", description: "Muévete por la ciudad de forma rápida y segura.", path: "/booking" },
    { icon: Package, title: "Envío de Paquetes (Cadetrami)", description: "Envía o recibe paquetes con facilidad.", path: "/packages" },
    { icon: ShoppingBag, title: "Compras y Encargos", description: "Hacemos tus compras y te las llevamos.", path: "/errands" },
    { icon: Shield, title: "Viajes Seguros Mujer", description: "Conductoras mujeres para mayor tranquilidad.", path: "/safe-ride-women" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="passenger-dashboard-header sticky top-0 z-10">
         <div className="status-bar-overlay">
            <span>4:42</span>
            <span>Servicios</span>
            {/* You can put an icon here if you want */}
          </div>
        <div className="pt-2 pb-4 px-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 text-white hover:bg-white/20 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">Nuestros Servicios</h1>
        </div>
      </header>

      <main className="flex-grow p-4 space-y-4 overflow-y-auto">
        {services.map((service, index) => (
          <ServiceCard 
            key={index}
            icon={service.icon}
            title={service.title}
            description={service.description}
            onClick={() => service.path ? navigate(service.path) : alert(`${service.title} - Próximamente`)}
          />
        ))}
      </main>
      <BottomNavBar userType="passenger" />
    </div>
  );
};

export default ServicesPage;