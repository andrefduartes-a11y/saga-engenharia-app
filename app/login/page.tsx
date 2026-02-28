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

        if (error) {
            setError('E-mail ou senha incorretos.')
            setLoading(false)
            return
        }

        router.push('/dashboard')
        router.refresh()
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#111' }}>

            {/* ── Topo cinza com listras ─────────────────────────────────── */}
            <div style={{
                flex: '0 0 46vh',
                position: 'relative',
                overflow: 'hidden',
                background: '#3a3f3a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 16,
            }}>
                {/* Listras diagonais (SVG pattern) */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}>
                    <defs>
                        <pattern id="stripes" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect x="0" y="0" width="14" height="28" fill="white" />
                            <rect x="14" y="0" width="14" height="28" fill="transparent" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#stripes)" />
                </svg>

                {/* Gradiente de escurecimento nas bordas */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)' }} />

                {/* Ícone S */}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/S-construtora-branco-linhas.png"
                        alt="SAGA"
                        style={{ width: 140, height: 140, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}
                    />
                </div>

                {/* Tagline */}
                <p style={{ position: 'relative', zIndex: 1, fontSize: 13, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', letterSpacing: '0.02em' }}>
                    &quot;Uma assinatura de qualidade&quot;
                </p>

                {/* Borda curva inferior */}
                <div style={{
                    position: 'absolute', bottom: -2, left: 0, right: 0, height: 36,
                    background: '#111',
                    borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                }} />
            </div>

            {/* ── Card inferior escuro ──────────────────────────────────────── */}
            <div style={{ flex: 1, background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 24px 32px' }}>

                {/* Logo preferencial */}
                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-preferencial-branco.png" alt="SAGA Engenharia" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
                </div>

                {/* Títulos */}
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#ffffff', textAlign: 'center', marginBottom: 4, letterSpacing: '-0.5px' }}>
                    Acesso Restrito
                </h1>
                <div style={{ width: 40, height: 3, borderRadius: 2, background: '#52A87B', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 24 }}>
                    Gestão de Obras
                </p>

                {/* Formulário */}
                <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: 6 }}>
                            E-mail
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="seu@saga.com.br"
                            style={{
                                width: '100%', padding: '14px 16px',
                                borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#ffffff', fontSize: 14,
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: 6 }}>
                            Senha
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            style={{
                                width: '100%', padding: '14px 16px',
                                borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#ffffff', fontSize: 14,
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, color: '#f87171' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: 8,
                            padding: '15px', borderRadius: 12,
                            background: loading ? 'rgba(82,168,123,0.5)' : 'linear-gradient(135deg, #52A87B, #3d8460)',
                            border: 'none', color: '#fff',
                            fontSize: 13, fontWeight: 800,
                            letterSpacing: '1.5px', textTransform: 'uppercase',
                            cursor: loading ? 'wait' : 'pointer',
                            boxShadow: '0 6px 20px rgba(82,168,123,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : 'Acessar Gestão de Obras'}
                    </button>
                </form>

                <p style={{ marginTop: 24, fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    SAGA Engenharia · Uso interno
                </p>
            </div>
        </div>
    )
}
