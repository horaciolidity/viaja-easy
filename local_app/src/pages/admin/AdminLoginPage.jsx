import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('penoguie@gmail.com');
  const [password, setPassword] = useState('Dongato1903');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Todos los campos son requeridos.');
      return;
    }
    
    try {
      const loggedInUser = await login(email, password, 'admin');
      if (loggedInUser && loggedInUser.user_type === 'admin') {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black p-4">
      <motion.div
        className="w-full max-w-md bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-8 md:p-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full shadow-lg mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Acceso Administrador</h1>
          <p className="text-slate-400">Ingresa para gestionar la plataforma.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email</Label>
            <Input
              id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              className="w-full h-12 px-4 rounded-lg border-2 bg-slate-700/50 border-slate-600 focus:border-blue-500 text-white"
            />
          </div>

          <div>
            <Label htmlFor="password"className="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</Label>
            <div className="relative">
              <Input
                id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 pr-12 rounded-lg border-2 bg-slate-700/50 border-slate-600 focus:border-blue-500 text-white"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-slate-400">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg flex items-center justify-center disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2.5" />
                Ingresando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2.5" />
                Ingresar al Panel
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;