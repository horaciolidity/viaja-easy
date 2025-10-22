import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ScheduleRideHeader = ({ step, onStepChange }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm p-4 flex items-center z-30">
      <Button variant="ghost" size="icon" onClick={() => (step === 1 ? navigate(-1) : onStepChange(1))}>
        <ArrowLeft />
      </Button>
      <h1 className="text-lg font-semibold ml-4">Programar un Viaje</h1>
    </header>
  );
};

export default ScheduleRideHeader;