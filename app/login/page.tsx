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
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 20px',
        }}>
            {/* Logo */}
            <div style={{ marginBottom: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/logo-full.png"
                    alt="SAGA Construtora"
                    style={{
                        height: '56px',
                        width: 'auto',
                        objectFit: 'contain',
                        filter: 'brightness(0) invert(1)',
                    }}
                    onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement
                        el.style.display = 'none'
                        const fallback = document.getElementById('login-logo-fallback')
                        if (fallback) fallback.style.display = 'block'
                    }}
                />
                {/* Fallback texto */}
                <div id="login-logo-fallback" style={{ display: 'none', textAlign: 'center' }}>
                    <div style={{
                        fontSize: '36px',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        color: 'var(--text-primary)',
                    }}>SAGA</div>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 300,
                        letterSpacing: '0.3em',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        marginTop: '2px',
                    }}>CONSTRUTORA</div>
                </div>
            </div>

            {/* Card de login */}
            <div style={{
                width: '100%',
                maxWidth: '380px',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                padding: '32px 24px',
            }}>
                <h1 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                    textAlign: 'center',
                    letterSpacing: '-0.01em',
                }}>
                    Área Restrita
                </h1>
                <p style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginBottom: '28px',
                    letterSpacing: '0.02em',
                }}>
                    Sistema de Gestão de Obras
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label className="label">E-mail</label>
                        <input
                            name="email"
                            type="email"
                            className="input"
                            placeholder="seu@email.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label className="label">Senha</label>
                        <input
                            name="password"
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(217, 82, 82, 0.1)',
                            border: '1px solid rgba(217, 82, 82, 0.25)',
                            fontSize: '13px',
                            color: '#D95252',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ marginTop: '8px' }}
                    >
                        {loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Entrando...</>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p style={{
                marginTop: '32px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
            }}>
                SAGA Construtora · Uso interno
            </p>
        </div>
    )
}
