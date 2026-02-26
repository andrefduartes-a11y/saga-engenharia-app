'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckSquare, Plus } from 'lucide-react'
import Link from 'next/link'

export default function FVSPage() {
    const [inspecoes, setInspecoes] = useState<any[]>([])
    const [obras, setObras] = useState<any[]>([])
    const [obraFiltro, setObraFiltro] = useState('')
    const supabase = createClient()

    async function load(obraId?: string) {
        let query = supabase.from('fvs').select('*, obras(nome)').order('data', { ascending: false })
        if (obraId) query = query.eq('obra_id', obraId)
        const { data } = await query
        setInspecoes(data || [])
    }

    useEffect(() => {
        load()
        supabase.from('obras').select('id, nome').then(({ data }) => setObras(data || []))
    }, [])

    const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

    const statusColor: Record<string, string> = {
        aprovado: 'badge-green',
        reprovado: 'badge-red',
        em_andamento: 'badge-yellow',
    }

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Inspeções (FVS)</h1>
                <Link href="/inspecoes/nova" className="btn-primary py-2 px-4 text-sm min-h-[40px] w-auto">
                    <Plus size={16} /> Nova FVS
                </Link>
            </div>

            <select className="input" value={obraFiltro} onChange={e => { setObraFiltro(e.target.value); load(e.target.value) }}>
                <option value="">Todas as obras</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>

            {inspecoes.length === 0 ? (
                <div className="card text-center py-12">
                    <CheckSquare size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma FVS</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Comece a inspecionar serviços na obra</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {inspecoes.map(fvs => (
                        <div key={fvs.id} className="card flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={16} style={{ color: 'var(--text-muted)' }} />
                                    <span className="text-sm font-semibold text-white">{fvs.servico_inspecionado}</span>
                                </div>
                                <span className={statusColor[fvs.status] || 'badge-gray'}>
                                    {fvs.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Local: {fvs.local_trecho}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Obra: {(fvs.obras as any)?.nome} | Data: {formatDate(fvs.data)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
