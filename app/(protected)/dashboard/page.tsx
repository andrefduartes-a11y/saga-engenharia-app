'use client'

import Link from 'next/link'
import { useObra } from '@/lib/obra-context'
import {
    HardHat, Mountain, ClipboardList, CheckSquare, BookOpen,
    FolderOpen, FileText, ShoppingCart, Bot, GraduationCap,
    HelpCircle, Building2, ChevronRight, MapPin, Settings2, Truck,
} from 'lucide-react'

const SECTIONS = [
    {
        title: '🏗️ Engenharia Operacional',
        modules: [
            { href: '/concreto', icon: HardHat, label: 'Concretagem', desc: 'Lançamentos e traços', color: '#7FA653' },
            { href: '/terraplanagem', icon: Mountain, label: 'Terraplanagem', desc: 'Etapas e diários', color: '#D4A843' },
            { href: '/equipamentos', icon: Settings2, label: 'Equipamentos', desc: 'Controle de horas', color: '#5B9BD5' },
            { href: '/caminhoes', icon: Truck, label: 'Caminhões', desc: 'Controle de viagens', color: '#E67E22' },
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

export default function DashboardPage() {
    const { obra } = useObra()

    const today = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long'
    })

    return (
        <div style={{ maxWidth: 900 }}>

            {/* ── Heading ── */}
            <div className="dash-heading" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20, flexWrap: 'wrap', gap: 10,
            }}>
                <div>
                    <h1 style={{
                        fontSize: 18, fontWeight: 800, color: 'var(--text-primary)',
                        fontFamily: "'Raleway', sans-serif", letterSpacing: '0.5px',
                    }}>
                        Visão Operacional
                    </h1>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, textTransform: 'capitalize' }}>
                        {today}
                    </p>
                </div>

                <Link href="/selecionar-obra" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 8,
                        background: obra ? 'rgba(82,168,123,0.1)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${obra ? 'rgba(82,168,123,0.25)' : 'rgba(239,68,68,0.2)'}`,
                    }}>
                        <Building2 size={14} style={{ color: obra ? 'var(--green-primary)' : '#EF4444', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                                Obra Atual
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: obra ? 'var(--text-primary)' : '#EF4444' }}>
                                {obra ? obra.nome : 'Nenhuma selecionada'}
                            </div>
                            {obra?.endereco && (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                                    <MapPin size={9} /> {obra.endereco}
                                </div>
                            )}
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 4 }} />
                    </div>
                </Link>
            </div>

            {/* ── Seções de Módulos ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {SECTIONS.map((section, idx) => (
                    <div key={idx}>
                        {/* Section header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <h2 className="section-title" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                {section.title}
                            </h2>
                            <div style={{ height: 1, flex: 1, background: 'var(--border-subtle)' }} />
                        </div>

                        {/* Cards grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: 10,
                        }}>
                            {section.modules.map(({ href, icon: Icon, label, desc, color }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div
                                        className="card"
                                        style={{
                                            padding: '16px 14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            borderTop: `2px solid ${color}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 10,
                                            height: '100%',
                                        }}
                                        onMouseEnter={e => {
                                            const el = e.currentTarget as HTMLElement
                                            el.style.background = 'var(--bg-elevated)'
                                            el.style.transform = 'translateY(-2px)'
                                            el.style.boxShadow = `0 4px 16px ${color}22`
                                        }}
                                        onMouseLeave={e => {
                                            const el = e.currentTarget as HTMLElement
                                            el.style.background = 'var(--bg-card)'
                                            el.style.transform = 'translateY(0)'
                                            el.style.boxShadow = 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: 38, height: 38, borderRadius: 8,
                                            background: `${color}18`,
                                            border: `1px solid ${color}22`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Icon size={18} style={{ color }} />
                                        </div>
                                        <div>
                                            <p style={{
                                                fontSize: 13, fontWeight: 700,
                                                color: 'var(--text-primary)', lineHeight: 1.2,
                                            }}>
                                                {label}
                                            </p>
                                            <p style={{
                                                fontSize: 11, color: 'var(--text-muted)', marginTop: 3,
                                            }}>
                                                {desc}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
