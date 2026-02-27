'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Users, Building2, Shield } from 'lucide-react'

interface MenuItem {
    href: string
    icon: React.ElementType
    label: string
    desc: string
    adminOnly: boolean
}

const MENU: MenuItem[] = [
    {
        href: '/configuracoes/usuarios',
        icon: Users,
        label: 'Usuários & Permissões',
        desc: 'Cadastrar usuários e definir permissões de acesso',
        adminOnly: true,
    },
    {
        href: '/configuracoes/acesso',
        icon: Building2,
        label: 'Controle de Acesso por Obra',
        desc: 'Definir quais obras cada usuário pode visualizar',
        adminOnly: true,
    },
    {
        href: '/obras',
        icon: Shield,
        label: 'Obras',
        desc: 'Cadastrar e gerenciar obras do sistema',
        adminOnly: true,
    },
]

export default function ConfiguracoesPage() {
    const router = useRouter()
    const [role, setRole] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/me')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d?.role) setRole(d.role)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (!loading && role !== 'admin') {
        router.replace('/dashboard')
        return null
    }

    const items = MENU.filter(m => !m.adminOnly || role === 'admin')

    return (
        <div style={{ maxWidth: 620, paddingBottom: 60 }}>
            {/* Header — igual saga-executive */}
            <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(127,166,83,0.2), rgba(127,166,83,0.05))',
                    border: '1px solid rgba(127,166,83,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Settings size={22} style={{ color: 'var(--green-primary)' }} />
                </div>
                <div>
                    <h1 style={{
                        fontSize: 20, fontWeight: 800, color: 'var(--text-primary)',
                        fontFamily: "'Raleway', sans-serif",
                    }}>Configurações</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Cadastros e controle de acesso
                    </p>
                </div>
            </div>

            {/* Card list — igual saga-executive */}
            <div style={{ display: 'grid', gap: 10 }}>
                {loading
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="card" style={{
                            height: 76, borderRadius: 14,
                            background: 'rgba(255,255,255,0.03)',
                            animation: 'pulse 1.5s infinite',
                        }} />
                    ))
                    : items.map(item => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className="card"
                                style={{
                                    width: '100%',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 14,
                                    padding: '16px 18px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    transition: 'all 0.2s',
                                    background: 'var(--navy-card, rgba(255,255,255,0.03))',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(127,166,83,0.35)'
                                        ; (e.currentTarget as HTMLElement).style.background = 'rgba(127,166,83,0.05)'
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'
                                        ; (e.currentTarget as HTMLElement).style.background = 'var(--navy-card, rgba(255,255,255,0.03))'
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                    background: 'linear-gradient(135deg, rgba(127,166,83,0.18), rgba(127,166,83,0.05))',
                                    border: '1px solid rgba(127,166,83,0.22)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={20} style={{ color: 'var(--green-primary)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                                        {item.label}
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        {item.desc}
                                    </div>
                                </div>
                            </button>
                        )
                    })
                }
            </div>
        </div>
    )
}
