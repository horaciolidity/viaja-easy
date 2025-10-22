import React, { useState, useEffect, useRef } from 'react';
    import { motion } from 'framer-motion';
    import { useNavigate, Link, useLocation } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { ArrowLeft, Eye, EyeOff, Car, User, Phone, Mail, Loader2, Gift, Camera as CameraIcon, Upload } from 'lucide-react';
    import { toast } from '@/components/ui/use-toast';
    import { Helmet } from 'react-helmet-async';
    import { useAuth } from '@/contexts/AuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toJpegBlobFixed } from '@/lib/imageUtils';

    const logoUrl = "https://horizons-cdn.hostinger.com/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/3a09a949b47cc959adb2761d2bc44da5.png";
    const newPrimaryColor = "hsl(210, 90%, 50%)";
    const newAccentColor = "hsl(35, 100%, 60%)";

    const RegisterPage = () => {
      const navigate = useNavigate();
      const location = useLocation();
      const { register } = useAuth();
      
      const [userType, setUserType] = useState('passenger');
      const [formData, setFormData] = useState({
        name: '', 
        email: '', 
        phone: '', 
        password: '', 
        confirmPassword: '', 
        invitationToken: null,
      });
      const [profilePhoto, setProfilePhoto] = useState(null);
      const [photoPreview, setPhotoPreview] = useState(null);
      const fileInputRef = useRef(null);
      const [loading, setLoading] = useState(false);
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const [errors, setErrors] = useState({});

      useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('invitation_token');
        if (token) {
            setFormData(prev => ({...prev, invitationToken: token}));
        }
      }, [location.search]);

      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: null }));
        }
      };

      const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const processedBlob = await toJpegBlobFixed(file);
            setProfilePhoto(processedBlob);
            setPhotoPreview(URL.createObjectURL(processedBlob));
            if (errors.profilePhoto) {
              setErrors(prev => ({ ...prev, profilePhoto: null }));
            }
          } catch (error) {
            toast({ title: 'Error al procesar imagen', description: 'No se pudo procesar la imagen seleccionada.', variant: 'destructive' });
          }
        }
      };

      const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
        if (!formData.email) newErrors.email = 'El email es requerido';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.phone) newErrors.phone = 'El teléfono es requerido';
        if (!formData.password) newErrors.password = 'La contraseña es requerida';
        else if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
        if (!profilePhoto) newErrors.profilePhoto = 'La foto de perfil es obligatoria.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setLoading(true);
        try {
          const { data: { user }, error: authError } = await supabase.auth.signUp({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            options: {
              data: {
                full_name: formData.name.trim(),
                user_type: userType,
                phone: formData.phone.trim(),
              },
            },
          });

          if (authError) throw authError;
          if (!user) throw new Error("No se pudo crear el usuario.");

          const filePath = `avatars/${user.id}/avatar.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, profilePhoto, {
              cacheControl: '3600',
              upsert: true,
              contentType: 'image/jpeg',
            });

          if (uploadError) throw uploadError;

          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ avatar_path: filePath, avatar_url: null })
            .eq('id', user.id);

          if (profileUpdateError) throw profileUpdateError;

          toast({
            title: "Registro Exitoso",
            description: "Revisa tu email para confirmar tu cuenta. Serás redirigido.",
          });
          
          if (userType === 'driver') {
            navigate('/upload-documents?new_registration=true');
          } else {
            navigate('/verification');
          }
        } catch (error) {
          if (error.message?.includes('User already registered')) {
            toast({ title: 'Error en el registro', description: 'Este email ya está registrado. Intenta iniciar sesión.', variant: 'destructive' });
          } else {
            toast({ title: 'Error en el registro', description: error.message, variant: 'destructive' });
          }
        } finally {
          setLoading(false);
        }
      };

      return (
        <>
        <Helmet>
            <title>Crear Cuenta – ViajaFácil</title>
            <meta name="description" content="Regístrate en ViajaFácil como pasajero o conductor y empieza a disfrutar de la mejor experiencia de transporte." />
        </Helmet>
        <div className="min-h-screen bg-slate-100 text-gray-800 flex flex-col">
          <div className="absolute top-0 left-0 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
          </div>

          <motion.div
            className="flex-grow flex flex-col justify-center px-6 pb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-6">
              <img src={logoUrl} alt="ViajaFacil Logo" className="w-64 h-auto mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-1" style={{ color: newPrimaryColor }}>¡Únete a la Comunidad!</h2>
              <p className="text-sm text-gray-600">Crea tu cuenta para empezar a viajar.</p>
              {formData.invitationToken && (
                <div className="mt-4 bg-green-100 border border-green-300 text-green-800 text-sm rounded-lg p-3 flex items-center justify-center">
                    <Gift className="w-5 h-5 mr-2" />
                    Estás usando un enlace de invitación.
                </div>
              )}
            </div>

            <div className="mb-6">
              <Label className="block text-sm font-medium text-gray-700 mb-3">Registrarme como:</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" onClick={() => setUserType('passenger')} className={`h-auto py-3 flex flex-col items-center rounded-xl border-2 transition-all ${userType === 'passenger' ? 'border-[hsl(210,90%,50%)] bg-[hsl(210,85%,92%)]' : 'border-gray-200 bg-white'}`}>
                  <User className={`w-6 h-6 mb-1 ${userType === 'passenger' ? 'text-[hsl(210,90%,50%)]' : 'text-gray-500'}`} />
                  <span className={`text-sm font-semibold ${userType === 'passenger' ? 'text-[hsl(210,90%,50%)]' : 'text-gray-600'}`}>Pasajero</span>
                </Button>
                <Button type="button" variant="outline" onClick={() => setUserType('driver')} className={`h-auto py-3 flex flex-col items-center rounded-xl border-2 transition-all ${userType === 'driver' ? 'border-[hsl(210,90%,50%)] bg-[hsl(210,85%,92%)]' : 'border-gray-200 bg-white'}`}>
                  <Car className={`w-6 h-6 mb-1 ${userType === 'driver' ? 'text-[hsl(210,90%,50%)]' : 'text-gray-500'}`} />
                  <span className={`text-sm font-semibold ${userType === 'driver' ? 'text-[hsl(210,90%,50%)]' : 'text-gray-600'}`}>Conductor</span>
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Vista previa" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <Label htmlFor="photo" className="text-sm font-medium text-gray-700">Foto de Perfil*</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current.click()}>
                    <Upload className="w-4 h-4 mr-2" /> Subir o Tomar Foto
                  </Button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/jpeg,image/png" capture="user" className="hidden" />
                {errors.profilePhoto && <p className="text-xs text-red-600">{errors.profilePhoto}</p>}
              </div>

              <InputGroup icon={<User />} id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nombre completo" error={errors.name} />
              <InputGroup icon={<Mail />} id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="tu@email.com" error={errors.email} />
              <InputGroup icon={<Phone />} id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="Teléfono" error={errors.phone} />
              <PasswordInputGroup id="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Contraseña (mínimo 6 caracteres)" error={errors.password} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              <PasswordInputGroup id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Confirmar contraseña" error={errors.confirmPassword} show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
              
              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold text-white rounded-lg disabled:opacity-70" style={{ backgroundColor: newAccentColor }}>
                {loading ? <Loader2 className="animate-spin" /> : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: newPrimaryColor }}>Inicia sesión</Link>
              </p>
            </div>
          </motion.div>
        </div>
        </>
      );
    };

    const InputGroup = ({ icon, id, error, ...props }) => (
        <div>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{React.cloneElement(icon, { className: "w-5 h-5" })}</span>
                <Input id={id} className={`pl-10 h-12 rounded-lg border-2 bg-white border-gray-200 focus:border-[hsl(210,90%,50%)] ${error ? 'border-red-500' : ''}`} {...props} />
            </div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );

    const PasswordInputGroup = ({ id, error, show, onToggle, ...props }) => (
        <div>
            <div className="relative">
                <Input id={id} type={show ? 'text' : 'password'} className={`pr-10 h-12 rounded-lg border-2 bg-white border-gray-200 focus:border-[hsl(210,90%,50%)] ${error ? 'border-red-500' : ''}`} {...props} />
                <Button type="button" variant="ghost" size="icon" onClick={onToggle} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
            </div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );

    export default RegisterPage;