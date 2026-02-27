'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut, ChevronDown, MapPin, Settings, Bell, X } from 'lucide-react'
import { useObra } from '@/lib/obra-context'

export default function TopBar({ user }: { user: { email?: string } | null }) {
    const router = useRouter()
    const supabase = createClient()
    const { obra } = useObra()
    const [role, setRole] = useState('')
    const [roleFetched, setRoleFetched] = useState(false)
    const [showBell, setShowBell] = useState(false)
    const bellRef = useRef<HTMLDivElement>(null)

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    useEffect(() => {
        fetch('/api/me')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (d?.role) setRole(d.role)
                setRoleFetched(true)
            })
            .catch(() => setRoleFetched(true))
    }, [])

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setShowBell(false)
            }
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    const roleLabels: Record<string, string> = {
        admin: 'ADMIN',
        engenheiro: 'ENGENHEIRO',
        visualizador: 'VIEWER',
    }

    const roleColors: Record<string, { bg: string; color: string; border: string }> = {
        admin: { bg: 'rgba(127,166,83,0.15)', color: 'var(--green-primary)', border: 'rgba(127,166,83,0.3)' },
        engenheiro: { bg: 'rgba(91,155,213,0.15)', color: '#5B9BD5', border: 'rgba(91,155,213,0.3)' },
        visualizador: { bg: 'rgba(156,163,175,0.12)', color: '#9CA3AF', border: 'rgba(156,163,175,0.25)' },
    }

    const chip = roleColors[role] || roleColors.engenheiro

    return (
        <header className="topbar">
            {/* Logo */}
            <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/ico-branco.png"
                        alt="SAGA Construtora"
                        style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
                        onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement
                            el.style.display = 'none'
                            const fallback = el.nextElementSibling as HTMLElement | null
                            if (fallback) fallback.style.display = 'flex'
                        }}
                    />
                    <div className="items-center gap-2" style={{ display: 'none' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.15em', color: 'var(--text-primary)' }}>SAGA</span>
                    </div>
                </Link>
            </div>

            {/* Obra selecionada — centro */}
            {obra ? (
                <Link
                    href="/selecionar-obra"
                    className="flex items-center gap-1 px-3 py-1 rounded-full transition-colors"
                    style={{ background: 'rgba(127,166,83,0.15)', border: '1px solid rgba(127,166,83,0.3)', maxWidth: '160px' }}
                    title="Trocar obra"
                >
                    <MapPin size={11} style={{ color: 'var(--green-primary)', flexShrink: 0 }} />
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--green-primary)' }}>
                        {obra.nome}
                    </span>
                    <ChevronDown size={11} style={{ color: 'var(--green-primary)', flexShrink: 0 }} />
                </Link>
            ) : (
                <Link
                    href="/selecionar-obra"
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
                >
                    <MapPin size={11} />
                    Selecionar obra
                </Link>
            )}

            {/* Ações — direita */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

                {/* Bell + Dropdown */}
                <div ref={bellRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowBell(v => !v)}
                        style={{
                            position: 'relative', background: 'transparent', border: 'none',
                            cursor: 'pointer', color: 'var(--text-secondary)',
                            padding: 6, borderRadius: 8,
                            display: 'flex', alignItems: 'center',
                        }}
                        title="Notificações"
                    >
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
                                <button
                                    onClick={() => setShowBell(false)}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                                Nenhuma notificação no momento.
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings gear — só admin */}
                {roleFetched && role === 'admin' && (
                    <button
                        onClick={() => router.push('/configuracoes')}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-secondary)', padding: 6, borderRadius: 8,
                            display: 'flex', alignItems: 'center',
                        }}
                        title="Configurações"
                    >
                        <Settings size={16} />
                    </button>
                )}

                {/* Role chip */}
                {roleFetched && role && (
                    <span style={{
                        padding: '3px 9px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: chip.bg, color: chip.color,
                        border: `1px solid ${chip.border}`,
                        letterSpacing: '0.5px', textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                    }}>
                        {roleLabels[role] || role}
                    </span>
                )}

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 6,
                        display: 'flex', alignItems: 'center',
                    }}
                    title="Sair"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    )
}
