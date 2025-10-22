import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Assuming you have a Switch component
import { ArrowLeft, Bell, Palette, Shield, Lock, HelpCircle, Languages, Map, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

// Create Switch component if not present
// src/components/ui/switch.jsx
// import React from "react"
// import * as SwitchPrimitives from "@radix-ui/react-switch"
// import { cn } from "@/lib/utils"
// const Switch = React.forwardRef(({ className, ...props }, ref) => (
//   <SwitchPrimitives.Root
//     className={cn(
//       "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
//       className
//     )}
//     {...props}
//     ref={ref}>
//     <SwitchPrimitives.Thumb
//       className={cn(
//         "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
//       )} />
//   </SwitchPrimitives.Root>
// ))
// Switch.displayName = SwitchPrimitives.Root.displayName
// export { Switch }


const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Assuming user settings might be stored here

  // Dummy state for settings - replace with actual state management
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false); // Example for theme
  const [language, setLanguage] = useState('es');
  const [defaultMap, setDefaultMap] = useState('osm'); // OpenStreetMap

  const handleSettingChange = (setter, value, settingName) => {
    setter(value);
    toast({ title: "Ajuste Guardado", description: `${settingName} actualizado.` });
    // Here you would persist the setting, e.g., to localStorage or backend
  };


  const settingsSections = [
    {
      title: 'Cuenta',
      items: [
        { label: 'Información Personal', icon: <CreditCard className="w-5 h-5 text-gray-500" />, action: () => navigate('/profile') },
        { label: 'Seguridad y Contraseña', icon: <Lock className="w-5 h-5 text-gray-500" />, action: () => toast({title: "Próximamente", description:"Función de cambio de contraseña"}) },
      ]
    },
    {
      title: 'Notificaciones',
      items: [
        { 
          label: 'Permitir Notificaciones', 
          icon: <Bell className="w-5 h-5 text-gray-500" />, 
          control: <Switch checked={notificationsEnabled} onCheckedChange={(val) => handleSettingChange(setNotificationsEnabled, val, 'Notificaciones')} />
        },
      ]
    },
    {
      title: 'Apariencia',
      items: [
        { 
          label: 'Modo Oscuro', 
          icon: <Palette className="w-5 h-5 text-gray-500" />,
          control: <Switch checked={darkMode} onCheckedChange={(val) => handleSettingChange(setDarkMode, val, 'Modo Oscuro')} />
        },
        {
          label: 'Idioma',
          icon: <Languages className="w-5 h-5 text-gray-500" />,
          currentValue: language === 'es' ? 'Español' : 'English',
          action: () => toast({title: "Próximamente", description:"Selector de idioma"})
        }
      ]
    },
    {
      title: 'Preferencias de Viaje',
      items: [
        {
          label: 'Mapa Predeterminado',
          icon: <Map className="w-5 h-5 text-gray-500" />,
          currentValue: defaultMap === 'osm' ? 'OpenStreetMap' : 'Otro Mapa',
          action: () => toast({title: "Próximamente", description:"Selector de mapa"})
        }
      ]
    },
    {
      title: 'Soporte y Legal',
      items: [
        { label: 'Ayuda y Soporte', icon: <HelpCircle className="w-5 h-5 text-gray-500" />, action: () => navigate('/support') },
        { label: 'Política de Privacidad', icon: <Shield className="w-5 h-5 text-gray-500" />, action: () => toast({title: "Próximamente", description:"Vista de política de privacidad"}) },
        { label: 'Términos de Servicio', icon: <Shield className="w-5 h-5 text-gray-500" />, action: () => toast({title: "Próximamente", description:"Vista de términos de servicio"}) },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="status-bar">
        <span>9:41</span>
        <span>Configuración</span>
        <span>100%</span>
      </div>

      <motion.div
        className="p-6 pb-20" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 rounded-full bg-white shadow-md">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        </div>

        <div className="space-y-8">
          {settingsSections.map((section, sectionIndex) => (
            <motion.div 
              key={sectionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <h2 className="text-xs font-semibold uppercase text-gray-500 mb-3 px-2">{section.title}</h2>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    onClick={item.action}
                    className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${itemIndex < section.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-3 text-sm text-gray-700">{item.label}</span>
                    </div>
                    {item.control ? (
                      item.control
                    ) : item.currentValue ? (
                      <span className="text-sm text-gray-500">{item.currentValue}</span>
                    ) : (
                       item.action && <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <div className="bottom-safe-area" />
    </div>
  );
};
// Need ChevronRight for navigation indication
const ChevronRight = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>;

export default SettingsPage;