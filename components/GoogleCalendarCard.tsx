'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Calendar, LogOut, RefreshCw, Loader2, ExternalLink } from 'lucide-react'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
const LS_TOKEN = 'gcal_access_token'
const LS_EXPIRY = 'gcal_token_expiry'
const LS_HINT = 'gcal_login_hint'       // save email hint for silent re-auth
const LS_CONNECTED = 'gcal_connected'   // persists "user has connected" intent

interface GCalEvent {
    id: string
    summary?: string
    start: { dateTime?: string; date?: string }
    end: { dateTime?: string; date?: string }
    location?: string
    htmlLink?: string
    colorId?: string
}

const EVENT_COLORS: Record<string, string> = {
    '1': '#7986CB', '2': '#33B679', '3': '#8E24AA', '4': '#E67C73',
    '5': '#F6BF26', '6': '#F4511E', '7': '#039BE5', '8': '#616161',
    '9': '#3F51B5', '10': '#0B8043', '11': '#D50000',
}
const DEFAULT_COLOR = '#4A90D9'

function getColor(colorId?: string) {
    return colorId ? (EVENT_COLORS[colorId] ?? DEFAULT_COLOR) : DEFAULT_COLOR
}

function fmtDateTime(ev: GCalEvent): { date: string; time: string; isAllDay: boolean } {
    if (ev.start.date) {
        const d = new Date(ev.start.date + 'T12:00')
        return {
            date: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
            time: 'Dia inteiro',
            isAllDay: true,
        }
    }
    const d = new Date(ev.start.dateTime!)
    const dEnd = new Date(ev.end.dateTime!)
    return {
        date: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }),
        time: `${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} → ${dEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        isAllDay: false,
    }
}

function daysUntil(ev: GCalEvent): number {
    const start = ev.start.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start.date! + 'T00:00:00')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return Math.round((start.setHours(0, 0, 0, 0) - today.getTime()) / 86400000)
}

// ── Load the GIS script once and resolve when ready ──
function loadGISScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).google?.accounts?.oauth2) { resolve(); return }
        const existing = document.getElementById('gsi-script')
        if (existing) {
            // Already loading — poll
            const interval = setInterval(() => {
                if ((window as any).google?.accounts?.oauth2) { clearInterval(interval); resolve() }
            }, 100)
            setTimeout(() => { clearInterval(interval); reject(new Error('timeout')) }, 10000)
            return
        }
        const script = document.createElement('script')
        script.id = 'gsi-script'
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Falha ao carregar SDK do Google.'))
        document.head.appendChild(script)
    })
}

export default function GoogleCalendarCard() {
    const [token, setToken] = useState<string | null>(null)
    const [events, setEvents] = useState<GCalEvent[]>([])
    const [loading, setLoading] = useState(false)
    const [silentLoading, setSilentLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const silentAttempted = useRef(false)

    // ── Fetch events from Google Calendar API ──
    const fetchEvents = useCallback(async (accessToken: string) => {
        setFetching(true)
        setError(null)
        try {
            const now = new Date().toISOString()
            const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            const res = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${future}&maxResults=8&singleEvents=true&orderBy=startTime`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            if (!res.ok) {
                if (res.status === 401) {
                    // Token really expired — clear it so silent refresh kicks in next time
                    localStorage.removeItem(LS_TOKEN)
                    localStorage.removeItem(LS_EXPIRY)
                    setToken(null)
                    setEvents([])
                    return
                }
                throw new Error('Erro ao buscar eventos')
            }
            const data = await res.json()
            setEvents(data.items || [])
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erro desconhecido')
        } finally {
            setFetching(false)
        }
    }, [])

    // ── Try silent re-authentication (no popup) ──
    const trySilentAuth = useCallback(async (hint: string) => {
        if (!CLIENT_ID) return
        setSilentLoading(true)
        try {
            await loadGISScript()
            await new Promise<void>((resolve) => {
                const client = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    login_hint: hint,
                    prompt: '',    // empty = no interaction; uses existing Google session
                    callback: (response: any) => {
                        if (!response.error && response.access_token) {
                            const expiresIn: number = response.expires_in || 3600
                            const expiry = Date.now() + expiresIn * 1000
                            localStorage.setItem(LS_TOKEN, response.access_token)
                            localStorage.setItem(LS_EXPIRY, String(expiry))
                            if (response.email) localStorage.setItem(LS_HINT, response.email)
                            setToken(response.access_token)
                        }
                        resolve()
                    },
                    error_callback: () => resolve(),
                })
                client.requestAccessToken()
            })
        } catch { /* silent fail */ } finally {
            setSilentLoading(false)
        }
    }, [])

    // ── On mount: restore token or silent re-auth ──
    useEffect(() => {
        if (silentAttempted.current) return
        silentAttempted.current = true

        const saved = localStorage.getItem(LS_TOKEN)
        const expiry = localStorage.getItem(LS_EXPIRY)
        const hint = localStorage.getItem(LS_HINT)
        const connected = localStorage.getItem(LS_CONNECTED)

        if (saved && expiry && Date.now() < Number(expiry)) {
            // Token still valid
            setToken(saved)
        } else if (connected === '1' && hint) {
            // User previously connected — try silent refresh automatically
            trySilentAuth(hint)
        } else {
            // Expired token with no hint — clean up
            localStorage.removeItem(LS_TOKEN)
            localStorage.removeItem(LS_EXPIRY)
        }
    }, [trySilentAuth])

    // ── Schedule auto-refresh 5 min before expiry ──
    useEffect(() => {
        if (!token) return
        const expiry = Number(localStorage.getItem(LS_EXPIRY) || '0')
        const msUntilRefresh = expiry - Date.now() - 5 * 60 * 1000
        if (msUntilRefresh <= 0) return
        const hint = localStorage.getItem(LS_HINT) || ''
        const timer = setTimeout(() => { if (hint) trySilentAuth(hint) }, msUntilRefresh)
        return () => clearTimeout(timer)
    }, [token, trySilentAuth])

    useEffect(() => {
        if (token) fetchEvents(token)
    }, [token, fetchEvents])

    // ── Manual connect (popup) ──
    async function handleConnect() {
        if (!CLIENT_ID) { setError('NEXT_PUBLIC_GOOGLE_CLIENT_ID não configurado.'); return }
        setLoading(true)
        setError(null)
        try {
            await loadGISScript()
            const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                    setLoading(false)
                    if (response.error) { setError('Autorização cancelada ou falhou.'); return }
                    const accessToken: string = response.access_token
                    const expiresIn: number = response.expires_in || 3600
                    const expiry = Date.now() + expiresIn * 1000
                    localStorage.setItem(LS_TOKEN, accessToken)
                    localStorage.setItem(LS_EXPIRY, String(expiry))
                    localStorage.setItem(LS_CONNECTED, '1')
                    // Fetch profile to store the hint email
                    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    }).then(r => r.json()).then(p => {
                        if (p.email) localStorage.setItem(LS_HINT, p.email)
                    }).catch(() => { })
                    setToken(accessToken)
                },
                error_callback: () => { setLoading(false); setError('Autorização cancelada ou falhou.') },
            })
            client.requestAccessToken()
        } catch (e: unknown) {
            setLoading(false)
            setError(e instanceof Error ? e.message : 'Erro desconhecido')
        }
    }

    function handleDisconnect() {
        localStorage.removeItem(LS_TOKEN)
        localStorage.removeItem(LS_EXPIRY)
        localStorage.removeItem(LS_HINT)
        localStorage.removeItem(LS_CONNECTED)
        setToken(null)
        setEvents([])
        setError(null)
    }

    // ── Silent loading state ──
    if (silentLoading) {
        return (
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                    📅 GOOGLE AGENDA
                </h2>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            flex: '0 0 min(220px, 80vw)', height: 100, borderRadius: 14,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                    ))}
                </div>
            </div>
        )
    }

    // ── Not connected ──
    if (!token) {
        return (
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                    📅 GOOGLE AGENDA
                </h2>
                <div style={{
                    padding: '20px 22px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', gap: 16,
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: 'rgba(74,144,217,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Calendar size={20} style={{ color: '#4A90D9' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                            Conectar Google Agenda
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Veja seus próximos compromissos diretamente no dashboard
                        </div>
                        {error && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 6 }}>{error}</div>}
                    </div>
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '9px 18px', borderRadius: 10,
                            background: loading ? 'rgba(74,144,217,0.2)' : '#4A90D9',
                            border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
                            cursor: loading ? 'wait' : 'pointer', flexShrink: 0,
                            transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(74,144,217,0.3)',
                        }}
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                        {loading ? 'Aguarde...' : 'Conectar'}
                    </button>
                </div>
            </div>
        )
    }

    // ── Connected ──
    return (
        <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    📅 GOOGLE AGENDA — PRÓXIMOS EVENTOS
                </h2>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => fetchEvents(token)}
                        disabled={fetching}
                        title="Atualizar"
                        style={{
                            display: 'flex', alignItems: 'center', padding: '4px 8px',
                            borderRadius: 7, background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.09)', color: 'var(--text-muted)',
                            cursor: 'pointer', fontSize: 11,
                        }}
                    >
                        <RefreshCw size={12} className={fetching ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleDisconnect}
                        title="Desconectar agenda"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                            borderRadius: 7, background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444',
                            cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        }}
                    >
                        <LogOut size={12} /> Desconectar
                    </button>
                </div>
            </div>

            {fetching && events.length === 0 ? (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            flex: '0 0 min(220px, 80vw)', height: 100, borderRadius: 14,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                    ))}
                </div>
            ) : error ? (
                <div style={{ fontSize: 12, color: '#EF4444', padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                </div>
            ) : events.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    Nenhum evento nos próximos 30 dias.
                </div>
            ) : (
                <div style={{
                    display: 'flex', gap: 8,
                    overflowX: 'auto', scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch', paddingBottom: 4,
                    scrollbarWidth: 'none',
                }}>
                    {events.map(ev => {
                        const { date, time, isAllDay } = fmtDateTime(ev)
                        const dias = daysUntil(ev)
                        const color = getColor(ev.colorId)
                        const isHoje = dias === 0
                        const isAmanha = dias === 1

                        return (
                            <div key={ev.id} style={{
                                flex: '0 0 min(220px, 80vw)',
                                scrollSnapAlign: 'start',
                                padding: '13px 15px', borderRadius: 14,
                                background: isHoje ? `${color}10` : 'rgba(255,255,255,0.025)',
                                border: `1px solid ${isHoje ? color + '40' : 'rgba(255,255,255,0.08)'}`,
                                position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                                    background: color, borderRadius: '14px 0 0 14px',
                                }} />
                                <div style={{ paddingLeft: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{date}</span>
                                        {(isHoje || isAmanha || dias <= 2) && (
                                            <span style={{
                                                fontSize: 9, fontWeight: 800, padding: '1px 7px', borderRadius: 20,
                                                background: `${color}20`, color,
                                                border: `1px solid ${color}40`,
                                            }}>
                                                {isHoje ? '🔴 Hoje' : isAmanha ? '🟡 Amanhã' : `${dias}d`}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                                        marginBottom: 4, lineHeight: 1.3,
                                        display: '-webkit-box', WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>
                                        {ev.summary || '(Sem título)'}
                                    </div>
                                    <div style={{ fontSize: 10, color: isAllDay ? 'var(--text-muted)' : color, fontWeight: 600, marginBottom: ev.location ? 4 : 0 }}>
                                        🕐 {time}
                                    </div>
                                    {ev.location && (
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            📍 {ev.location}
                                        </div>
                                    )}
                                    {ev.htmlLink && (
                                        <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, color: color, textDecoration: 'none', marginTop: 6, opacity: 0.8 }}>
                                            <ExternalLink size={9} /> Ver no Google
                                        </a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
