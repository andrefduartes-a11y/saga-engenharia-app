'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogOut, ChevronDown, MapPin, Settings } from 'lucide-react'
import { useObra } from '@/lib/obra-context'

export default function TopBar({ user }: { user: { email?: string } | null }) {
    const router = useRouter()
    const supabase = createClient()
    const { obra } = useObra()

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const initials = user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : 'SG'

    return (
        <header className="topbar">
            {/* Logo */}
            <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/ico-branco.png"
                        alt="SAGA Construtora"
                        style={{
                            height: '38px',
                            width: 'auto',
                            objectFit: 'contain',
                        }}
                        onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement
                            el.style.display = 'none'
                            const fallback = el.nextElementSibling as HTMLElement | null
                            if (fallback) fallback.style.display = 'flex'
                        }}
                    />
                    {/* Fallback texto */}
                    <div
                        className="items-center gap-2"
                        style={{ display: 'none' }}
                    >
                        <span style={{
                            fontWeight: 700,
                            fontSize: '15px',
                            letterSpacing: '0.15em',
                            color: 'var(--text-primary)',
                        }}>SAGA</span>
                    </div>
                </Link>
            </div>

            {/* Obra selecionada — centro */}
            {obra && (
                <Link
                    href="/selecionar-obra"
                    className="flex items-center gap-1 px-3 py-1 rounded-full transition-colors"
                    style={{
                        background: 'rgba(127,166,83,0.15)',
                        border: '1px solid rgba(127,166,83,0.3)',
                        maxWidth: '160px',
                    }}
                    title="Trocar obra"
                >
                    <MapPin size={11} style={{ color: 'var(--green-primary)', flexShrink: 0 }} />
                    <span
                        className="text-xs font-semibold truncate"
                        style={{ color: 'var(--green-primary)' }}
                    >
                        {obra.nome}
                    </span>
                    <ChevronDown size={11} style={{ color: 'var(--green-primary)', flexShrink: 0 }} />
                </Link>
            )}

            {!obra && (
                <Link
                    href="/selecionar-obra"
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                    style={{
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#EF4444',
                    }}
                >
                    <MapPin size={11} />
                    Selecionar obra
                </Link>
            )}

            {/* Ações */}
            <div className="flex items-center gap-2">
                <Link
                    href="/configuracoes"
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    title="Configurações"
                >
                    <Settings size={16} />
                </Link>

                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{
                        background: 'var(--saga-gray)',
                        color: '#fff',
                        letterSpacing: '0.05em',
                    }}
                >
                    {initials}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    title="Sair"
                >
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    )
}
