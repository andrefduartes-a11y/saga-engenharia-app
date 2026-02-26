'use client'

import Link from 'next/link'
import { useObra } from '@/lib/obra-context'
import {
    HardHat, Layers, Mountain, Clipboard,
    FolderOpen, ShoppingCart, Bot, GraduationCap,
    HelpCircle, Building2, ChevronRight, MapPin
} from 'lucide-react'

const MODULES = [
    { href: '/concreto', icon: HardHat, label: 'Concretagem', desc: 'Lançamentos e rompimentos', color: '#7FA653' },
    { href: '/tracos', icon: Layers, label: 'Banco de Traços', desc: 'Proporcionamento automático', color: '#4A90D9' },
    { href: '/terraplanagem', icon: Mountain, label: 'Terraplanagem', desc: 'Etapas e registros diários', color: '#D4A843' },
    { href: '/inspecoes', icon: Clipboard, label: 'FVS', desc: 'Fichas de verificação', color: '#E85D75' },
    { href: '/projetos', icon: FolderOpen, label: 'Projetos', desc: '13 disciplinas técnicas', color: '#9B59B6' },
    { href: '/suprimentos', icon: ShoppingCart, label: 'Suprimentos', desc: 'Solicitação por voz', color: '#E67E22' },
    { href: '/assistente', icon: Bot, label: 'Assistente IA', desc: 'Chat de engenharia', color: '#1ABC9C' },
    { href: '/ead', icon: GraduationCap, label: 'EAD', desc: 'Treinamentos e vídeos', color: '#3498DB' },
    { href: '/faq', icon: HelpCircle, label: 'FAQ / DRH', desc: 'Dúvidas frequentes', color: '#7F8C8D' },
]

export default function DashboardPage() {
    const { obra } = useObra()

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
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

            {/* Grade de módulos */}
            <div>
                <h2 className="section-title mb-3">Módulos</h2>
                <div className="grid grid-cols-3 gap-3">
                    {MODULES.map(({ href, icon: Icon, label, desc, color }) => (
                        <Link
                            key={href}
                            href={href}
                            className="card-hover flex flex-col items-center text-center gap-2 py-4 px-2"
                        >
                            <div
                                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                style={{ background: `${color}20` }}
                            >
                                <Icon size={22} style={{ color }} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                    {label}
                                </p>
                                <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                    {desc}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
