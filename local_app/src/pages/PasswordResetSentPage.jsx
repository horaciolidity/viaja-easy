import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const PasswordResetSentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Correo Enviado – ViajaFácil</title>
        <meta name="description" content="Revisa tu correo para restablecer tu contraseña." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <MailCheck className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Correo enviado!</h1>
          <p className="text-gray-600 mb-6">
            Te enviamos un correo a <span className="font-semibold text-blue-600">{email}</span>. 
            Por favor, hacé clic en el enlace para restablecer tu contraseña.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            ¿No lo encontrás? Revisá tu carpeta de spam o correo no deseado.
          </p>
          <Link to="/login">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Volver a Iniciar Sesión
            </Button>
          </Link>
        </motion.div>
      </div>
    </>
  );
};

export default PasswordResetSentPage;