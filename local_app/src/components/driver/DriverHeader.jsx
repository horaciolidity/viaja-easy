import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const DriverHeader = ({ driverName, isOnline, hasActiveRide }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            ¡Hola, {driverName?.split(' ')[0] || 'Conductor'}!
          </h1>
          <p className={`text-sm font-semibold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Estás conectado' : 'Estás desconectado'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriverHeader;