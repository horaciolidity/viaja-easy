import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabaseClient';

const logoUrl =
  'https://horizons-cdn.hostinger.com/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/3a09a949b47cc959adb2761d2bc44da5.png';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Email requerido',
        description: 'Por favor, ingresa tu email.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // ✅ Si usas una Function personalizada en Supabase
      const { data, error } = await supabase.functions.invoke('request-password-reset-otp', {
        body: JSON.stringify({ email }),
      });

      if (error) throw new Error(error.message);

      const responseData = data?.error ? JSON.parse(data.error) : data;
      if (responseData?.error) throw new Error(responseData.error);

      toast({
        title: '¡Revisá tu correo!',
        description: 'Te enviamos un código de 6 dígitos para restablecer tu contraseña.',
        className: 'bg-green-100 text-green-800',
      });

      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      const defaultMsg =
        'No se pudo enviar el correo. Verificá el email e intentalo de nuevo.';
      const message = err.message.includes('No se encontró un usuario')
        ? 'No existe una cuenta con ese correo. ¿Querés registrarte?'
        : err.message || defaultMsg;

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Recuperar Contraseña – ViajaFácil</title>
        <meta
          name="description"
          content="Solicitá un código para restablecer tu contraseña de ViajaFácil."
        />
      </Helmet>

      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 flex flex-col">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/login')}
            className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Button>
        </div>

        <motion.div
          className="flex-grow flex flex-col justify-center items-center px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-full max-w-md text-center">
            <img src={logoUrl} alt="ViajaFácil Logo" className="w-48 h-auto mx-auto mb-6" />

            <h2 className="text-3xl font-bold mb-2">¿Olvidaste tu contraseña?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              No te preocupes. Ingresá tu email y te mandamos un código para que la recuperes.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div>
                <Label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-200">
                  Email
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full h-12 pl-10 pr-4 rounded-lg border-2 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Código'}
              </Button>
            </form>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">
              ¿Recordaste tu contraseña?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Volver a iniciar sesión
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
