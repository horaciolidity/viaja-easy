import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Car, Edit3, Save, ShieldCheck, UploadCloud } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const DriverVehiclePage = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    plate: '',
    color: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (profile && profile.vehicle_info) {
      setVehicleData(profile.vehicle_info);
    } else if (profile && !profile.vehicle_info) {
      setIsEditing(true);
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehicleData(prev => ({ ...prev, imageUrl: reader.result }));
        toast({ title: "Imagen Cargada", description: "La imagen del vehículo se ha cargado (simulación)." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ vehicle_info: vehicleData });
      setIsEditing(false);
      toast({ title: "Vehículo Actualizado", description: "La información de tu vehículo ha sido guardada." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron guardar los cambios del vehículo.", variant: "destructive" });
    }
  };

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="status-bar">
        <span>9:41</span>
        <span>Mi Vehículo</span>
        <span>100%</span>
      </div>

      <motion.div
        className="p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 rounded-full bg-white shadow-md">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Mi Vehículo</h1>
        </div>

        <motion.div 
          className="bg-white p-8 rounded-3xl shadow-xl text-center mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative w-full h-48 mx-auto mb-4 rounded-2xl overflow-hidden group">
            {vehicleData.imageUrl ? (
              <img  src={vehicleData.imageUrl} alt="Vehículo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-500">
                <Car className="w-16 h-16 mb-2" />
                <span>Sin imagen del vehículo</span>
              </div>
            )}
            {isEditing && (
              <label htmlFor="vehicleImageUpload" className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <UploadCloud className="w-8 h-8 mr-2" /> Cambiar Imagen
              </label>
            )}
          </div>
          <input type="file" id="vehicleImageUpload" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={!isEditing} />
          
          <h2 className="text-2xl font-bold text-gray-900">{vehicleData.make || 'Marca'} {vehicleData.model || 'Modelo'}</h2>
          <p className="text-gray-500">{vehicleData.plate || 'Matrícula'}</p>
          {profile.vehicle_info?.verified && (
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <ShieldCheck className="w-4 h-4 mr-1" /> Verificado
            </div>
          )}
        </motion.div>

        <form onSubmit={handleSaveChanges} className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Detalles del Vehículo</h3>
            {!isEditing && (
              <Button variant="ghost" onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800">
                <Edit3 className="w-4 h-4 mr-2" /> Editar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="make" className="text-sm font-medium text-gray-700">Marca</Label>
              <Input id="make" name="make" value={vehicleData.make} onChange={handleInputChange} readOnly={!isEditing} placeholder="Ej: Toyota" className={`mt-1 h-11 rounded-lg ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <Label htmlFor="model" className="text-sm font-medium text-gray-700">Modelo</Label>
              <Input id="model" name="model" value={vehicleData.model} onChange={handleInputChange} readOnly={!isEditing} placeholder="Ej: Corolla" className={`mt-1 h-11 rounded-lg ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <Label htmlFor="year" className="text-sm font-medium text-gray-700">Año</Label>
              <Input id="year" name="year" type="number" value={vehicleData.year} onChange={handleInputChange} readOnly={!isEditing} placeholder="Ej: 2022" className={`mt-1 h-11 rounded-lg ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <Label htmlFor="plate" className="text-sm font-medium text-gray-700">Matrícula</Label>
              <Input id="plate" name="plate" value={vehicleData.plate} onChange={handleInputChange} readOnly={!isEditing} placeholder="Ej: ABC-123" className={`mt-1 h-11 rounded-lg ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <Label htmlFor="color" className="text-sm font-medium text-gray-700">Color</Label>
              <Input id="color" name="color" value={vehicleData.color} onChange={handleInputChange} readOnly={!isEditing} placeholder="Ej: Rojo" className={`mt-1 h-11 rounded-lg ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 gradient-success text-white h-12 rounded-xl text-base">
                <Save className="w-4 h-4 mr-2" /> {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setVehicleData(profile.vehicle_info || {}); }} className="flex-1 h-12 rounded-xl text-base">
                Cancelar
              </Button>
            </div>
          )}
        </form>
      </motion.div>
      <div className="bottom-safe-area" />
    </div>
  );
};

export default DriverVehiclePage;