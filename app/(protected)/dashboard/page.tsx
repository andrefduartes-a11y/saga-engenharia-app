'use client'

import Link from 'next/link'
import { useObra } from '@/lib/obra-context'
import {
    HardHat, Mountain, ClipboardList, CheckSquare, BookOpen,
    FolderOpen, FileText, ShoppingCart, Bot, GraduationCap,
    HelpCircle, Building2, ChevronRight, MapPin
} from 'lucide-react'

const SECTIONS = [
    {
        title: '🏗️ Engenharia Operacional',
        modules: [
            { href: '/concreto', icon: HardHat, label: 'Concretagem', desc: 'Lançamentos e traços', color: '#7FA653' },
            { href: '/terraplanagem', icon: Mountain, label: 'Terraplanagem', desc: 'Etapas e diários', color: '#D4A843' },
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

    return (
        <div className="px-4 py-4 space-y-6 animate-fade-up">
            {/* Cabeçalho da obra */}
            {obra ? (
                <div className="card" style={{ padding: '14px 16px' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(127,166,83,0.15)' }}>
                                <Building2 size={20} style={{ color: 'var(--green-primary)' }} />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Obra atual</p>
                                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{obra.nome}</p>
                                {obra.endereco && (
                                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        <MapPin size={10} /> {obra.endereco}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Link href="/selecionar-obra"
                            className="text-xs flex items-center gap-1"
                            style={{ color: 'var(--green-primary)' }}>
                            Trocar <ChevronRight size={14} />
                        </Link>
                    </div>
                </div>
            ) : (
                <Link href="/selecionar-obra"
                    className="card-hover flex items-center gap-3"
                    style={{ padding: '14px 16px', borderColor: 'rgba(239,68,68,0.3)', borderWidth: 1 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.1)' }}>
                        <Building2 size={20} style={{ color: '#EF4444' }} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: '#EF4444' }}>Nenhuma obra selecionada</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toque para selecionar</p>
                    </div>
                    <ChevronRight size={18} style={{ color: '#EF4444' }} />
                </Link>
            )}

            {/* Grid de Seções e Módulos */}
            <div className="space-y-6">
                {SECTIONS.map((section, idx) => (
                    <div key={idx}>
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                {section.title}
                            </h2>
                            <div className="h-px flex-1" style={{ background: 'var(--border-subtle)' }} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {section.modules.map(({ href, icon: Icon, label, desc, color }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className="card-hover flex flex-col items-start gap-2 py-4 px-3"
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: `${color}20` }}
                                    >
                                        <Icon size={20} style={{ color }} />
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                            {label}
                                        </p>
                                        <p className="text-xs leading-tight mt-1" style={{ color: 'var(--text-muted)' }}>
                                            {desc}
                                        </p>
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
