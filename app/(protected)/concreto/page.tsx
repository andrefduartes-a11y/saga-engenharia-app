'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import { HardHat, Plus, ChevronRight, Layers } from 'lucide-react'

interface Concretagem {
    id: string
    data_concretagem: string
    fck: number
    volume_m3: number
    elementos_concretados: string[]
    fornecedor?: string
    responsavel?: string
    cor_hex?: string
}

export default function ConcretoPage() {
    const { obra } = useObra()
    const supabase = createClient()
    const [itens, setItens] = useState<Concretagem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!obra) { setLoading(false); return }
        supabase
            .from('concretagens')
            .select('id, data_concretagem, fck, volume_m3, elementos_concretados, fornecedor, responsavel, cor_hex')
            .eq('obra_id', obra.id)
            .order('data_concretagem', { ascending: false })
            .then(({ data }) => { setItens(data || []); setLoading(false) })
    }, [obra])

    const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Concretagem</h1>
                <Link href="/concreto/novo" className="btn-primary py-2 px-4 text-sm min-h-[40px]">
                    <Plus size={16} /> Nova
                </Link>
            </div>

            {/* Submenu: Banco de Traços */}
            <Link href="/tracos" className="card-hover flex items-center justify-between" style={{ padding: '12px 16px', background: 'rgba(74, 144, 217, 0.05)', border: '1px solid rgba(74, 144, 217, 0.2)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74, 144, 217, 0.15)' }}>
                        <Layers size={16} style={{ color: '#4A90D9' }} />
                    </div>
                    <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Banco de Traços</p>
                        <p className="text-xs" style={{ color: '#4A90D9' }}>Calculadora e traços cadastrados</p>
                    </div>
                </div>
                <ChevronRight size={16} style={{ color: '#4A90D9' }} />
            </Link>

            {!obra && (
                <div className="card text-center py-8">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selecione uma obra para ver as concretagens</p>
                    <Link href="/selecionar-obra" className="btn-primary mt-4 inline-flex">Selecionar obra</Link>
                </div>
            )}

            {obra && loading && (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card animate-pulse" style={{ height: 80 }} />)}</div>
            )}

            {obra && !loading && itens.length === 0 && (
                <div className="card text-center py-12">
                    <HardHat size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma concretagem</p>
                    <Link href="/concreto/novo" className="btn-primary mt-5 inline-flex"><Plus size={16} /> Nova Concretagem</Link>
                </div>
            )}

            {obra && !loading && itens.length > 0 && (
                <div className="space-y-2">
                    {itens.map(c => (
                        <Link key={c.id} href={`/concreto/${c.id}`} className="card-hover flex items-center gap-3">
                            {/* Bolinha colorida */}
                            <div
                                className="w-5 h-5 rounded-full flex-shrink-0"
                                style={{ background: c.cor_hex || '#525F6B', boxShadow: `0 0 8px ${c.cor_hex || '#525F6B'}80` }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    FCK {c.fck} MPa — {c.volume_m3} m³
                                </p>
                                {c.elementos_concretados?.length > 0 && (
                                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                        {c.elementos_concretados.join(', ')}
                                    </p>
                                )}
                                {c.fornecedor && (
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.fornecedor}</p>
                                )}
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="badge-info">{fmt(c.data_concretagem)}</span>
                            </div>
                            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
