import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
    Building2,
    ClipboardList,
    HardHat,
    Truck,
    Plus,
    AlertTriangle,
    ChevronRight,
    TrendingUp,
    FolderGit2,
    CheckSquare,
    BookOpen,
    Map
} from 'lucide-react'

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch dashboard data
    const [obrasRes, rdosRes, concretagemsRes] = await Promise.all([
        supabase.from('obras').select('id, nome, status').eq('status', 'ativa'),
        supabase.from('rdos').select('id, data, obra_id, obras(nome)').order('data', { ascending: false }).limit(1),
        supabase.from('concretagens').select('id, data, fck, volume, obra_id, obras(nome)').order('data', { ascending: false }).limit(1),
    ])

    const obrasAtivas = obrasRes.data || []
    const ultimoRdo = rdosRes.data?.[0]
    const ultimaConcreto = concretagemsRes.data?.[0]

    const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

    return (
        <div className="px-4 py-4 space-y-5 animate-fade-up">
            {/* Greeting */}
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Bom dia! 👷</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Painel do Canteiro — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
                <Link href="/rdo/novo" id="btn-novo-rdo" className="btn-primary flex-col py-5 gap-2">
                    <ClipboardList size={28} />
                    <span>Novo RDO</span>
                </Link>
                <Link href="/concreto/novo" id="btn-nova-concreto" className="btn-secondary flex-col py-5 gap-2 min-h-[56px]">
                    <HardHat size={28} />
                    <span>Nova Concretagem</span>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="card">
                    <div className="flex items-center gap-2 mb-1">
                        <Building2 size={16} style={{ color: 'var(--green-primary)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Obras ativas</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: 'var(--green-primary)' }}>{obrasAtivas.length}</p>
                </div>
                <Link href="/rdo" className="card-hover">
                    <div className="flex items-center gap-2 mb-1">
                        <ClipboardList size={16} style={{ color: 'var(--info)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Último RDO</span>
                    </div>
                    {ultimoRdo ? (
                        <>
                            <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{formatDate(ultimoRdo.data)}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{(ultimoRdo.obras as any)?.nome}</p>
                        </>
                    ) : (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nenhum lançado</p>
                    )}
                </Link>
            </div>

            {/* Última Concretagem */}
            {ultimaConcreto && (
                <div className="card">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Última Concretagem</span>
                        <Link href="/concreto" className="text-xs flex items-center gap-1" style={{ color: 'var(--green-primary)' }}>
                            Ver todas <ChevronRight size={14} />
                        </Link>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>FCK {ultimaConcreto.fck} MPa</p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{ultimaConcreto.volume} m³ — {(ultimaConcreto.obras as any)?.nome}</p>
                        </div>
                        <span className="badge-green">{formatDate(ultimaConcreto.data)}</span>
                    </div>
                </div>
            )}

            {/* Obras ativas */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="section-title">Obras em andamento</h2>
                    <Link href="/obras" className="text-xs flex items-center gap-1" style={{ color: 'var(--green-primary)' }}>
                        Ver todas <ChevronRight size={14} />
                    </Link>
                </div>
                <div className="space-y-2">
                    {obrasAtivas.length === 0 ? (
                        <div className="card text-center py-8">
                            <Building2 size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma obra ativa</p>
                            <Link href="/obras" className="btn-primary mt-4 inline-flex">
                                <Plus size={16} />
                                Cadastrar obra
                            </Link>
                        </div>
                    ) : (
                        obrasAtivas.map((obra) => (
                            <Link key={obra.id} href={`/obras/${obra.id}`} className="card-hover flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(127, 166, 83, 0.15)' }}>
                                        <Building2 size={20} style={{ color: 'var(--green-primary)' }} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{obra.nome}</p>
                                        <span className="badge-green">{obra.status}</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Atalhos rápidos */}
            <div>
                <h2 className="section-title mb-3">Acesso Rápido</h2>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { href: '/projetos', icon: FolderGit2, label: 'Projetos' },
                        { href: '/equipamentos', icon: Truck, label: 'Máquinas' },
                        { href: '/caminhoes', icon: Map, label: 'Caminhões' },
                        { href: '/inspecoes', icon: CheckSquare, label: 'FVS' },
                        { href: '/instrucoes-trabalho', icon: BookOpen, label: 'ITs' },
                        { href: '/documentos', icon: ClipboardList, label: 'Documentos' },
                        { href: '/apoio-tecnico', icon: TrendingUp, label: 'Apoio IA' },
                    ].map(({ href, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="card-hover flex flex-col items-center gap-2 py-4"
                        >
                            <Icon size={22} style={{ color: 'var(--green-primary)' }} />
                            <span className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
