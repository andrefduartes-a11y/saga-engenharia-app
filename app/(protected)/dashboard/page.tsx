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

interface Obra { id: string; nome: string; endereco?: string; cidade?: string }
interface Agendamento { id: string; obra_id: string; data_agendada: string; elemento?: string; volume_estimado?: number; fck_previsto?: number }

// ─── Seção de previsão do tempo ───────────────────────────────────────────────
function WeatherSection({ obras, agendamentos }: { obras: Obra[]; agendamentos: Agendamento[] }) {
    if (obras.length === 0) return null
    return (
        <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                🌤️ PREVISÃO DO TEMPO — PRÓXIMOS 5 DIAS
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {obras.map(obra => {
                    const obraAgs = agendamentos.filter(a => a.obra_id === obra.id)
                    return (
                        <WeatherCard
                            key={obra.id}
                            cidade={obra.cidade}
                            obraNome={obra.nome}
                            agendamentos={obraAgs}
                            compact={obras.length > 1}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// ─── Seção de próximas concretagens ──────────────────────────────────────────
function ProximasConcretagens({ agendamentos, obrasMap }: { agendamentos: Agendamento[]; obrasMap: Map<string, Obra> }) {
    if (agendamentos.length === 0) return null
    const fmtDate = (d: string) => new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    return (
        <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                📅 PRÓXIMAS CONCRETAGENS AGENDADAS
            </h2>
            <div style={{ display: 'grid', gap: 6 }}>
                {agendamentos.slice(0, 5).map(ag => {
                    const obra = obrasMap.get(ag.obra_id)
                    return (
                        <div key={ag.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 12,
                            background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.18)',
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Calendar size={15} style={{ color: '#D4A843' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {fmtDate(ag.data_agendada)}
                                    {ag.elemento && <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> — {ag.elemento}</span>}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                    {obra?.nome}{ag.volume_estimado ? ` • ${ag.volume_estimado} m³` : ''}{ag.fck_previsto ? ` • FCK ${ag.fck_previsto}` : ''}
                                </div>
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

                    {/* ── Obras list ── */}
                    <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                        OBRAS CADASTRADAS
                    </h2>
                    {obras.length === 0 ? (
                        <div className="card" style={{ padding: '20px 18px', borderRadius: 14, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 13 }}>
                            Nenhuma obra cadastrada.{' '}<Link href="/obras/nova" style={{ color: 'var(--green-primary)' }}>Cadastrar →</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 8, marginBottom: 28 }}>
                            {obras.map(obra => (
                                <Link key={obra.id} href={`/selecionar-obra?id=${obra.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="card" style={{ padding: '14px 18px', borderRadius: 14, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s', cursor: 'pointer' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(127,166,83,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(127,166,83,0.04)' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = '' }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(127,166,83,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Building2 size={16} style={{ color: 'var(--green-primary)' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{obra.nome}</div>
                                            {obra.cidade && <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={10} />{obra.cidade}</div>}
                                        </div>
                                        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* ── All modules ── */}
                    <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>MÓDULOS DO SISTEMA</h2>
                    {SECTIONS.map(section => (
                        <div key={section.title} style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{section.title}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                                {section.modules.map(mod => {
                                    const Icon = mod.icon
                                    return (
                                        <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
                                            <div className="card" style={{ padding: '12px 14px', borderRadius: 12, cursor: 'pointer', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}
                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '55'; (e.currentTarget as HTMLElement).style.background = mod.color + '0a' }}
                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = '' }}
                                            >
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: mod.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Icon size={15} style={{ color: mod.color }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{mod.label}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{mod.desc}</div>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}

// ─── Dashboard do Engenheiro ──────────────────────────────────────────────────
function EngenheiroDashboard() {
    const { obra } = useObra()
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    useEffect(() => {
        if (!obra) return
        const fetchAgs = async () => {
            const { createClient } = await import('@/lib/supabase/client')
            const sb = createClient()
            const todayStr = new Date().toISOString().split('T')[0]
            const { data } = await sb.from('concretagens_agendadas')
                .select('id, obra_id, data_agendada, elemento, volume_estimado, fck_previsto')
                .eq('obra_id', obra.id)
                .gte('data_agendada', todayStr)
                .order('data_agendada', { ascending: true })
            setAgendamentos(data || [])
        }
        fetchAgs()
    }, [obra])

    if (!obra) {
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

    const obrasMap = new Map([[obra.id, obra as any]])

    return (
        <div style={{ maxWidth: 800 }}>
            {/* Obra header */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>{today}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(127,166,83,0.15)', border: '1px solid rgba(127,166,83,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={20} style={{ color: 'var(--green-primary)' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>{obra.nome}</h1>
                        {(obra as any).cidade && <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{(obra as any).cidade}</div>}
                    </div>
                </div>
            </div>

            {/* ── Weather for this obra ── */}
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
                    🌤️ PREVISÃO DO TEMPO — 5 DIAS
                </h2>
                <WeatherCard
                    cidade={(obra as any).cidade}
                    agendamentos={agendamentos}
                />
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

            {/* ── Module cards ── */}
            <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>MÓDULOS</h2>
            {SECTIONS.map(section => (
                <div key={section.title} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{section.title}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 7 }}>
                        {section.modules.map(mod => {
                            const Icon = mod.icon
                            return (
                                <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
                                    <div className="card" style={{ padding: '11px 12px', borderRadius: 12, cursor: 'pointer', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '55'; (e.currentTarget as HTMLElement).style.background = mod.color + '0a' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = '' }}
                                    >
                                        <div style={{ width: 30, height: 30, borderRadius: 8, background: mod.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={14} style={{ color: mod.color }} />
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{mod.label}</div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            ))}
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
