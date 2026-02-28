'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const form = e.currentTarget
        const email = (form.elements.namedItem('email') as HTMLInputElement).value
        const password = (form.elements.namedItem('password') as HTMLInputElement).value
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError('E-mail ou senha incorretos.'); setLoading(false); return }
        router.push('/dashboard')
        router.refresh()
    }

    return (
        /* 100dvh = viewport real no mobile (sem barra de URL do browser) */
        <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#111', overflow: 'hidden' }}>

            {/* ── Topo cinza com listras ────────────────────── 42% da altura */}
            <div style={{
                flex: '0 0 42%',
                position: 'relative',
                overflow: 'hidden',
                background: '#3a3f3a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 10,
            }}>
                {/* Listras diagonais */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}>
                    <defs>
                        <pattern id="stripes" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect x="0" y="0" width="14" height="28" fill="white" />
                            <rect x="14" y="0" width="14" height="28" fill="transparent" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#stripes)" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)' }} />

                {/* Ícone S */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/S-construtora-branco-linhas.png"
                    alt="SAGA"
                    style={{ position: 'relative', zIndex: 1, width: '36%', maxWidth: 130, height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))' }}
                />
                <p style={{ position: 'relative', zIndex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                    &quot;Uma assinatura de qualidade&quot;
                </p>

                {/* Borda curva inferior */}
                <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 30, background: '#111', borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
            </div>

            {/* ── Card inferior preto ─────────────────────── 58% da altura */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 24px 16px', overflowY: 'auto' }}>

                {/* Logo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-preferencial-branco.png" alt="SAGA" style={{ height: 34, width: 'auto', objectFit: 'contain', marginBottom: 10 }} />

                {/* Títulos */}
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', textAlign: 'center', marginBottom: 3, letterSpacing: '-0.5px' }}>
                    Acesso Restrito
                </h1>
                <div style={{ width: 38, height: 2, borderRadius: 2, background: '#888', margin: '0 auto 6px' }} />
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 18 }}>
                    Gestão de Obras
                </p>

                {/* Formulário */}
                <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: 5 }}>
                            E-mail
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="seu@saga.com.br"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#ffffff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: 5 }}>
                            Senha
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#ffffff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '9px 12px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 12 }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: 4, padding: '14px',
                            borderRadius: 11,
                            background: loading ? '#333' : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff', fontSize: 12, fontWeight: 800,
                            letterSpacing: '1.8px', textTransform: 'uppercase',
                            cursor: loading ? 'wait' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                        }}
                    >
                        {loading ? <><Loader2 size={15} className="animate-spin" /> Entrando...</> : 'Acessar Gestão de Obras'}
                    </button>
                </form>

                <p style={{ marginTop: 14, fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    SAGA Engenharia · Uso interno
                </p>
            </div>
        </div>
    )
}
