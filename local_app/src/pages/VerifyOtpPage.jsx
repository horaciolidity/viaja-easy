import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, LockKeyhole, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabaseClient';

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!email) {
      toast({
        title: "Falta información",
        description: "No se encontró el email. Por favor, iniciá el proceso de nuevo.",
        variant: "destructive"
      });
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Contraseña muy corta', description: 'La contraseña debe tener al menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Las contraseñas no coinciden', description: 'Asegurate de que ambas contraseñas sean iguales.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-reset-code-and-update-password', {
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
      
      if (error) throw new Error(error.message);
      
      const responseData = data.error ? JSON.parse(data.error) : data;
      if (responseData.error) throw new Error(responseData.error);

      toast({
        title: "¡Contraseña actualizada!",
        description: "Tu contraseña se cambió con éxito. Ya podés iniciar sesión.",
        className: "bg-green-100 text-green-800",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error al verificar",
        description: error.message || "No se pudo cambiar la contraseña. El código puede ser incorrecto o haber expirado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Verificar y Restablecer Contraseña – ViajaFácil</title>
        <meta name="description" content="Ingresa tu código OTP y crea una nueva contraseña para tu cuenta de ViajaFácil." />
      </Helmet>
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
       <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/forgot-password')}
            className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
        </div>
        <motion.div 
          className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Casi listo, {email}</h1>
            <p className="text-gray-600 mt-2">Ingresá el código que te enviamos y tu nueva contraseña.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="code">Código de 6 dígitos</Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  required
                  className="w-full h-12 pl-10 pr-4 rounded-lg border-2 bg-white border-gray-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <div className="relative mt-1">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Al menos 6 caracteres"
                  required
                  className="w-full h-12 pl-10 pr-12 rounded-lg border-2 bg-white border-gray-200 focus:border-blue-500"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-gray-400">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <div className="relative mt-1">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  className="w-full h-12 pl-10 pr-12 rounded-lg border-2 bg-white border-gray-200 focus:border-blue-500"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-gray-400">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Restablecer y Entrar'}
            </Button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default VerifyOtpPage;