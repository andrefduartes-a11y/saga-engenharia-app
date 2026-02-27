'use client'

import Link from 'next/link'
import { Users, Lock, ChevronRight, Settings } from 'lucide-react'

const CONFIG_SECTIONS = [
    {
        href: '/configuracoes/usuarios',
        icon: Users,
        label: 'Usuários & Permissões',
        desc: 'Cadastre usuários, defina perfis e controle granular de acesso a módulos',
        color: '#7FA653',
    },
    {
        href: '/configuracoes/acesso',
        icon: Lock,
        label: 'Controle de Acesso por Obra',
        desc: 'Defina quais obras cada engenheiro pode visualizar no app',
        color: '#5B9BD5',
    },
]

export default function ConfiguracoesPage() {
    return (
        <div style={{ maxWidth: 700 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(127,166,83,0.12)',
                    border: '1px solid rgba(127,166,83,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Settings size={20} style={{ color: 'var(--green-primary)' }} />
                </div>
                <div>
                    <h1 style={{
                        fontSize: 18, fontWeight: 800, color: 'var(--text-primary)',
                        fontFamily: "'Raleway', sans-serif",
                    }}>
                        Configurações
                    </h1>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Administração do sistema — somente para administradores
                    </p>
                </div>
            </div>

            {/* Cards */}
            <div style={{ display: 'grid', gap: 14 }}>
                {CONFIG_SECTIONS.map(({ href, icon: Icon, label, desc, color }) => (
                    <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                        <div
                            className="card"
                            style={{
                                padding: '18px 20px',
                                display: 'flex', alignItems: 'center', gap: 16,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                borderLeft: `3px solid ${color}`,
                            }}
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement
                                el.style.background = 'var(--bg-elevated)'
                                el.style.transform = 'translateX(3px)'
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement
                                el.style.background = 'var(--bg-card)'
                                el.style.transform = 'translateX(0)'
                            }}
                        >
                            <div style={{
                                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                background: `${color}18`,
                                border: `1px solid ${color}22`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon size={20} style={{ color }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {label}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                                    {desc}
                                </div>
                            </div>
                            <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
