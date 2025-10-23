import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const primaryColor = 'hsl(210, 90%, 50%)';
const primaryDark = 'hsl(210, 85%, 40%)';

const PasswordResetSentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  if (!email) return null;

  return (
    <>
      <Helmet>
        <title>Correo Enviado – ViajaFácil</title>
        <meta name="description" content="Revisa tu correo para restablecer tu contraseña." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6 transition-colors">
        <motion.div
          className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center border border-slate-100 dark:border-slate-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <MailCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
            ¡Correo enviado!
          </h1>

          <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
            Te enviamos un correo a{' '}
            <span className="font-semibold text-[hsl(210,90%,50%)] dark:text-sky-400">
              {email}
            </span>
            . Seguí el enlace para restablecer tu contraseña.
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            ¿No lo encontrás? Revisá tu carpeta de spam o correo no deseado.
          </p>

          <Link to="/login" className="block">
            <Button
              className="w-full font-semibold text-white"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = primaryDark)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
            >
              Volver a Iniciar Sesión
            </Button>
          </Link>
        </motion.div>
      </div>
    </>
  );
};

export default PasswordResetSentPage;
