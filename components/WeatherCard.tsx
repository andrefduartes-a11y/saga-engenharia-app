'use client'

import { useEffect, useState } from 'react'
import { CloudRain, Sun, Cloud, CloudDrizzle, Zap, CloudSnow, AlertTriangle } from 'lucide-react'

// ─── WMO Weather Code → icon + label ──────────────────────────────────────────
function getWeatherInfo(code: number): { icon: React.ReactNode; label: string; isRain: boolean } {
    if (code === 0) return { icon: <Sun size={20} style={{ color: '#F59E0B' }} />, label: 'Sol', isRain: false }
    if (code <= 3) return { icon: <Cloud size={20} style={{ color: '#9CA3AF' }} />, label: 'Nublado', isRain: false }
    if (code <= 48) return { icon: <Cloud size={20} style={{ color: '#6B7280' }} />, label: 'Névoa', isRain: false }
    if (code <= 57) return { icon: <CloudDrizzle size={20} style={{ color: '#60A5FA' }} />, label: 'Garoa', isRain: true }
    if (code <= 67) return { icon: <CloudRain size={20} style={{ color: '#3B82F6' }} />, label: 'Chuva', isRain: true }
    if (code <= 77) return { icon: <CloudSnow size={20} style={{ color: '#BAE6FD' }} />, label: 'Neve', isRain: false }
    if (code <= 82) return { icon: <CloudRain size={20} style={{ color: '#2563EB' }} />, label: 'Pancadas', isRain: true }
    return { icon: <Zap size={20} style={{ color: '#A855F7' }} />, label: 'Trovoada', isRain: true }
}

interface AgendamentoBasic { data_agendada: string }

interface WeatherCardProps {
    cidade: string | null | undefined
    obraNome?: string
    agendamentos?: AgendamentoBasic[]
    compact?: boolean // for diretor grid view
}

interface DayForecast {
    date: string
    weathercode: number
    tempMax: number
    tempMin: number
    rainProb: number
}

interface WeatherData {
    days: DayForecast[]
}

export default function WeatherCard({ cidade, obraNome, agendamentos = [], compact = false }: WeatherCardProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!cidade) { setLoading(false); setError('Cidade não cadastrada'); return }
        setLoading(true); setError('')

        // Step 1: Geocode city
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`)
            .then(r => r.json())
            .then(geo => {
                if (!geo.results?.length) throw new Error('Cidade não encontrada')
                const { latitude, longitude } = geo.results[0]
                // Step 2: Fetch 5-day forecast
                return fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
                    `&daily=weathercode,precipitation_probability_max,temperature_2m_max,temperature_2m_min` +
                    `&timezone=America%2FSao_Paulo&forecast_days=5`
                )
            })
            .then(r => r.json())
            .then(fc => {
                const days: DayForecast[] = fc.daily.time.map((d: string, i: number) => ({
                    date: d,
                    weathercode: fc.daily.weathercode[i],
                    tempMax: Math.round(fc.daily.temperature_2m_max[i]),
                    tempMin: Math.round(fc.daily.temperature_2m_min[i]),
                    rainProb: fc.daily.precipitation_probability_max[i] ?? 0,
                }))
                setWeather({ days })
                setLoading(false)
            })
            .catch(e => { setError('Erro ao buscar clima'); setLoading(false) })
    }, [cidade])

    // Check alerts: agendamento days with rain forecast
    const alerts = agendamentos.filter(ag => {
        const day = weather?.days.find(d => d.date === ag.data_agendada)
        return day && (day.rainProb >= 50 || getWeatherInfo(day.weathercode).isRain)
    })

    const fmt = (d: string) => {
        const dt = new Date(d + 'T12:00:00')
        return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    }

    // Loading state
    if (loading) {
        return (
            <div style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid var(--border-subtle)',
                padding: compact ? '14px' : '18px', minWidth: compact ? 180 : 'auto',
            }}>
                {obraNome && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>{obraNome}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 60, borderRadius: 8, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />)}
                </div>
            </div>
        )
    }

    // Error: no city
    if (error || !weather) {
        return (
            <div style={{
                background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid var(--border-subtle)',
                padding: compact ? '12px 14px' : '16px 18px', minWidth: compact ? 160 : 'auto',
            }}>
                {obraNome && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>{obraNome}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Cloud size={13} /> {error || 'Cidade não configurada'}
                </div>
            </div>
        )
    }

    const daysToShow = compact ? 3 : 5

    return (
        <div style={{
            background: 'rgba(255,255,255,0.025)', borderRadius: 14,
            border: alerts.length > 0 ? '1px solid rgba(239,68,68,0.35)' : '1px solid var(--border-subtle)',
            padding: compact ? '12px 14px' : '16px 18px',
            minWidth: compact ? 180 : 'auto',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                    {obraNome && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 1 }}>{obraNome}</div>}
                    {cidade && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>📍 {cidade}</div>}
                </div>
                {alerts.length > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                    }}>
                        <AlertTriangle size={11} style={{ color: '#EF4444' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444' }}>ALERTA DE CHUVA</span>
                    </div>
                )}
            </div>

            {/* Rain alert detail */}
            {alerts.length > 0 && (
                <div style={{
                    marginBottom: 10, padding: '8px 10px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 11, color: '#F87171',
                }}>
                    ☔ Chuva prevista no dia de {alerts.length} concretagem{alerts.length > 1 ? 'ns' : ''} agendada{alerts.length > 1 ? 's' : ''}
                </div>
            )}

            {/* Days row */}
            <div style={{ display: 'flex', gap: 6 }}>
                {weather.days.slice(0, daysToShow).map(day => {
                    const info = getWeatherInfo(day.weathercode)
                    const isScheduled = agendamentos.some(a => a.data_agendada === day.date)
                    const hasAlert = isScheduled && (day.rainProb >= 50 || info.isRain)

                    return (
                        <div key={day.date} style={{
                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            padding: '8px 4px', borderRadius: 10,
                            background: hasAlert
                                ? 'rgba(239,68,68,0.1)'
                                : isScheduled
                                    ? 'rgba(127,166,83,0.08)'
                                    : 'rgba(255,255,255,0.03)',
                            border: hasAlert
                                ? '1px solid rgba(239,68,68,0.25)'
                                : isScheduled
                                    ? '1px solid rgba(127,166,83,0.2)'
                                    : '1px solid transparent',
                            position: 'relative',
                        }}>
                            {/* Scheduled concretagem indicator */}
                            {isScheduled && (
                                <div style={{
                                    position: 'absolute', top: 4, right: 4,
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: hasAlert ? '#EF4444' : '#7FA653',
                                }} title="Concretagem agendada" />
                            )}
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                {new Date(day.date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
                            </div>
                            {info.icon}
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {day.tempMax}° / {day.tempMin}°
                            </div>
                            <div style={{
                                fontSize: 9, fontWeight: 600,
                                color: day.rainProb >= 60 ? '#60A5FA' : day.rainProb >= 40 ? '#93C5FD' : 'var(--text-muted)',
                            }}>
                                💧{day.rainProb}%
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
