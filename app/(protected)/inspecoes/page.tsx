'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import { CheckSquare, Plus, ChevronRight, Filter } from 'lucide-react'

interface FVS {
    id: string
    data: string
    elemento?: string
    status: string
    responsavel?: string
    its?: { codigo: string; nome: string }
}

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
    aprovado: { bg: 'rgba(16,185,129,0.15)', text: '#10B981', label: 'APROVADO' },
    reprovado: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'REPROVADO' },
    em_andamento: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', label: 'EM ANDAMENTO' },
}

export default function FVSPage() {
    const { obra } = useObra()
    const supabase = createClient()
    const [itens, setItens] = useState<FVS[]>([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState<string>('')

    useEffect(() => {
        if (!obra) { setLoading(false); return }
        let q = supabase.from('fvs')
            .select('id, data, elemento, status, responsavel, its(codigo, nome)')
            .eq('obra_id', obra.id)
            .order('data', { ascending: false })
        if (filtro) q = q.eq('status', filtro)
        q.then(({ data }) => { setItens(data as any || []); setLoading(false) })
    }, [obra, filtro])

    const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>FVS</h1>
                <Link href="/inspecoes/nova" className="btn-primary py-2 px-4 text-sm min-h-[40px]">
                    <Plus size={16} /> Nova FVS
                </Link>
            </div>

            {/* Filtro de status */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {[['', 'Todas'], ['aprovado', 'Aprovadas'], ['reprovado', 'Reprovadas'], ['em_andamento', 'Em andamento']].map(([v, l]) => (
                    <button key={v} onClick={() => setFiltro(v)}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all"
                        style={{
                            background: filtro === v ? 'var(--green-primary)' : 'var(--bg-card)',
                            color: filtro === v ? '#fff' : 'var(--text-muted)',
                            border: `1px solid ${filtro === v ? 'var(--green-primary)' : 'var(--border-subtle)'}`,
                        }}>
                        {l}
                    </button>
                ))}
            </div>

            {!obra ? (
                <div className="card text-center py-8">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selecione uma obra</p>
                    <Link href="/selecionar-obra" className="btn-primary mt-4 inline-flex">Selecionar obra</Link>
                </div>
            ) : loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card animate-pulse" style={{ height: 70 }} />)}</div>
            ) : itens.length === 0 ? (
                <div className="card text-center py-12">
                    <CheckSquare size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma FVS</p>
                    <Link href="/inspecoes/nova" className="btn-primary mt-5 inline-flex"><Plus size={16} /> Nova FVS</Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {itens.map(fvs => {
                        const st = statusColor[fvs.status] || statusColor.em_andamento
                        return (
                            <Link key={fvs.id} href={`/inspecoes/${fvs.id}`} className="card-hover flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: st.bg }}>
                                    <CheckSquare size={20} style={{ color: st.text }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                        {fvs.elemento || 'Inspeção'}
                                    </p>
                                    {fvs.its && (
                                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                            IT: {(fvs.its as any).codigo} — {(fvs.its as any).nome}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: st.bg, color: st.text }}>
                                        {st.label}
                                    </span>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{fmt(fvs.data)}</p>
                                </div>
                                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
