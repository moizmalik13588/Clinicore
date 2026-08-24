import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard, Users, Calendar,
    Phone, Brain, Settings, LogOut,
    X, ChevronRight, BarChart2, Stethoscope,
} from 'lucide-react';
import { clearAuth, getUser } from '../../../lib/auth';
import { authApi } from '../../../lib/api';

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/calls', label: 'Call Logs', icon: Phone },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/mood', label: 'Mood Analytics', icon: Brain },
    { to: '/setup', label: 'Setup', icon: Settings },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const navigate = useNavigate();
    const user = getUser();

    async function handleLogout() {
        try {
            const token = localStorage.getItem('refresh_token') || '';
            await authApi.logout(token);
        } catch { /* ignore */ }
        clearAuth();
        navigate('/login');
    }

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
        fixed top-0 left-0 h-full w-60 bg-dark-card border-r border-dark-border
        z-30 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center">
                            <span className="text-base">🏥</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-dark-text">Clinicore</p>
                            <p className="text-[10px] text-dark-muted leading-none">Clinic OS</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-dark-muted hover:text-dark-text">
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                transition-colors group
                ${isActive
                                    ? 'bg-primary-600/20 text-primary-400 font-medium'
                                    : 'text-dark-muted hover:bg-dark-hover hover:text-dark-text'
                                }
              `}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={17} className={isActive ? 'text-primary-400' : ''} />
                                    <span className="flex-1">{label}</span>
                                    {isActive && <ChevronRight size={14} className="text-primary-400" />}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User + Logout */}
                <div className="px-3 py-4 border-t border-dark-border space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-dark-bg/50">
                        <div className="w-7 h-7 rounded-full bg-primary-600/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-400">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-dark-text truncate">
                                {user?.clinicName || 'Clinic'}
                            </p>
                            <p className="text-[10px] text-dark-muted truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                       text-dark-muted hover:bg-red-500/10 hover:text-red-400
                       transition-colors w-full"
                    >
                        <LogOut size={17} />
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}