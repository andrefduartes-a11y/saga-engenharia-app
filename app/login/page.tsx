'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    // Trava o scroll APENAS na página de login — remove ao sair
    useEffect(() => {
        const html = document.documentElement
        const body = document.body
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
        return () => {
            html.style.overflow = ''
            body.style.overflow = ''
        }
    }, [])

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
        <>
            <style>{`
                /* Breakpoint para telas muito pequenas */
                @media (max-height: 680px) {
                    .login-top    { flex: 0 0 34% !important; }
                    .login-s-img  { width: 30% !important; max-width: 80px !important; }
                    .login-tag    { display: none !important; }
                    .login-card   { padding: 16px 24px 12px !important; }
                    .login-logo   { height: 28px !important; margin-bottom: 8px !important; }
                    .login-title  { font-size: 22px !important; }
                    .login-sub    { margin-bottom: 12px !important; }
                    .login-input  { padding: 12px 14px !important; }
                    .login-btn    { padding: 13px !important; }
                    .login-footer { display: none !important; }
                }
            `}</style>

            {/*
              Layout idêntico ao Executive:
              - Topo: ~42% — cinza escuro com listras diagonais + S logo
              - Fundo: ~58% — preto com card de login
              - height: 100dvh + overflow hidden = sem scroll mobile
            */}
            <div style={{
                height: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: '#111',
            }}>

                {/* ═══════════════════════════════════════════════════
                    TOPO — cinza escuro com listras (Executive usa vermelho)
                    ═══════════════════════════════════════════════════ */}
                <div className="login-top" style={{
                    flex: '0 0 42%',
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#3a3a3a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 10,
                }}>
                    {/* Listras diagonais — mesmo padrão do Executive */}
                    <svg
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <pattern
                                id="diag"
                                x="0" y="0"
                                width="20" height="20"
                                patternUnits="userSpaceOnUse"
                                patternTransform="rotate(45)"
                            >
                                <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#diag)" />
                    </svg>

                    {/* Vinheta escura nas bordas (igual Executive) */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
                    }} />

                    {/* ── Logo S com linhas (ico-linhas-branco) ── */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/ico-linhas-branco.png"
                        alt="SAGA"
                        className="login-s-img"
                        style={{
                            position: 'relative', zIndex: 1,
                            width: '38%', maxWidth: 140,
                            height: 'auto', objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.6))',
                        }}
                    />

                    {/* Tagline */}
                    <p className="login-tag" style={{
                        position: 'relative', zIndex: 1,
                        fontSize: 13, color: 'rgba(255,255,255,0.72)',
                        fontStyle: 'italic', margin: 0,
                        letterSpacing: '0.3px',
                    }}>
                        &quot;Uma assinatura de qualidade&quot;
                    </p>

                    {/* ── Curva inferior (igual Executive) ── */}
                    <div style={{
                        position: 'absolute', bottom: -1, left: 0, right: 0,
                        height: 40,
                        background: '#111',
                        borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                    }} />
                </div>

                {/* ═══════════════════════════════════════════════════
                    CARD INFERIOR — preto (Executive usa #222)
                    flex: 1 1 0 + minHeight: 0 = nunca gera scroll
                    ═══════════════════════════════════════════════════ */}
                <div className="login-card" style={{
                    flex: '1 1 0', minHeight: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '20px 28px 18px',
                    overflowY: 'hidden',
                }}>

                    {/* Logo SAGA CONSTRUTORA (horizontal) */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo-preferencial-branco.png"
                        alt="SAGA Construtora"
                        className="login-logo"
                        style={{ height: 36, width: 'auto', objectFit: 'contain', marginBottom: 12 }}
                    />

                    {/* Título */}
                    <h1 className="login-title" style={{
                        fontSize: 28, fontWeight: 900, color: '#ffffff',
                        textAlign: 'center', margin: '0 0 6px',
                        letterSpacing: '-0.5px',
                    }}>
                        Acesso Restrito
                    </h1>

                    {/* Linha separadora — cinza (Executive usa vermelho) */}
                    <div style={{ width: 44, height: 2, borderRadius: 2, background: '#666', margin: '0 auto 8px' }} />

                    {/* Subtítulo */}
                    <p className="login-sub" style={{
                        fontSize: 10, color: 'rgba(255,255,255,0.38)',
                        textAlign: 'center', letterSpacing: '2.5px',
                        textTransform: 'uppercase', margin: '0 0 18px',
                    }}>
                        Gestão de Obras
                    </p>

                    {/* ── Formulário ── */}
                    <form
                        onSubmit={handleSubmit}
                        style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 }}
                    >
                        {/* E-mail */}
                        <div>
                            <label style={{
                                fontSize: 10, fontWeight: 700,
                                color: 'rgba(255,255,255,0.45)',
                                textTransform: 'uppercase', letterSpacing: '1.5px',
                                display: 'block', marginBottom: 5,
                            }}>
                                E-mail
                            </label>
                            <input
                                name="email" type="email" required autoComplete="email"
                                placeholder="seu@saga.com.br"
                                className="login-input"
                                style={{
                                    width: '100%', padding: '14px 16px',
                                    borderRadius: 10,
                                    border: '1.5px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.07)',
                                    color: '#fff', fontSize: 15,
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Senha */}
                        <div>
                            <label style={{
                                fontSize: 10, fontWeight: 700,
                                color: 'rgba(255,255,255,0.45)',
                                textTransform: 'uppercase', letterSpacing: '1.5px',
                                display: 'block', marginBottom: 5,
                            }}>
                                Senha
                            </label>
                            <input
                                name="password" type="password" required autoComplete="current-password"
                                placeholder="••••••••"
                                className="login-input"
                                style={{
                                    width: '100%', padding: '14px 16px',
                                    borderRadius: 10,
                                    border: '1.5px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.07)',
                                    color: '#fff', fontSize: 15,
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Erro */}
                        {error && (
                            <div style={{
                                padding: '9px 14px', borderRadius: 9,
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                color: '#f87171', fontSize: 12,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Botão — cinza/preto (Executive usa vermelho) */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="login-btn"
                            style={{
                                marginTop: 6,
                                padding: '16px',
                                borderRadius: 10,
                                background: loading ? '#2a2a2a' : 'linear-gradient(180deg, #3a3a3a 0%, #181818 100%)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: '#fff',
                                fontSize: 12, fontWeight: 800,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                cursor: loading ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                                transition: 'all 0.15s',
                            }}
                        >
                            {loading
                                ? <><Loader2 size={14} className="animate-spin" /> Entrando...</>
                                : 'Acessar Gestão de Obras'
                            }
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="login-footer" style={{
                        marginTop: 14, fontSize: 10,
                        color: 'rgba(255,255,255,0.2)',
                        letterSpacing: '0.8px',
                    }}>
                        Uso exclusivo SAGA Construtora
                    </p>
                </div>
            </div>
        </>
    )
}
