import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserCheck, LogOut } from 'lucide-react';

const ImpersonationBanner = () => {
  const { stopImpersonation, impersonatedUser } = useAuth();

  if (!impersonatedUser) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-400 text-black p-4 rounded-lg shadow-lg z-[100] flex items-center gap-4 animate-pulse">
      <UserCheck className="w-6 h-6" />
      <div>
        <p className="font-bold">Estás viendo como {impersonatedUser.email}</p>
        <p className="text-sm">Algunas acciones pueden estar limitadas.</p>
      </div>
      <Button onClick={stopImpersonation} variant="destructive" size="sm">
        <LogOut className="w-4 h-4 mr-2" />
        Volver a mi cuenta
      </Button>
    </div>
  );
};

export default ImpersonationBanner;