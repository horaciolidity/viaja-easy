import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle, Settings, Bell, LifeBuoy } from 'lucide-react';

const PassengerUserMenu = () => {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-primary dark:focus-visible:ring-sky-500">
           <Avatar className="h-10 w-10 border-2 border-primary dark:border-sky-400">
            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Usuario'} />
            <AvatarFallback className="bg-primary dark:bg-sky-500 text-white">{profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xl" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 p-1">
            <p className="text-sm font-semibold leading-none">{profile?.full_name || 'Pasajero'}</p>
            <p className="text-xs leading-none text-slate-500 dark:text-slate-400">{profile?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
        <DropdownMenuItem onClick={() => navigate('/passenger/profile')} className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 cursor-pointer">
          <UserCircle className="mr-2 h-4 w-4 text-primary dark:text-sky-400" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/passenger/notifications')} className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 cursor-pointer">
          <Bell className="mr-2 h-4 w-4 text-amber-500 dark:text-amber-400" />
          <span>Notificaciones</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/passenger/settings')} className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 cursor-pointer">
          <Settings className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/passenger/support')} className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700 cursor-pointer">
          <LifeBuoy className="mr-2 h-4 w-4 text-green-500 dark:text-green-400" />
          <span>Soporte</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 focus:bg-red-50 dark:focus:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 focus:text-red-700 dark:focus:text-red-300 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default PassengerUserMenu;