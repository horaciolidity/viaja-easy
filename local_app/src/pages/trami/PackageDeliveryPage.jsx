import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, MapPin, DollarSign, Edit3 } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';

const PackageDeliveryPage = () => {
  const navigate = useNavigate();
  // Basic state for package details
  const [pickupAddress, setPickupAddress] = React.useState('');
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [packageDetails, setPackageDetails] = React.useState('');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="passenger-dashboard-header sticky top-0 z-10">
         <div className="status-bar-overlay">
            <span>4:42</span>
            <span>Envío de Paquetes</span>
            <Package className="w-4 h-4" />
          </div>
        <div className="pt-2 pb-4 px-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 text-white hover:bg-white/20 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-white">Cade<span className="text-gradient-primary">trami</span> - Envíos</h1>
        </div>
      </header>

      <main className="flex-grow p-6 space-y-6 overflow-y-auto">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SectionTitle icon={MapPin} title="Dirección de Recogida" />
          <input 
            type="text" 
            placeholder="Ej: Av. Corrientes 1234, CABA"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SectionTitle icon={MapPin} title="Dirección de Entrega" color="text-green-500" />
          <input 
            type="text" 
            placeholder="Ej: Av. Santa Fe 5678, CABA"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SectionTitle icon={Edit3} title="Detalles del Paquete" />
          <textarea 
            placeholder="Ej: Documentos importantes, tamaño caja pequeña, frágil."
            value={packageDetails}
            onChange={(e) => setPackageDetails(e.target.value)}
            className="w-full h-24 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary resize-none"
          />
        </motion.div>
        
        <Button 
          className="w-full h-12 text-base gradient-primary text-white rounded-lg shadow-md"
          onClick={() => alert('Funcionalidad "Solicitar Envío" en desarrollo.')}
        >
          <DollarSign className="w-5 h-5 mr-2" />
          Cotizar y Solicitar Envío
        </Button>
      </main>
      <BottomNavBar userType="passenger" />
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, color = "text-primary" }) => (
  <div className="flex items-center mb-3">
    <Icon className={`w-5 h-5 ${color} mr-2.5`} />
    <h2 className="text-md font-semibold text-gray-700">{title}</h2>
  </div>
);


export default PackageDeliveryPage;