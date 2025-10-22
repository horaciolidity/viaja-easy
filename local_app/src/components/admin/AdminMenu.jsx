import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Users, Car, Map, Clock, DollarSign, FileText, Settings, Bell, Zap, BarChart2,
    Shield, FileType, Key, Info, LifeBuoy
} from 'lucide-react';

const menuSections = [
    {
        title: 'Principal',
        items: [
            { path: '/admin/overview', icon: LayoutDashboard, label: 'Resumen' },
            { path: '/admin/live-rides', icon: Map, label: 'Viajes en Vivo' },
            { path: '/admin/analytics', icon: BarChart2, label: 'Analíticas' },
        ]
    },
    {
        title: 'Gestión',
        items: [
            { path: '/admin/users', icon: Users, label: 'Usuarios' },
            { path: '/admin/rides', icon: Car, label: 'Viajes' },
            { path: '/admin/scheduled-rides', icon: Clock, label: 'Viajes Programados' },
            { path: '/admin/driver-payments', icon: DollarSign, label: 'Pagos a Conductores' },
        ]
    },
    {
        title: 'Soporte y Configuración',
        items: [
            { path: '/admin/assistance', icon: LifeBuoy, label: 'Asistencia' },
            { path: '/admin/settings', icon: Settings, label: 'Ajustes Generales' },
            { path: '/admin/notifications', icon: Bell, label: 'Notificaciones' },
            { path: '/admin/promotions', icon: Zap, label: 'Promociones' },
            { path: '/admin/vehicle-types', icon: FileType, label: 'Tipos de Vehículo' },
            { path: '/admin/tariffs', icon: DollarSign, label: 'Tarifas' },
        ]
    },
    {
        title: 'Avanzado',
        items: [
            { path: '/admin/system-health', icon: Shield, label: 'Salud del Sistema' },
            { path: '/admin/api-keys', icon: Key, label: 'Claves API' },
            { path: '/admin/legal-docs', icon: FileText, label: 'Documentos Legales' },
            { path: '/admin/app-versions', icon: Info, label: 'Versiones de App' },
        ]
    },
];

const AdminMenu = () => {
    const linkClasses = "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200";
    const activeLinkClasses = "bg-blue-100 text-blue-700 font-semibold shadow-sm";
    const inactiveLinkClasses = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

    return (
        <nav className="flex-1 overflow-y-auto py-6">
            {menuSections.map((section, index) => (
                <div key={index} className="mb-6">
                    <h3 className="px-4 mb-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">{section.title}</h3>
                    <div className="space-y-1 px-3">
                        {section.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            ))}
        </nav>
    );
};

export default AdminMenu;