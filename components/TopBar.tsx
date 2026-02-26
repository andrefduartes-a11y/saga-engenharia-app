'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function TopBar({ user }: { user: { email?: string } | null }) {
    const router = useRouter()
    const supabase = createClient()

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
            {/* Logo — usando filtro CSS para deixar branca no fundo escuro */}
            <div className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/logo.png"
                    alt="SAGA Construtora"
                    style={{
                        height: '28px',
                        width: 'auto',
                        objectFit: 'contain',
                        filter: 'brightness(0) invert(1)',  /* inverte para branco */
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
                    <span style={{
                        fontWeight: 300,
                        fontSize: '10px',
                        letterSpacing: '0.25em',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                    }}>Construtora</span>
                </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
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
