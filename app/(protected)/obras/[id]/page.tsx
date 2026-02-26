import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, ClipboardList, HardHat, Truck, FileText, Calendar, ChevronRight, Plus } from 'lucide-react'

export default async function ObraDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const [obraRes, rdosRes, concretaRes, equipRes] = await Promise.all([
        supabase.from('obras').select('*').eq('id', params.id).single(),
        supabase.from('rdos').select('id, data, clima, equipe_presente').eq('obra_id', params.id).order('data', { ascending: false }).limit(5),
        supabase.from('concretagens').select('id, data, fck, volume, elemento').eq('obra_id', params.id).order('data', { ascending: false }).limit(5),
        supabase.from('equipamentos').select('id, nome, horas_utilizadas').eq('obra_id', params.id).limit(5),
    ])

    if (!obraRes.data) notFound()
    const obra = obraRes.data

    return (
        <div className="px-4 py-4 space-y-5 animate-fade-up">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Link href="/obras" className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{obra.nome}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={obra.status === 'ativa' ? 'badge-green' : obra.status === 'pausada' ? 'badge-warning' : 'badge-info'}>{obra.status}</span>
                        {obra.spe_id && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>SPE: {obra.spe_id}</span>}
                    </div>
                </div>
            </div>

            {/* Info */}
            {(obra.data_inicio || obra.data_previsao_fim) && (
                <div className="card grid grid-cols-2 gap-4">
                    {obra.data_inicio && (
                        <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Início</p>
                            <p className="font-semibold text-sm flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                                <Calendar size={14} /> {new Date(obra.data_inicio + 'T12:00').toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    )}
                    {obra.data_previsao_fim && (
                        <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Previsão de fim</p>
                            <p className="font-semibold text-sm flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                                <Calendar size={14} /> {new Date(obra.data_previsao_fim + 'T12:00').toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
                <Link href={`/rdo/novo?obra=${obra.id}`} className="btn-primary flex-col py-4 gap-2 text-sm">
                    <ClipboardList size={22} />Novo RDO
                </Link>
                <Link href={`/concreto/novo?obra=${obra.id}`} className="btn-secondary flex-col py-4 gap-2 text-sm min-h-[56px]">
                    <HardHat size={22} />Nova Concretagem
                </Link>
            </div>

            {/* RDOs */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="section-title">Últimos RDOs</h2>
                    <Link href={`/rdo?obra=${obra.id}`} className="text-xs flex items-center gap-1" style={{ color: 'var(--green-primary)' }}>Ver todos <ChevronRight size={14} /></Link>
                </div>
                {rdosRes.data && rdosRes.data.length > 0 ? (
                    <div className="space-y-2">
                        {rdosRes.data.map(rdo => (
                            <Link key={rdo.id} href={`/rdo/${rdo.id}`} className="card-hover flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ClipboardList size={18} style={{ color: 'var(--green-primary)' }} />
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{new Date(rdo.data + 'T12:00').toLocaleDateString('pt-BR')}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{rdo.clima} • {rdo.equipe_presente} pessoas</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum RDO lançado</p>
                )}
            </div>
        </div>
    )
}
