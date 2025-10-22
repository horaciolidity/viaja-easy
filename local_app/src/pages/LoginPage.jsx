import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, EyeOff, Car, User, Shield, Mail, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet-async';

const logoUrl = "https://horizons-cdn.hostinger.com/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/3a09a949b47cc959adb2761d2bc44da5.png";
const newPrimaryColor = "hsl(210, 90%, 50%)";
const newAccentColor = "hsl(35, 100%, 60%)";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('passenger');
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    if (!email || !password) {
      toast({ title: 'Campos requeridos', description: 'Por favor, completa todos los campos.', variant: 'destructive' });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: 'Email inválido', description: 'Por favor, ingresa un email válido.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(email, password);
    } catch (err) {
      if (err.message?.toLowerCase().includes('invalid login credentials')) {
        toast({
            title: "Credenciales Incorrectas",
            description: "El email o la contraseña no son correctos. Por favor, verifica tus datos.",
            variant: "destructive"
        });
      } else if (err.message?.toLowerCase().includes('confirm your email')) {
         toast({
            title: "Verifica tu cuenta",
            description: "Revisa tu correo para verificar tu cuenta antes de iniciar sesión.",
            variant: "destructive"
        });
        navigate('/verification', { state: { email }});
      } else {
        toast({
            title: "Error al Iniciar Sesión",
            description: "No se pudo conectar con el servidor. Revisa tu conexión o inténtalo más tarde.",
            variant: "destructive"
        });
      }
    }
  };

  return (
    <>
    <Helmet>
        <title>Iniciar Sesión – ViajaFácil</title>
        <meta name="description" content="Ingresa a tu cuenta de ViajaFácil para pedir un viaje, gestionar tus reservas o empezar a conducir." />
    </Helmet>
    <div className="min-h-screen bg-slate-100 text-gray-800 flex flex-col">
      <div className="absolute top-0 left-0 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
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
        <div className="text-center mb-8">
          <motion.img 
            src={logoUrl} 
            alt="ViajaFacil Logo" 
            className="w-64 h-auto mx-auto mb-4"
            animate={{ scale: [1, 1.02, 1]}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut"}}
          />
          <h2 className="text-3xl font-bold mb-2" style={{ color: newPrimaryColor }}>¡Bienvenido de vuelta!</h2>
          <p className="text-gray-600">Inicia sesión para continuar tu viaje.</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Acceder como</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setUserType('passenger')}
              className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center h-24 ${userType === 'passenger' ? 'border-[hsl(210,90%,50%)] bg-[hsl(210,85%,92%)]' : 'border-gray-200 bg-white'}`}
            >
              <User className={`w-6 h-6 mb-1.5 ${userType === 'passenger' ? 'text-[hsl(210,90%,50%)]' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${userType === 'passenger' ? 'text-[hsl(210,90%,50%)]' : 'text-gray-600'}`}>Pasajero</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('driver')}
              className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center h-24 ${userType === 'driver' ? 'border-[hsl(210,90%,50%)] bg-[hsl(210,85%,92%)]' : 'border-gray-200 bg-white'}`}
            >
              <Car className={`w-6 h-6 mb-1.5 ${userType === 'driver' ? 'text-[hsl(210,90%,50%)]' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${userType === 'driver' ? 'text-[hsl(210,90%,50%)]' : 'text-gray-600'}`}>Conductor</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('admin')}
              className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center h-24 ${userType === 'admin' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}
            >
              <Shield className={`w-6 h-6 mb-1.5 ${userType === 'admin' ? 'text-purple-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${userType === 'admin' ? 'text-purple-700' : 'text-gray-600'}`}>Admin</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</Label>
            <Input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full h-12 px-4 rounded-lg border-2 bg-white border-gray-200 focus:border-[hsl(210,90%,50%)]"
            />
          </div>

          <div>
            <Label htmlFor="password"className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</Label>
            <div className="relative">
              <Input
                id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full h-12 px-4 pr-12 rounded-lg border-2 bg-white border-gray-200 focus:border-[hsl(210,90%,50%)]"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 text-gray-400">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold text-white rounded-lg disabled:opacity-60" style={{ backgroundColor: newAccentColor }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar Sesión'}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold" style={{ color: newPrimaryColor }}>Regístrate aquí</Link>
          </p>
        </div>
      </motion.div>
    </div>
    </>
  );
};

export default LoginPage;