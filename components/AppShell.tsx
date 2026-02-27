'use client';
// ─── AppShell — Cockpit Layout ─────────────────────────────────────────────────
// Sidebar (fixed left) + Header (sticky top) + Content + Mobile Bottom Nav

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
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

    // Load collapse preference from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('saga_eng_sidebar_collapsed');
            if (saved === 'true') setSidebarCollapsed(true);
        } catch { }
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

                    {/* Center: Obra pill (hidden on very small screens) */}
                    {obra && (
                        <Link
                            href="/selecionar-obra"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 10px', borderRadius: 20,
                                background: 'rgba(82,168,123,0.12)',
                                border: '1px solid rgba(82,168,123,0.25)',
                                textDecoration: 'none',
                                maxWidth: 160, overflow: 'hidden',
                            }}
                        >
                            <MapPin size={11} style={{ color: 'var(--green-primary)', flexShrink: 0 }} />
                            <span style={{
                                fontSize: 11, fontWeight: 600, color: 'var(--green-primary)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {obra.nome}
                            </span>
                            <ChevronDown size={10} style={{ color: 'var(--green-primary)', flexShrink: 0 }} />
                        </Link>
                    )}
                    {!obra && (
                        <Link
                            href="/selecionar-obra"
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 10px', borderRadius: 20,
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                textDecoration: 'none',
                            }}
                        >
                            <MapPin size={11} style={{ color: '#EF4444' }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#EF4444' }}>Selecionar obra</span>
                            <ChevronRight size={10} style={{ color: '#EF4444' }} />
                        </Link>
                    )}

                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* User initials */}
                        <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'var(--saga-gray)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#fff',
                            letterSpacing: '0.05em', flexShrink: 0,
                        }}>
                            {initials}
                        </div>

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
