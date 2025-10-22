import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const ScheduleRideFooter = ({ step, onStepChange, onConfirm, isStep1Valid, isStep2Valid, scheduling }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
      {step === 1 && (
        <Button
          id="vehicle-step-button"
          onClick={() => onStepChange(2)}
          disabled={!isStep1Valid}
          className="w-full"
        >
          Elegir Vehículo
        </Button>
      )}
      {step === 2 && (
        <Button
          id="confirm-schedule-button"
          onClick={onConfirm}
          disabled={!isStep2Valid || scheduling}
          className="w-full"
        >
          {scheduling ? <Loader2 className="animate-spin mr-2" /> : null}
          Confirmar y Programar
        </Button>
      )}
    </footer>
  );
};

export default ScheduleRideFooter;