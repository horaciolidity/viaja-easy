import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Star, Calendar, Car, Hash, Palette, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center text-sm">
    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full mr-3">{icon}</div>
    <div>
      <p className="text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

const UserInfoModal = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  const vehicle = user.vehicle || user.vehicle_info || {};
  const isDriver = user.vehicle_info !== undefined || user.vehicle !== undefined;
  const plate = vehicle?.plate;
  const partialPlate = plate ? `***${plate.slice(-3)}` : 'N/A';
  const memberSince = user.member_since ? new Date(user.member_since).toLocaleDateString('es-AR') : 'N/A';

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/images/default-avatar.png';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-slate-800 dark:text-slate-100">
            Información del {isDriver ? 'Conductor' : 'Pasajero'}
          </DialogTitle>
          <DialogDescription className="text-center">
            Detalles del perfil y vehículo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center pt-4">
          <Avatar className="w-24 h-24 border-4 border-primary shadow-lg">
            <AvatarImage src={user.avatar_url} alt={user.name} onError={handleImageError}/>
            <AvatarFallback className="text-3xl bg-slate-200 dark:bg-slate-700">{user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold mt-4 text-slate-900 dark:text-slate-50">{user.name || 'Usuario'}</h2>
          <div className="flex items-center mt-1">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-slate-600 dark:text-slate-300 font-semibold">{user.rating?.toFixed(1) || 'Nuevo'}</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <InfoRow
            icon={<User className="w-4 h-4 text-primary" />}
            label="Nombre Completo"
            value={user.name || 'No especificado'}
          />
          <InfoRow
            icon={<Calendar className="w-4 h-4 text-primary" />}
            label="Miembro desde"
            value={memberSince}
          />
        </div>

        {isDriver && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-center mb-4 text-slate-800 dark:text-slate-100">
              Información del Vehículo
            </h3>
            <div className="relative mb-4">
              <img  
                className="w-full h-40 object-cover rounded-lg shadow-md"
                alt={`${vehicle.brand} ${vehicle.model}`}
               src="https://images.unsplash.com/photo-1696193588833-27833ad77c54" />
              <Badge className="absolute top-2 right-2 bg-black/70 text-white font-mono tracking-widest">{partialPlate}</Badge>
            </div>
            <div className="space-y-4">
              <InfoRow
                icon={<Car className="w-4 h-4 text-primary" />}
                label="Marca y Modelo"
                value={`${vehicle.brand || ''} ${vehicle.model || 'No especificado'}`}
              />
              <InfoRow
                icon={<Palette className="w-4 h-4 text-primary" />}
                label="Color"
                value={vehicle.color || 'No especificado'}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserInfoModal;