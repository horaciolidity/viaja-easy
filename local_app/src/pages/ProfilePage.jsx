import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  ShieldCheck,
  Star,
  LogOut,
  Loader2,
  Landmark,
  FileText,
  Camera,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import VerifyAccountButton from '@/components/common/VerifyAccountButton';
import { supabase } from '@/lib/customSupabaseClient';
import { toJpegBlobFixed } from '@/lib/imageUtils';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, logout, loading, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    mercadopago_alias: '',
    mercadopago_cvu: '',
  });

  /* ---------- Avatar ---------- */
  const getAvatarUrl = useCallback(async () => {
    if (!profile) return;
    try {
      if (profile.avatar_path) {
        const { data, error } = await supabase.storage
          .from('avatars')
          .createSignedUrl(profile.avatar_path, 3600);
        if (error) throw error;
        setAvatarPreview(data.signedUrl);
      } else {
        setAvatarPreview(
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            profile.full_name || profile.email || 'U'
          )}&background=random&color=fff&size=128`
        );
      }
    } catch {
      setAvatarPreview(
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          profile.full_name || profile.email || 'U'
        )}&background=random&color=fff&size=128`
      );
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        mercadopago_alias: profile.mercadopago_alias || '',
        mercadopago_cvu: profile.mercadopago_cvu || '',
      });
      getAvatarUrl();
    }
  }, [profile, getAvatarUrl]);

  /* ---------- Avatar upload ---------- */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSaving(true);
    try {
      const processedBlob = await toJpegBlobFixed(file);
      const filePath = `avatars/${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, processedBlob, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      await updateProfile({ avatar_path: filePath, avatar_url: null });
      await refreshProfile();
      await getAvatarUrl();

      toast({ title: '¡Éxito!', description: 'Tu foto de perfil ha sido actualizada.' });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la foto de perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- Input ---------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------- Save ---------- */
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const changedData = {};
      if (formData.full_name !== profile.full_name) changedData.full_name = formData.full_name;
      if (formData.phone !== profile.phone) changedData.phone = formData.phone;
      if (formData.mercadopago_alias !== profile.mercadopago_alias)
        changedData.mercadopago_alias = formData.mercadopago_alias;
      if (formData.mercadopago_cvu !== profile.mercadopago_cvu)
        changedData.mercadopago_cvu = formData.mercadopago_cvu;

      if (Object.keys(changedData).length > 0) {
        await updateProfile(changedData);
        await refreshProfile();
        toast({ title: '¡Éxito!', description: 'Tu perfil ha sido actualizado.' });
      } else {
        toast({ title: 'Sin cambios', description: 'No se detectaron cambios.' });
      }
      setIsEditing(false);
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- Redirect ---------- */
  useEffect(() => {
    if (!loading && !profile) navigate('/login');
  }, [loading, profile, navigate]);

  /* ---------- Loader ---------- */
  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <motion.div className="p-4 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-4 rounded-full bg-white dark:bg-slate-800 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mi Perfil</h1>
        </div>

        {/* Avatar */}
        <motion.div
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg text-center mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative w-24 h-24 mx-auto mb-4">
            <img
              src={avatarPreview}
              alt="Avatar del usuario"
              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center"
              onClick={() => fileInputRef.current.click()}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png"
              capture="user"
              className="hidden"
            />
            {profile?.verified && (
              <div className="absolute top-0 right-0 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {profile?.full_name || profile?.email}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{profile?.email}</p>
          <div className="flex items-center justify-center mt-2 text-amber-500">
            <Star className="w-5 h-5 fill-current mr-1" />
            <span className="font-semibold">{profile?.rating?.toFixed(1) || 'N/A'}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">
              ({profile?.total_rides || 0} viajes)
            </span>
          </div>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSaveChanges} className="space-y-6">
          {/* Datos personales */}
          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Información Personal
              </h3>
              {!isEditing && (
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 dark:text-sky-400"
                >
                  <Edit3 className="w-4 h-4 mr-2" /> Editar
                </Button>
              )}
            </div>

            {['full_name', 'email', 'phone'].map((field) => {
              const icons = { full_name: User, email: Mail, phone: Phone };
              const Icon = icons[field];
              const isEmail = field === 'email';
              return (
                <div key={field}>
                  <Label htmlFor={field}>
                    {field === 'full_name'
                      ? 'Nombre Completo'
                      : field === 'email'
                      ? 'Email'
                      : 'Teléfono'}
                  </Label>
                  <div className="relative mt-1">
                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id={field}
                      name={field}
                      type={isEmail ? 'email' : 'text'}
                      value={formData[field]}
                      onChange={handleInputChange}
                      readOnly={isEmail || !isEditing}
                      className={`pl-10 h-12 rounded-lg ${
                        !isEditing || isEmail
                          ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed'
                          : ''
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Datos de retiro */}
          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Datos de Retiro
            </h3>
            {['mercadopago_alias', 'mercadopago_cvu'].map((field) => (
              <div key={field}>
                <Label htmlFor={field}>
                  {field === 'mercadopago_alias' ? 'Alias de Mercado Pago' : 'CVU/CBU'}
                </Label>
                <div className="relative mt-1">
                  <Landmark className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id={field}
                    name={field}
                    value={formData[field]}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    placeholder={
                      field === 'mercadopago_alias'
                        ? 'tu.alias.mp'
                        : '0000003100000000000000'
                    }
                    className={`pl-10 h-12 rounded-lg ${
                      !isEditing ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Verificación */}
          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Verificación y Documentos
              </h3>
              <Button onClick={() => navigate('/upload-documents')}>
                <FileText className="w-4 h-4 mr-2" /> Gestionar Documentos
              </Button>
            </div>
            {!profile.verified && (
              <div className="mt-4">
                <VerifyAccountButton userId={user.id} profile={profile} onVerified={refreshProfile} />
              </div>
            )}
          </motion.div>

          {/* Botones de guardar */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" disabled={isSaving} className="flex-1 h-12 rounded-xl text-base">
                {isSaving ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    full_name: profile.full_name,
                    email: profile.email,
                    phone: profile.phone,
                    mercadopago_alias: profile.mercadopago_alias || '',
                    mercadopago_cvu: profile.mercadopago_cvu || '',
                  });
                }}
                className="flex-1 h-12 rounded-xl text-base"
              >
                Cancelar
              </Button>
            </div>
          )}
        </form>

        {/* Logout */}
        <div className="mt-8">
          <Button
            variant="ghost"
            onClick={() => logout({ navigate, showToast: true })}
            disabled={loading}
            className="w-full h-12 rounded-xl text-base text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            <LogOut className="w-5 h-5 mr-2" />{' '}
            {loading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
