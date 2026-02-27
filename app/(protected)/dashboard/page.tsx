'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useObra } from '@/lib/obra-context'
import {
    HardHat, Mountain, ClipboardList, CheckSquare, BookOpen,
    FolderOpen, FileText, ShoppingCart, Bot, GraduationCap,
    HelpCircle, Building2, ChevronRight, MapPin, Settings2, Truck,
    LayoutDashboard, AlertCircle, TrendingUp, Activity,
} from 'lucide-react'

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

// ─── Atalhos rápidos do engenheiro ────────────────────────────────────────────
const QUICK = [
    { href: '/concreto/novo', icon: HardHat, label: 'Nova Concretagem', color: '#7FA653' },
    { href: '/terraplanagem', icon: Mountain, label: 'Terraplanagem', color: '#D4A843' },
    { href: '/rdo/novo', icon: ClipboardList, label: 'Novo RDO', color: '#E67E22' },
    { href: '/inspecoes/novo', icon: CheckSquare, label: 'Nova FVS', color: '#E85D75' },
]

interface Obra { id: string; nome: string; endereco?: string }

// ─── Dashboard do Diretor ─────────────────────────────────────────────────────
function DiretorDashboard() {
    const [obras, setObras] = useState<Obra[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/obras')
            .then(r => r.ok ? r.json() : [])
            .then(d => { setObras(Array.isArray(d) ? d : []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    return (
        <div style={{ maxWidth: 960 }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif", marginBottom: 4 }}>
                    Painel do Diretor
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{today}</p>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 28 }}>
                {[
                    { icon: Building2, label: 'Obras Ativas', value: loading ? '—' : obras.length, color: '#7FA653' },
                    { icon: ClipboardList, label: 'RDOs Hoje', value: '—', color: '#E67E22' },
                    { icon: CheckSquare, label: 'FVS Pendentes', value: '—', color: '#E85D75' },
                    { icon: HardHat, label: 'Concretagens', value: '—', color: '#5B9BD5' },
                ].map(kpi => {
                    const Icon = kpi.icon
                    return (
                        <div key={kpi.label} className="card" style={{
                            padding: '16px', borderRadius: 14,
                            border: '1px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', gap: 14,
                        }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                background: `${kpi.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon size={20} style={{ color: kpi.color }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{kpi.value}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{kpi.label}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Obras list */}
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                    OBRAS CADASTRADAS
                </h2>
                {loading ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando obras…</div>
                ) : obras.length === 0 ? (
                    <div className="card" style={{ padding: '20px 18px', borderRadius: 14, border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 13 }}>
                        Nenhuma obra cadastrada ainda.{' '}
                        <Link href="/obras/nova" style={{ color: 'var(--green-primary)' }}>Cadastrar primeira obra →</Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                        {obras.map(obra => (
                            <Link key={obra.id} href={`/selecionar-obra?id=${obra.id}`} style={{ textDecoration: 'none' }}>
                                <div className="card" style={{
                                    padding: '14px 18px', borderRadius: 14,
                                    border: '1px solid var(--border-subtle)',
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    transition: 'all 0.2s', cursor: 'pointer',
                                }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(127,166,83,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(127,166,83,0.04)' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = '' }}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                        background: 'rgba(127,166,83,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Building2 size={16} style={{ color: 'var(--green-primary)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{obra.nome}</div>
                                        {obra.endereco && (
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <MapPin size={10} /> {obra.endereco}
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* All modules quick access */}
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                MÓDULOS DO SISTEMA
            </h2>
            {SECTIONS.map(section => (
                <div key={section.title} style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>{section.title}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                        {section.modules.map(mod => {
                            const Icon = mod.icon
                            return (
                                <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
                                    <div className="card" style={{
                                        padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border-subtle)',
                                        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '55'; (e.currentTarget as HTMLElement).style.background = mod.color + '0a' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = '' }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: mod.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={17} style={{ color: mod.color }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{mod.label}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{mod.desc}</div>
                                        </div>
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

// ─── Dashboard do Engenheiro ──────────────────────────────────────────────────
function EngenheiroDashboard() {
    const { obra } = useObra()
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    if (!obra) {
        return (
            <div style={{ maxWidth: 600 }}>
                <div className="card" style={{
                    padding: '28px 24px', borderRadius: 16, border: '1px solid rgba(239,68,68,0.25)',
                    background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'flex-start', gap: 16,
                }}>
                    <AlertCircle size={22} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                            Nenhuma obra selecionada
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                            Selecione sua obra para acessar o dashboard e os módulos.
                        </div>
                        <Link href="/selecionar-obra" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8, background: 'var(--green-primary)',
                            color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                        }}>
                            <MapPin size={14} /> Selecionar Obra
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 800 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
                    {today}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'rgba(127,166,83,0.15)', border: '1px solid rgba(127,166,83,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Building2 size={20} style={{ color: 'var(--green-primary)' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>
                            {obra.nome}
                        </h1>
                        {(obra as any).endereco && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MapPin size={10} />{(obra as any).endereco}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RDO today reminder */}
            <div className="card" style={{
                padding: '14px 18px', borderRadius: 14, marginBottom: 20,
                border: '1px solid rgba(230,126,34,0.3)', background: 'rgba(230,126,34,0.06)',
                display: 'flex', alignItems: 'center', gap: 14,
            }}>
                <ClipboardList size={20} style={{ color: '#E67E22', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>RDO de hoje</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lembre-se de registrar o Relatório Diário de Obra</div>
                </div>
                <Link href="/rdo/novo" style={{
                    padding: '6px 14px', borderRadius: 8, background: '#E67E22',
                    color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                    Registrar →
                </Link>
            </div>

            {/* Quick actions */}
            <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                AÇÕES RÁPIDAS
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 28 }}>
                {QUICK.map(q => {
                    const Icon = q.icon
                    return (
                        <Link key={q.href} href={q.href} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{
                                padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                                border: '1px solid var(--border-subtle)',
                                display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = q.color + '55'; (e.currentTarget as HTMLElement).style.background = q.color + '0a' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.background = '' }}
                            >
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: q.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={17} style={{ color: q.color }} />
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{q.label}</div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Modules */}
            <h2 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>
                MÓDULOS DA OBRA
            </h2>
            {SECTIONS.map(section => (
                <div key={section.title} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>{section.title}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                        {section.modules.map(mod => {
                            const Icon = mod.icon
                            return (
                                <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
                                    <div className="card" style={{
                                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                                        border: '1px solid var(--border-subtle)',
                                        display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                                    }}
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

// ─── Main: detecta role e renderiza o dashboard correto ───────────────────────
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
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />
                ))}
            </div>
        )
    }

    // diretor e admin (backward compat) → painel consolidado
    if (role === 'diretor' || role === 'admin') {
        return <DiretorDashboard />
    }

    // engenheiro → visão da obra dele
    return <EngenheiroDashboard />
}
