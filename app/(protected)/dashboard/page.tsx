'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useObra } from '@/lib/obra-context'
import dynamic from 'next/dynamic'
import {
    HardHat, Mountain, ClipboardList, CheckSquare, BookOpen,
    FolderOpen, FileText, ShoppingCart, Bot, GraduationCap,
    HelpCircle, Building2, ChevronRight, MapPin, AlertTriangle, Calendar,
} from 'lucide-react'
import DraggableModuleGrid from '@/components/DraggableModuleGrid'

// WeatherCard is client-only (calls browser fetch to open-meteo)
const WeatherCard = dynamic(() => import('@/components/WeatherCard'), { ssr: false })

// ─── Módulos por seção ────────────────────────────────────────────────────────
const SECTIONS = [
    {
        title: '🏗️ Engenharia Operacional',
        modules: [
            { href: '/concreto', icon: HardHat, label: 'Concretagem', desc: 'Lançamentos e traços', color: '#7FA653' },
            { href: '/terraplanagem', icon: Mountain, label: 'Terraplanagem', desc: 'Etapas, caminhões e equipamentos', color: '#D4A843' },
        ]
    },
    {
        title: '📊 Controle e Qualidade',
        modules: [
            { href: '/rdo', icon: ClipboardList, label: 'RDO', desc: 'Diário de obras', color: '#E67E22' },
            { href: '/inspecoes', icon: CheckSquare, label: 'FVS', desc: 'Fichas de verificação', color: '#E85D75' },
            { href: '/instrucoes-trabalho', icon: BookOpen, label: 'IT', desc: 'Instruções técnicas', color: '#C9902A' },
        ]
    },
    {
        title: '📁 Documentação',
        modules: [
            { href: '/projetos', icon: FolderOpen, label: 'Projetos', desc: '13 disciplinas', color: '#9B59B6' },
            { href: '/documentos', icon: FileText, label: 'Documentos', desc: 'Repositório geral', color: '#4A90D9' },
        ]
    },
    {
        title: '⚙️ Gestão e Suporte',
        modules: [
            { href: '/suprimentos', icon: ShoppingCart, label: 'Suprimentos', desc: 'Solicitação por voz', color: '#E67E22' },
            { href: '/assistente', icon: Bot, label: 'Assistente IA', desc: 'Chat de engenharia', color: '#1ABC9C' },
            { href: '/ead', icon: GraduationCap, label: 'EAD', desc: 'Treinamentos', color: '#3498DB' },
            { href: '/faq', icon: HelpCircle, label: 'FAQ / DRH', desc: 'Dúvidas frequentes', color: '#7F8C8D' },
        ]
    }
]

// Flat list for DraggableModuleGrid
const FLAT_MODULES = SECTIONS.flatMap(s => s.modules)

interface Obra { id: string; nome: string; endereco?: string; cidade?: string; status: string; data_inicio?: string; data_previsao_fim?: string }
interface Agendamento { id: string; obra_id: string; data_agendada: string; elemento?: string; volume_estimado?: number; fck_previsto?: number }

// ─── Seção de previsão do tempo (agrupada por cidade única) ──────────────────
function WeatherSection({ obras, agendamentos }: { obras: Obra[]; agendamentos: Agendamento[] }) {
    // Build a map: cidade → array of obra IDs (only obras that have a cidade)
    const cidadeMap = new Map<string, string[]>()
    obras.forEach(o => {
        if (!o.cidade?.trim()) return
        const key = o.cidade.trim().toLowerCase()
        if (!cidadeMap.has(key)) cidadeMap.set(key, [])
        cidadeMap.get(key)!.push(o.id)
    })

    // Unique cities with their canonical name (from first obra) and merged agendamentos
    const uniqueCidades = Array.from(cidadeMap.entries()).map(([, obraIds]) => {
        const firstObra = obras.find(o => obraIds.includes(o.id))!
        const cidadeAgendamentos = agendamentos.filter(a => obraIds.includes(a.obra_id))
        return { cidade: firstObra.cidade!, agendamentos: cidadeAgendamentos }
    })

    const obrasWithoutCity = obras.filter(o => !o.cidade?.trim())

    if (uniqueCidades.length === 0 && obrasWithoutCity.length === 0) return null

    return (
        <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                🌤️ PREVISÃO DO TEMPO — PRÓXIMOS 5 DIAS
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {uniqueCidades.map(({ cidade, agendamentos: ags }) => (
                    <div key={cidade} style={{ flex: '1 1 280px', maxWidth: 340 }}>
                        <WeatherCard
                            cidade={cidade}
                            agendamentos={ags}
                            compact={uniqueCidades.length > 1}
                        />
                    </div>
                ))}
                {/* Obras sem cidade cadastrada */}
                {obrasWithoutCity.length > 0 && (
                    <div style={{
                        padding: '12px 16px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
                        fontSize: 11, color: 'var(--text-muted)',
                    }}>
                        <span style={{ fontWeight: 600 }}>
                            {obrasWithoutCity.length} obra{obrasWithoutCity.length > 1 ? 's' : ''} sem cidade cadastrada:
                        </span>
                        {' '}{obrasWithoutCity.map(o => o.nome).join(', ')}
                        <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 10 }}>
                            Edite a obra e adicione a cidade para ver o clima
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


// ─── Seção de próximas concretagens ──────────────────────────────────────────
function ProximasConcretagens({ agendamentos, obrasMap }: { agendamentos: Agendamento[]; obrasMap: Map<string, Obra> }) {
    if (agendamentos.length === 0) return null

    const today = new Date(); today.setHours(0, 0, 0, 0)

    function daysUntil(d: string) {
        const dt = new Date(d + 'T00:00:00'); return Math.round((dt.getTime() - today.getTime()) / 86400000)
    }
    function fmtDate(d: string) {
        return new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    }

    return (
        <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                📅 PRÓXIMAS CONCRETAGENS
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {agendamentos.slice(0, 6).map(ag => {
                    const obra = obrasMap.get(ag.obra_id)
                    const dias = daysUntil(ag.data_agendada)
                    const urgente = dias <= 1
                    const breve = dias <= 6
                    const accentColor = urgente ? '#EF4444' : breve ? '#D4A843' : '#7FA653'
                    return (
                        <div key={ag.id} style={{
                            flex: '1 1 220px', maxWidth: 280,
                            padding: '14px 16px', borderRadius: 14,
                            background: urgente ? 'rgba(239,68,68,0.06)' : breve ? 'rgba(212,168,67,0.06)' : 'rgba(127,166,83,0.04)',
                            border: `1px solid ${urgente ? 'rgba(239,68,68,0.25)' : breve ? 'rgba(212,168,67,0.22)' : 'rgba(127,166,83,0.15)'}`,
                        }}>
                            {/* Top row: date + countdown badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                    {fmtDate(ag.data_agendada)}
                                </div>
                                <div style={{
                                    padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                                    background: `${accentColor}18`, color: accentColor,
                                    border: `1px solid ${accentColor}30`, whiteSpace: 'nowrap',
                                }}>
                                    {dias === 0 ? '🔴 Hoje' : dias === 1 ? '🟡 Amanhã' : `${dias}d`}
                                </div>
                            </div>
                            {/* Elemento */}
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {ag.elemento || 'Concretagem'}
                            </div>
                            {/* Obra */}
                            {obra && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>🏗 {obra.nome}</div>}
                            {/* Chips: FCK + Volume */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {ag.fck_previsto && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${accentColor}14`, color: accentColor }}>FCK {ag.fck_previsto}</span>
                                )}
                                {ag.volume_estimado && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>{ag.volume_estimado} m³</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Dashboard do Diretor ─────────────────────────────────────────────────────
function DiretorDashboard() {
    const [obras, setObras] = useState<Obra[]>([])
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch all obras + their upcoming scheduled concretagens
        fetch('/api/obras')
            .then(r => r.ok ? r.json() : [])
            .then(async (d: Obra[]) => {
                const all = Array.isArray(d) ? d : []
                setObras(all)
                // For each obra, load upcoming concretagens_agendadas
                // We do it in one call with no obra filter (diretor sees all)
                const { createClient } = await import('@/lib/supabase/client')
                const sb = createClient()
                const today = new Date().toISOString().split('T')[0]
                const { data: ags } = await sb.from('concretagens_agendadas')
                    .select('id, obra_id, data_agendada, elemento, volume_estimado, fck_previsto')
                    .gte('data_agendada', today)
                    .order('data_agendada', { ascending: true })
                setAgendamentos(ags || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    const obrasMap = new Map(obras.map(o => [o.id, o]))

    return (
        <div style={{ maxWidth: 960 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif", marginBottom: 4 }}>
                    Painel do Diretor
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{today}</p>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gap: 10 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
                </div>
            ) : (
                <>
                    {/* ── Weather ── */}
                    <WeatherSection obras={obras} agendamentos={agendamentos} />

                    {/* ── Próximas Concretagens ── */}
                    <ProximasConcretagens agendamentos={agendamentos} obrasMap={obrasMap} />

                    {/* ── KPIs ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
                        {[
                            { icon: Building2, label: 'Obras Ativas', value: obras.length, color: '#7FA653' },
                            { icon: Calendar, label: 'Concretagens Agend.', value: agendamentos.length, color: '#D4A843' },
                        ].map(kpi => {
                            const Icon = kpi.icon
                            return (
                                <div key={kpi.label} className="card" style={{ padding: '16px', borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: `${kpi.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={18} style={{ color: kpi.color }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{kpi.value}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{kpi.label}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* ── Obras em Andamento ── */}
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                🏗️ OBRAS EM ANDAMENTO
                            </h2>
                            <Link href="/obras/nova" style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-primary)', textDecoration: 'none', padding: '3px 10px', borderRadius: 6, background: 'rgba(127,166,83,0.1)', border: '1px solid rgba(127,166,83,0.2)' }}>
                                + Nova obra
                            </Link>
                        </div>
                        {obras.length === 0 ? (
                            <div className="card" style={{ padding: '20px 18px', borderRadius: 14, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 13 }}>
                                Nenhuma obra cadastrada.{' '}<Link href="/obras/nova" style={{ color: 'var(--green-primary)' }}>Cadastrar →</Link>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                                {obras.map(obra => {
                                    const isAtiva = obra.status === 'ativa'
                                    const o = obra as any

                                    // Calculate elapsed and remaining days
                                    const todayMs = new Date().setHours(0, 0, 0, 0)
                                    const inicioMs = o.data_inicio ? new Date(o.data_inicio + 'T00:00:00').getTime() : null
                                    const fimMs = o.data_previsao_fim ? new Date(o.data_previsao_fim + 'T00:00:00').getTime() : null
                                    const decorridos = inicioMs ? Math.max(0, Math.round((todayMs - inicioMs) / 86400000)) : null
                                    const faltantes = fimMs ? Math.max(0, Math.round((fimMs - todayMs) / 86400000)) : null
                                    const totalDias = (inicioMs && fimMs) ? Math.round((fimMs - inicioMs) / 86400000) : null
                                    const progresso = (totalDias && decorridos !== null) ? Math.min(100, Math.round((decorridos / totalDias) * 100)) : null

                                    const statusColor = isAtiva ? '#7FA653' : obra.status === 'pausada' ? '#D4A843' : '#6B7280'
                                    const statusLabel = { ativa: 'Em andamento', pausada: 'Pausada', concluida: 'Concluída' }[obra.status] || obra.status

                                    return (
                                        <Link key={obra.id} href={`/obras/${obra.id}`} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
                                                background: 'rgba(255,255,255,0.025)',
                                                border: `1px solid ${isAtiva ? 'rgba(127,166,83,0.2)' : 'var(--border-subtle)'}`,
                                                transition: 'all 0.2s',
                                            }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = statusColor + '55'; (e.currentTarget as HTMLElement).style.background = statusColor + '08' }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isAtiva ? 'rgba(127,166,83,0.2)' : 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)' }}
                                            >
                                                {/* Header row */}
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{obra.nome}</div>
                                                        {o.cidade && <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{o.cidade}</div>}
                                                    </div>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
                                                        background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30`,
                                                    }}>{statusLabel}</span>
                                                </div>

                                                {/* Progress bar (only if dates set) */}
                                                {progresso !== null && (
                                                    <div style={{ marginBottom: 10 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                                                            <span>Progresso</span>
                                                            <span style={{ fontWeight: 700, color: progresso >= 90 ? '#EF4444' : 'var(--text-secondary)' }}>{progresso}%</span>
                                                        </div>
                                                        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                            <div style={{
                                                                height: '100%', borderRadius: 3,
                                                                background: progresso >= 90 ? '#EF4444' : progresso >= 70 ? '#D4A843' : '#7FA653',
                                                                width: `${progresso}%`, transition: 'width 0.5s ease',
                                                            }} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Elapsed / Remaining days */}
                                                {(decorridos !== null || faltantes !== null) && (
                                                    <div style={{ display: 'flex', gap: 10 }}>
                                                        {decorridos !== null && (
                                                            <div style={{
                                                                flex: 1, padding: '6px 10px', borderRadius: 8,
                                                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                                                                textAlign: 'center',
                                                            }}>
                                                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{decorridos}</div>
                                                                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>dias decorridos</div>
                                                            </div>
                                                        )}
                                                        {faltantes !== null && (
                                                            <div style={{
                                                                flex: 1, padding: '6px 10px', borderRadius: 8,
                                                                background: faltantes <= 30 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                                                                border: `1px solid ${faltantes <= 30 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                                                textAlign: 'center',
                                                            }}>
                                                                <div style={{ fontSize: 16, fontWeight: 800, color: faltantes <= 30 ? '#EF4444' : 'var(--text-primary)' }}>{faltantes}</div>
                                                                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>dias restantes</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── All modules — draggable ── */}
                    <DraggableModuleGrid modules={FLAT_MODULES} compact={false} />
                </>
            )}
        </div>
    )
}

// ─── Dashboard do Engenheiro ──────────────────────────────────────────────────
function EngenheiroDashboard() {
    const { obra: obraCtx } = useObra()
    const [obraFull, setObraFull] = useState<Obra | null>(null)
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [loadingObra, setLoadingObra] = useState(true)
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    useEffect(() => {
        if (!obraCtx?.id) { setLoadingObra(false); return }
        const load = async () => {
            const { createClient } = await import('@/lib/supabase/client')
            const sb = createClient()
            // Fetch full obra with all fields
            const { data: o } = await sb.from('obras')
                .select('id, nome, cidade, endereco, status, data_inicio, data_previsao_fim')
                .eq('id', obraCtx.id).single()
            if (o) setObraFull(o as Obra)
            // Fetch upcoming scheduled concretagens
            const todayStr = new Date().toISOString().split('T')[0]
            const { data: ags } = await sb.from('concretagens_agendadas')
                .select('id, obra_id, data_agendada, elemento, volume_estimado, fck_previsto')
                .eq('obra_id', obraCtx.id)
                .gte('data_agendada', todayStr)
                .order('data_agendada', { ascending: true })
            setAgendamentos(ags || [])
            setLoadingObra(false)
        }
        load()
    }, [obraCtx?.id])

    if (!obraCtx) {
        return (
            <div style={{ maxWidth: 600 }}>
                <div className="card" style={{ padding: '28px 24px', borderRadius: 16, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <AlertTriangle size={22} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Nenhuma obra selecionada</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>Selecione sua obra para acessar o dashboard.</div>
                        <Link href="/selecionar-obra" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--green-primary)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                            <MapPin size={14} /> Selecionar Obra
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const obra = obraFull
    const obrasMap = new Map(obra ? [[obra.id, obra]] : [])

    // ── Progress calculations ──
    const todayMs = new Date().setHours(0, 0, 0, 0)
    const inicioMs = obra?.data_inicio ? new Date(obra.data_inicio + 'T00:00:00').getTime() : null
    const fimMs = obra?.data_previsao_fim ? new Date(obra.data_previsao_fim + 'T00:00:00').getTime() : null
    const decorridos = inicioMs ? Math.max(0, Math.round((todayMs - inicioMs) / 86400000)) : null
    const faltantes = fimMs ? Math.max(0, Math.round((fimMs - todayMs) / 86400000)) : null
    const totalDias = (inicioMs && fimMs) ? Math.round((fimMs - inicioMs) / 86400000) : null
    const progresso = (totalDias && decorridos !== null) ? Math.min(100, Math.round((decorridos / totalDias) * 100)) : null

    return (
        <div style={{ maxWidth: 800 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize', letterSpacing: '0.8px', marginBottom: 4 }}>{today}</div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>
                    {obraCtx.nome}
                </h1>
                {obra?.cidade && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <MapPin size={11} /> {obra.cidade}
                    </div>
                )}
            </div>

            {loadingObra ? (
                <div style={{ display: 'grid', gap: 10 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
                </div>
            ) : (
                <>
                    {/* ── Obra Card with progress ── */}
                    {obra && (
                        <div style={{ marginBottom: 20 }}>
                            <Link href={`/obras/${obra.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.025)',
                                    border: '1px solid rgba(127,166,83,0.2)',
                                    transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(127,166,83,0.06)' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: progresso !== null ? 10 : 0 }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{obra.nome}</div>
                                            {obra.cidade && <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{obra.cidade}</div>}
                                        </div>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(127,166,83,0.15)', color: '#7FA653', border: '1px solid rgba(127,166,83,0.3)' }}>
                                            Em andamento
                                        </span>
                                    </div>
                                    {progresso !== null && (
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                                                <span>Progresso</span>
                                                <span style={{ fontWeight: 700, color: progresso >= 90 ? '#EF4444' : 'var(--text-secondary)' }}>{progresso}%</span>
                                            </div>
                                            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', borderRadius: 3, background: progresso >= 90 ? '#EF4444' : progresso >= 70 ? '#D4A843' : '#7FA653', width: `${progresso}%`, transition: 'width 0.5s ease' }} />
                                            </div>
                                        </div>
                                    )}
                                    {(decorridos !== null || faltantes !== null) && (
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            {decorridos !== null && (
                                                <div style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{decorridos}</div>
                                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>dias decorridos</div>
                                                </div>
                                            )}
                                            {faltantes !== null && (
                                                <div style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: faltantes <= 30 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${faltantes <= 30 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center' }}>
                                                    <div style={{ fontSize: 16, fontWeight: 800, color: faltantes <= 30 ? '#EF4444' : 'var(--text-primary)' }}>{faltantes}</div>
                                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>dias restantes</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* ── Weather for this obra ── */}
                    <div style={{ marginBottom: 20 }}>
                        <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
                            🌤️ PREVISÃO DO TEMPO — 5 DIAS
                        </h2>
                        <WeatherCard cidade={obra?.cidade} agendamentos={agendamentos} />
                    </div>

                    {/* ── RDO reminder ── */}
                    <div className="card" style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 16, border: '1px solid rgba(230,126,34,0.3)', background: 'rgba(230,126,34,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <ClipboardList size={20} style={{ color: '#E67E22', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>RDO de hoje</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Registre o Relatório Diário de Obra</div>
                        </div>
                        <Link href="/rdo/novo" style={{ padding: '6px 14px', borderRadius: 8, background: '#E67E22', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            Registrar →
                        </Link>
                    </div>

                    {/* ── Próximas Concretagens ── */}
                    <ProximasConcretagens agendamentos={agendamentos} obrasMap={obrasMap} />

                    {/* ── Module cards — draggable ── */}
                    <DraggableModuleGrid modules={FLAT_MODULES} compact={true} />
                </>
            )}
        </div>
    )
}



// ─── Main: detecta role e renderiza ──────────────────────────────────────────
export default function DashboardPage() {
    const [role, setRole] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/me')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.role) setRole(d.role); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div style={{ display: 'grid', gap: 12 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
            </div>
        )
    }

    if (role === 'diretor' || role === 'admin') return <DiretorDashboard />
    return <EngenheiroDashboard />
}
