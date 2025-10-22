import React, { useState, useEffect } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { toast } from '@/components/ui/use-toast';
    import { LockKeyhole, Eye, EyeOff, Loader2 } from 'lucide-react';
    import { Helmet } from 'react-helmet-async';
    import { supabase } from '@/lib/supabaseClient';

    const ResetPasswordPage = () => {
      const navigate = useNavigate();
      const { updatePassword, loading } = useAuth();
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const [tokenProcessed, setTokenProcessed] = useState(false);

      useEffect(() => {
        const handleToken = async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error al obtener sesión:', error);
            toast({ title: "Error de sesión", description: "No se pudo verificar tu sesión. Intenta de nuevo.", variant: "destructive" });
            navigate('/login');
            return;
          }

          if (!session) {
            const hash = window.location.hash;
            if (hash.includes('access_token')) {
              const params = new URLSearchParams(hash.substring(1));
              const access_token = params.get('access_token');
              const refresh_token = params.get('refresh_token');

              if (access_token && refresh_token) {
                const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
                if (sessionError) {
                  console.error('Error al establecer sesión con token:', sessionError);
                  toast({ title: 'Enlace inválido', description: 'El enlace de recuperación es inválido o ha expirado.', variant: 'destructive' });
                  navigate('/login');
                  return;
                }
              }
            } else {
              console.log("No hay sesión ni token en la URL.");
              toast({ title: 'Enlace inválido', description: 'El enlace de recuperación es inválido o ha expirado.', variant: 'destructive' });
              navigate('/login');
              return;
            }
          }
          setTokenProcessed(true);
        };

        handleToken();
      }, [navigate]);

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
          toast({ title: 'Contraseña muy corta', description: 'La contraseña debe tener al menos 6 caracteres.', variant: 'destructive' });
          return;
        }
        if (password !== confirmPassword) {
          toast({ title: 'Las contraseñas no coinciden', description: 'Por favor, asegúrate de que ambas contraseñas sean iguales.', variant: 'destructive' });
          return;
        }

        try {
          await updatePassword(password);
          toast({
            title: "¡Contraseña actualizada!",
            description: "Tu contraseña se ha cambiado correctamente. Ya puedes iniciar sesión.",
            className: "bg-green-100 text-green-800",
          });
          navigate('/login');
        } catch (error) {
          toast({
            title: "Error al actualizar",
            description: error.message || "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
            variant: "destructive"
          });
        }
      };
      
      if (!tokenProcessed) {
        return (
          <div className="min-h-screen bg-slate-100 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        );
      }

      return (
        <>
        <Helmet>
            <title>Restablecer Contraseña – ViajaFácil</title>
            <meta name="description" content="Crea una nueva contraseña para tu cuenta de ViajaFácil." />
        </Helmet>
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <motion.div 
            className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LockKeyhole className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Crea tu nueva contraseña</h1>
              <p className="text-gray-600 mt-2">Ingresa una contraseña segura y que puedas recordar.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Al menos 6 caracteres"
                    required
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                  />
                   <Button type="button" variant="ghost" size="icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-gray-400">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Guardar y Continuar'}
              </Button>
            </form>
          </motion.div>
        </div>
        </>
      );
    };

    export default ResetPasswordPage;