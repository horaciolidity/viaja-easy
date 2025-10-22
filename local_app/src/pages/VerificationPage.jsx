import React, { useEffect } from 'react';
    import { useLocation, useNavigate, Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { MailCheck } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { Helmet } from 'react-helmet-async';

    const VerificationPage = () => {
      const navigate = useNavigate();
      const location = useLocation();
      const { user } = useAuth();
      const email = location.state?.email;
      
      useEffect(() => {
        const params = new URLSearchParams(location.search);
        const justVerified = params.get('verified') === 'true';

        if (justVerified) {
          toast({
              title: "¡Cuenta activada!",
              description: "Ya puedes iniciar sesión con tu cuenta.",
              className: "bg-green-100 text-green-800"
          });
          navigate('/login', { replace: true, state: { fromVerification: true } });
        } else if (user?.email_confirmed_at) {
          navigate('/login', { replace: true });
        } else if (!email) {
          navigate('/login', { replace: true });
        }
      }, [user, email, navigate, location]);
      
      return (
        <>
        <Helmet>
            <title>Verifica tu cuenta – ViajaFácil</title>
            <meta name="description" content="Revisa tu correo electrónico para completar el registro en ViajaFácil." />
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Casi listo! Revisa tu correo</h1>
            <p className="text-gray-600 mb-6">
              Te enviamos un correo de verificación a <span className="font-semibold text-blue-600">{email}</span>. 
              Por favor, haz clic en el enlace para activar tu cuenta.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              ¿No lo encuentras? Revisa tu carpeta de spam o correo no deseado.
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

    export default VerificationPage;