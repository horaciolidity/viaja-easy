import React from 'react';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Menu, Bell, Settings, LogOut } from 'lucide-react';
    import { useNavigate } from 'react-router-dom';

    const AdminHeader = ({ user, onMenuClick, pageTitle, onLogout }) => {
      const navigate = useNavigate();

      return (
        <motion.header
          className="bg-white text-slate-800 shadow-sm sticky top-0 z-30 border-b border-slate-200"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMenuClick}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 lg:hidden"
                >
                  <Menu className="w-6 h-6" />
                </Button>
                
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{pageTitle || 'Panel de Administración'}</h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 md:space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin/notifications')} 
                  className="w-10 h-10 rounded-full relative hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <Bell className="w-5 h-5" />
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin/settings')}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                >
                  <Settings className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="w-10 h-10 rounded-full hover:bg-red-500/10 text-slate-500 hover:text-red-500"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-lg">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>
      );
    };

    export default AdminHeader;