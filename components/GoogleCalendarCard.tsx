'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, LogOut, RefreshCw, Loader2, ExternalLink } from 'lucide-react'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
const LS_TOKEN = 'gcal_access_token'
const LS_EXPIRY = 'gcal_token_expiry'

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
        // All-day event
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

export default function GoogleCalendarCard() {
    const [token, setToken] = useState<string | null>(null)
    const [events, setEvents] = useState<GCalEvent[]>([])
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ── Load token from localStorage on mount ──
    useEffect(() => {
        const saved = localStorage.getItem(LS_TOKEN)
        const expiry = localStorage.getItem(LS_EXPIRY)
        if (saved && expiry && Date.now() < Number(expiry)) {
            setToken(saved)
        } else {
            localStorage.removeItem(LS_TOKEN)
            localStorage.removeItem(LS_EXPIRY)
        }
    }, [])

    // ── Fetch events whenever token changes ──
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
                    // Token expired
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

    useEffect(() => {
        if (token) fetchEvents(token)
    }, [token, fetchEvents])

    // ── Google OAuth popup ──
    function handleConnect() {
        if (!CLIENT_ID) {
            setError('NEXT_PUBLIC_GOOGLE_CLIENT_ID não configurado.')
            return
        }
        setLoading(true)
        setError(null)

        // Load GIS script if not already loaded
        const existingScript = document.getElementById('gsi-script')
        const doAuth = () => {
            const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response: any) => {
                    setLoading(false)
                    if (response.error) {
                        setError('Autorização cancelada ou falhou.')
                        return
                    }
                    const accessToken: string = response.access_token
                    const expiresIn: number = response.expires_in || 3600
                    const expiry = Date.now() + expiresIn * 1000
                    localStorage.setItem(LS_TOKEN, accessToken)
                    localStorage.setItem(LS_EXPIRY, String(expiry))
                    setToken(accessToken)
                },
            })
            client.requestAccessToken()
        }

        if (existingScript && (window as any).google?.accounts) {
            setLoading(false)
            doAuth()
        } else {
            const script = document.createElement('script')
            script.id = 'gsi-script'
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.onload = () => { setLoading(false); doAuth() }
            script.onerror = () => { setLoading(false); setError('Falha ao carregar SDK do Google.') }
            document.head.appendChild(script)
        }
    }

    function handleDisconnect() {
        localStorage.removeItem(LS_TOKEN)
        localStorage.removeItem(LS_EXPIRY)
        setToken(null)
        setEvents([])
        setError(null)
    }

    // ─── Not connected state ─────────────────────────────────────────────────
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

    // ─── Connected state ─────────────────────────────────────────────────────
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
                /* Skeleton */
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            flex: '0 0 min(220px, 80vw)', height: 90, borderRadius: 14,
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
                                {/* Color accent bar */}
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                                    background: color, borderRadius: '14px 0 0 14px',
                                }} />
                                <div style={{ paddingLeft: 6 }}>
                                    {/* Date row */}
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
                                    {/* Title */}
                                    <div style={{
                                        fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                                        marginBottom: 4, lineHeight: 1.3,
                                        display: '-webkit-box', WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>
                                        {ev.summary || '(Sem título)'}
                                    </div>
                                    {/* Time */}
                                    <div style={{ fontSize: 10, color: isAllDay ? 'var(--text-muted)' : color, fontWeight: 600, marginBottom: ev.location ? 4 : 0 }}>
                                        🕐 {time}
                                    </div>
                                    {/* Location */}
                                    {ev.location && (
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            📍 {ev.location}
                                        </div>
                                    )}
                                    {/* Link */}
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
