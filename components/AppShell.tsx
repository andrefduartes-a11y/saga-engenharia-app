'use client';
// ─── AppShell — Cockpit Layout ─────────────────────────────────────────────────
// Sidebar (fixed left) + Header (sticky top) + Content + Mobile Bottom Nav

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { LogOut, MapPin, ChevronDown, ChevronRight, Bell, Settings, X } from 'lucide-react';
import Link from 'next/link';
import Sidebar, { SidebarToggle } from './Sidebar';
import { useObra } from '@/lib/obra-context';
import {
    LayoutDashboard, Building2, User,
} from 'lucide-react';

// Mobile bottom nav items
const MOBILE_NAV = [
    { href: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Início' },
    { href: '/obras', icon: <Building2 size={22} />, label: 'Obras' },
    { href: '/perfil', icon: <User size={22} />, label: 'Perfil' },
];

interface AppShellProps {
    title: string;
    activeNav: string;
    user?: { email?: string } | null;
    onLogout?: () => void;
    children: React.ReactNode;
}

export default function AppShell({ title, activeNav, user, onLogout, children }: AppShellProps) {
    const router = useRouter();
    const { obra } = useObra();

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [role, setRole] = useState('');
    const [roleFetched, setRoleFetched] = useState(false);
    const [showBell, setShowBell] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    // Load collapse preference from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('saga_eng_sidebar_collapsed');
            if (saved === 'true') setSidebarCollapsed(true);
        } catch { }
    }, []);

    // Fetch user role
    useEffect(() => {
        fetch('/api/me')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.role) setRole(d.role); setRoleFetched(true); })
            .catch(() => setRoleFetched(true));
    }, []);

    // Close bell on outside click
    useEffect(() => {
        function onOut(e: MouseEvent) {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
        }
        document.addEventListener('mousedown', onOut);
        return () => document.removeEventListener('mousedown', onOut);
    }, []);

    const toggleCollapse = () => {
        setSidebarCollapsed(v => {
            const next = !v;
            try { localStorage.setItem('saga_eng_sidebar_collapsed', String(next)); } catch { }
            return next;
        });
    };

    const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'SG';

    const handleLogout = async () => {
        if (onLogout) { onLogout(); return; }
        router.push('/login');
    };

    return (
        <div className="page-root cockpit-layout">
            {/* ── Watermark ── */}
            <div className="watermark-bg" />

            {/* ── Sidebar ── */}
            <Sidebar
                mobileOpen={mobileSidebarOpen}
                onMobileClose={() => setMobileSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={toggleCollapse}
            />

            {/* ── Main area ── */}
            <div
                className="cockpit-main"
                style={{
                    marginLeft: `var(${sidebarCollapsed ? '--sidebar-collapsed-width' : '--sidebar-width'})`,
                    transition: 'margin-left 0.22s ease',
                }}
            >
                {/* ── Top Header ── */}
                <header className="cockpit-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Mobile sidebar toggle */}
                        <SidebarToggle onClick={() => setMobileSidebarOpen(true)} />

                        {/* Page title */}
                        <div style={{
                            fontSize: 13, fontWeight: 700,
                            color: 'var(--text-secondary)',
                            fontFamily: "'Raleway', sans-serif",
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}>{title}</div>
                    </div>




                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

                        {/* Bell */}
                        <div ref={bellRef} style={{ position: 'relative' }}>
                            <button onClick={() => setShowBell(v => !v)} style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: 'var(--text-secondary)', padding: 6, borderRadius: 8,
                                display: 'flex', alignItems: 'center',
                            }} title="Notificações">
                                <Bell size={17} />
                            </button>
                            {showBell && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                    width: 280, background: 'rgba(22,26,24,0.99)',
                                    backdropFilter: 'blur(16px)',
                                    border: '1px solid var(--border-subtle)', borderRadius: 10,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200,
                                }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
                                    }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Notificações</span>
                                        <button onClick={() => setShowBell(false)} style={{
                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                            color: 'var(--text-muted)', padding: 2,
                                        }}><X size={14} /></button>
                                    </div>
                                    <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                                        Nenhuma notificação no momento.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Settings gear — diretor only */}
                        {roleFetched && (role === 'diretor' || role === 'admin') && (
                            <button onClick={() => router.push('/configuracoes')} style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: 'var(--text-secondary)', padding: 6, borderRadius: 8,
                                display: 'flex', alignItems: 'center',
                            }} title="Configurações">
                                <Settings size={16} />
                            </button>
                        )}

                        {/* Role chip */}
                        {roleFetched && role && (() => {
                            const colors: Record<string, { bg: string; color: string; border: string }> = {
                                diretor: { bg: 'rgba(127,166,83,0.15)', color: 'var(--green-primary)', border: 'rgba(127,166,83,0.3)' },
                                admin: { bg: 'rgba(127,166,83,0.15)', color: 'var(--green-primary)', border: 'rgba(127,166,83,0.3)' },
                                engenheiro: { bg: 'rgba(91,155,213,0.15)', color: '#5B9BD5', border: 'rgba(91,155,213,0.3)' },
                            };
                            const labels: Record<string, string> = { diretor: 'DIRETOR', admin: 'DIRETOR', engenheiro: 'ENGENHEIRO' };
                            const c = colors[role] || colors.engenheiro;
                            return (
                                <span style={{
                                    padding: '3px 9px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                                    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                                    letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap',
                                }}>
                                    {labels[role] || role}
                                </span>
                            );
                        })()}

                        {/* Logout */}
                        <button onClick={handleLogout} style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: 6,
                            display: 'flex', alignItems: 'center',
                        }} title="Sair">
                            <LogOut size={16} />
                        </button>
                    </div>
                </header>


                {/* ── Page Content ── */}
                <main className="cockpit-content animate-fade-up">
                    {children}
                </main>

                {/* ── Mobile Bottom Nav ── */}
                <nav className="bottom-nav-mobile" style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    background: 'rgba(26,31,36,0.97)', backdropFilter: 'blur(12px)',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex', justifyContent: 'space-around',
                    padding: '8px 0 14px', zIndex: 100,
                }}>
                    {MOBILE_NAV.map(n => {
                        const isActive = activeNav === n.href || activeNav.startsWith(n.href + '/');
                        return (
                            <Link key={n.href} href={n.href} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                textDecoration: 'none',
                                color: isActive ? 'var(--saga-gray-light)' : 'var(--text-muted)',
                                fontSize: 10, fontWeight: 600,
                                padding: '4px 12px',
                            }}>
                                <span style={{ opacity: isActive ? 1 : 0.65 }}>{n.icon}</span>
                                {n.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
