'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    HardHat, Mountain, ClipboardList, CheckSquare, BookOpen,
    FolderOpen, FileText, ShoppingCart, Bot, GraduationCap,
    HelpCircle, Building2, Truck, Settings2,
    ChevronDown, ChevronLeft, ChevronRight, Menu,
} from 'lucide-react';

// ─── Nav structure ─────────────────────────────────────────────────────────────
const NAV_GROUPS = [
    {
        label: 'Engenharia',
        icon: '🏗️',
        items: [
            { href: '/concreto', icon: <HardHat size={15} />, label: 'Concretagem' },
            { href: '/terraplanagem', icon: <Mountain size={15} />, label: 'Terraplanagem' },
            { href: '/equipamentos', icon: <Settings2 size={15} />, label: 'Equipamentos' },
            { href: '/caminhoes', icon: <Truck size={15} />, label: 'Caminhões' },
        ],
    },
    {
        label: 'Controle & Qualidade',
        icon: '📊',
        items: [
            { href: '/rdo', icon: <ClipboardList size={15} />, label: 'RDO' },
            { href: '/inspecoes', icon: <CheckSquare size={15} />, label: 'FVS' },
            { href: '/instrucoes-trabalho', icon: <BookOpen size={15} />, label: 'IT' },
        ],
    },
    {
        label: 'Documentação',
        icon: '📁',
        items: [
            { href: '/projetos', icon: <FolderOpen size={15} />, label: 'Projetos' },
            { href: '/documentos', icon: <FileText size={15} />, label: 'Documentos' },
        ],
    },
    {
        label: 'Suporte',
        icon: '⚙️',
        items: [
            { href: '/suprimentos', icon: <ShoppingCart size={15} />, label: 'Suprimentos' },
            { href: '/assistente', icon: <Bot size={15} />, label: 'Assistente IA' },
            { href: '/ead', icon: <GraduationCap size={15} />, label: 'EAD' },
            { href: '/faq', icon: <HelpCircle size={15} />, label: 'FAQ / DRH' },
        ],
    },
];

interface SidebarProps {
    mobileOpen: boolean;
    onMobileClose: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        'Engenharia': true, 'Controle & Qualidade': true, 'Documentação': true, 'Suporte': false,
    });

    const toggle = (label: string) => setOpenGroups(p => ({ ...p, [label]: !p[label] }));

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href.split('?')[0]);
    };

    const sidebarContent = (isMobile = false) => (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-subtle)',
            overflow: 'hidden',
        }}>
            {/* Logo */}
            <a href="/dashboard" style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed && !isMobile ? 0 : 10,
                padding: '0 14px',
                height: 'var(--header-height)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                flexShrink: 0,
                overflow: 'hidden',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ico-branco.png" alt="SAGA" style={{ height: 26, width: 'auto', flexShrink: 0 }} />
                {(!collapsed || isMobile) && (
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif", letterSpacing: '1.5px' }}>SAGA</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Engenharia</div>
                    </div>
                )}
            </a>

            {/* Nav groups */}
            <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
                {NAV_GROUPS.map(group => {
                    const isOpen = openGroups[group.label] !== false;
                    return (
                        <div key={group.label} style={{ marginBottom: 2 }}>
                            {(!collapsed || isMobile) ? (
                                <button
                                    onClick={() => toggle(group.label)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center',
                                        gap: 8, padding: '7px 14px', background: 'transparent',
                                        border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', fontSize: 10,
                                        fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
                                        fontFamily: "'Raleway', sans-serif",
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 11 }}>{group.icon}</span>
                                        {group.label}
                                    </span>
                                    <ChevronDown size={11} style={{
                                        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                        transition: 'transform 0.2s', opacity: 0.5,
                                    }} />
                                </button>
                            ) : (
                                <div style={{ fontSize: 13, textAlign: 'center', padding: '6px 0 3px', color: 'var(--text-muted)', opacity: 0.5 }}>
                                    {group.icon}
                                </div>
                            )}

                            {(isOpen || (collapsed && !isMobile)) && (
                                <div>
                                    {group.items.map(item => {
                                        const active = isActive(item.href);
                                        return (
                                            <a
                                                key={item.href}
                                                href={item.href}
                                                onClick={isMobile ? onMobileClose : undefined}
                                                title={collapsed && !isMobile ? item.label : undefined}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: collapsed && !isMobile ? 0 : 10,
                                                    padding: collapsed && !isMobile ? '9px 0' : '7px 14px 7px 28px',
                                                    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                                                    textDecoration: 'none',
                                                    color: active ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: 13, fontWeight: active ? 600 : 400,
                                                    borderLeft: collapsed && !isMobile ? 'none' : (active ? '2px solid var(--saga-gray-light)' : '2px solid transparent'),
                                                    borderRight: collapsed && !isMobile && active ? '2px solid var(--saga-gray-light)' : 'none',
                                                    background: active ? 'rgba(82,95,107,0.15)' : 'transparent',
                                                    transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={e => {
                                                    if (!active) {
                                                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                                                        (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!active) {
                                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                                                    }
                                                }}
                                            >
                                                <span style={{
                                                    opacity: active ? 1 : 0.6,
                                                    color: active ? 'var(--saga-gray-light)' : 'inherit',
                                                    flexShrink: 0,
                                                }}>
                                                    {item.icon}
                                                </span>
                                                {(!collapsed || isMobile) && item.label}
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Obras link */}
            {(!collapsed || isMobile) && (
                <a
                    href="/obras"
                    onClick={isMobile ? onMobileClose : undefined}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px',
                        borderTop: '1px solid var(--border-subtle)',
                        borderBottom: '1px solid var(--border-subtle)',
                        textDecoration: 'none',
                        color: pathname.startsWith('/obras') ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: 12, fontWeight: 600,
                        background: pathname.startsWith('/obras') ? 'rgba(82,95,107,0.1)' : 'transparent',
                        transition: 'all 0.15s',
                    }}
                >
                    <Building2 size={15} />
                    Obras
                </a>
            )}

            {/* Collapse toggle */}
            {!isMobile && (
                <button
                    onClick={onToggleCollapse}
                    title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                    style={{
                        width: '100%', padding: '10px 0',
                        background: 'transparent', border: 'none',
                        borderTop: '1px solid var(--border-subtle)',
                        cursor: 'pointer', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontSize: 11, fontWeight: 600,
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                    {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={13} /><span>Recolher</span></>}
                </button>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className="sidebar-desktop"
                style={{
                    position: 'fixed', top: 0, left: 0,
                    width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
                    height: '100vh',
                    zIndex: 50, overflowY: 'auto', overflowX: 'hidden',
                    transition: 'width 0.22s ease',
                }}
            >
                {sidebarContent(false)}
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 150,
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    }}
                    onClick={onMobileClose}
                />
            )}

            {/* Mobile drawer */}
            <aside style={{
                position: 'fixed', top: 0, left: 0,
                width: 240, height: '100vh',
                zIndex: 160, overflowY: 'auto',
                transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s ease',
            }}>
                {sidebarContent(true)}
            </aside>
        </>
    );
}

// ─── Mobile toggle button ──────────────────────────────────────────────────────
export function SidebarToggle({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', padding: 6, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            className="sidebar-toggle"
            aria-label="Menu"
        >
            <Menu size={20} />
        </button>
    );
}
