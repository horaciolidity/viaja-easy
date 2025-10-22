import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Car, DollarSign, Settings, Bell, BarChart3, LogOut, UserCheck,
  FileText, Map, Clock, Users2, CarTaxiFront, FileStack, KeyRound, GitBranch,
  MessageSquare as MessageSquareHeart, Coins as HandCoins, Ticket, UserCog,
  FileBadge, FileCog, HeartPulse, AreaChart, Zap, CreditCard, Receipt, WalletCards, X, Menu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const linkClasses = (isActive) =>
  `flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800
   ${isActive ? 'bg-slate-800 text-white' : ''}`;

const sections = [
  { to: '/admin/overview', icon: <LayoutDashboard />, label: 'Resumen' },
  { to: '/admin/live-rides', icon: <Map />, label: 'Viajes en Vivo' },
  { to: '/admin/analytics', icon: <BarChart3 />, label: 'Analíticas' },
  {
    label: 'GESTIÓN DE VIAJES',
    links: [
      { to: '/admin/rides', icon: <Car />, label: 'Viajes Inmediatos' },
      { to: '/admin/scheduled-rides', icon: <Clock />, label: 'Viajes Programados' },
    ],
  },
  {
    label: 'GESTIÓN DE USUARIOS',
    links: [
      { to: '/admin/users', icon: <Users />, label: 'Todos los Usuarios' },
      { to: '/admin/passengers', icon: <Users2 />, label: 'Pasajeros' },
      { to: '/admin/drivers', icon: <UserCog />, label: 'Conductores' },
      { to: '/admin/user-documents', icon: <FileStack />, label: 'Documentos' },
      { to: '/admin/facial-verification', icon: <UserCheck />, label: 'Verificación Facial' },
    ],
  },
  {
    label: 'FINANZAS',
    links: [
      { to: '/admin/payments', icon: <CreditCard />, label: 'Pagos Generales' },
      { to: '/admin/driver-payments', icon: <Receipt />, label: 'Pagos a Conductores' },
      { to: '/admin/withdrawals', icon: <HandCoins />, label: 'Solicitudes de Retiro' },
      { to: '/admin/debts', icon: <WalletCards />, label: 'Deudas de Conductores' },
      { to: '/admin/promotions', icon: <Ticket />, label: 'Promociones' },
    ],
  },
  {
    label: 'CONFIGURACIÓN DE TARIFAS',
    links: [
      { to: '/admin/tariffs', icon: <DollarSign />, label: 'Tarifas Base' },
      { to: '/admin/pricing-zones', icon: <AreaChart />, label: 'Zonas de Precios' },
      { to: '/admin/surge-pricing', icon: <Zap />, label: 'Precios Dinámicos' },
    ],
  },
  {
    label: 'SOPORTE Y ASISTENCIA',
    links: [{ to: '/admin/assistance', icon: <MessageSquareHeart />, label: 'Centro de Asistencia' }],
  },
  {
    label: 'CONFIGURACIÓN GENERAL',
    links: [
      { to: '/admin/settings', icon: <Settings />, label: 'Ajustes Generales' },
      { to: '/admin/notifications', icon: <Bell />, label: 'Notificaciones' },
      { to: '/admin/vehicle-types', icon: <CarTaxiFront />, label: 'Tipos de Vehículo' },
    ],
  },
  {
    label: 'REGLAS Y DOCUMENTACIÓN',
    links: [
      { to: '/admin/driver-requirements', icon: <FileCog />, label: 'Requisitos Conductores' },
      { to: '/admin/passenger-rules', icon: <FileBadge />, label: 'Reglas Pasajeros' },
      { to: '/admin/legal-docs', icon: <FileText />, label: 'Documentos Legales' },
    ],
  },
  {
    label: 'SISTEMA',
    links: [
      { to: '/admin/system-health', icon: <HeartPulse />, label: 'Salud del Sistema' },
      { to: '/admin/api-keys', icon: <KeyRound />, label: 'Claves API' },
      { to: '/admin/app-versions', icon: <GitBranch />, label: 'Versiones de App' },
    ],
  },
];

function SidebarContent({ onClose, handleLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">ViajaFácil</h1>
        </div>
        {onClose && (
          <button aria-label="Cerrar menú" onClick={onClose} className="lg:hidden p-2 rounded-md hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-200" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto min-h-0 py-2">
        <ul className="space-y-1">
          {sections.map((item, i) => (
            <li key={i}>
              {item.links ? (
                <>
                  <h3 className="px-4 pt-4 pb-2 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                    {item.label}
                  </h3>
                  <ul className="space-y-1">
                    {item.links.map((sub, j) => (
                      <li key={j}>
                        <NavLink to={sub.to} className={({ isActive }) => linkClasses(isActive)} onClick={onClose}>
                          {sub.icon}
                          <span>{sub.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <NavLink to={item.to} className={({ isActive }) => linkClasses(isActive)} onClick={onClose}>
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 p-4 border-t border-slate-800">
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);

  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 🔒 Ocultar cualquier otro botón "menu" externo (para que funcione SOLO este)
  useEffect(() => {
    const root = rootRef.current;
    const externalButtons = Array.from(document.querySelectorAll('svg[data-lucide="menu"]'))
      .map(svg => svg.closest('button'))
      .filter(Boolean)
      .filter(btn => !root.contains(btn)); // excluimos el nuestro

    // guardamos estilo previo y ocultamos
    externalButtons.forEach(btn => {
      btn.dataset._prevDisplay = btn.style.display || '';
      btn.style.display = 'none';
    });

    // cleanup: restaurar cuando se desmonte
    return () => {
      externalButtons.forEach(btn => {
        btn.style.display = btn.dataset._prevDisplay || '';
        delete btn.dataset._prevDisplay;
      });
    };
  }, []);

  // Cerrar drawer al cambiar de ruta
  useEffect(() => { if (open) setOpen(false); /* eslint-disable-next-line */ }, [location.pathname]);

  // Cerrar con ESC
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div ref={rootRef} className="contents">
      {/* Botón hamburguesa propio (solo móvil) */}
      {!open && (
        <button
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md border border-slate-200 bg-white shadow"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Sidebar fijo en desktop */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 bg-slate-900 text-white">
        <SidebarContent handleLogout={handleLogout} />
      </aside>

      {/* Drawer móvil con overlay */}
      <div className={`lg:hidden ${open ? 'fixed inset-0 z-50' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <aside
          className={`absolute inset-y-0 left-0 w-72 bg-slate-900 text-white shadow-xl
                      transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog" aria-modal="true"
        >
          <SidebarContent onClose={() => setOpen(false)} handleLogout={handleLogout} />
        </aside>
      </div>
    </div>
  );
}