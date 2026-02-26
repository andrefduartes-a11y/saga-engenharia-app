'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Map, Plus } from 'lucide-react'
import Link from 'next/link'

export default function CaminhoesPage() {
    const [viagens, setViagens] = useState<any[]>([])
    const [obras, setObras] = useState<any[]>([])
    const [obraFiltro, setObraFiltro] = useState('')
    const supabase = createClient()

    async function load(obraId?: string) {
        let query = supabase.from('viagens_caminhao').select('*, obras(nome)').order('data', { ascending: false })
        if (obraId) query = query.eq('obra_id', obraId)
        const { data } = await query
        setViagens(data || [])
    }

    useEffect(() => {
        load()
        supabase.from('obras').select('id, nome').then(({ data }) => setObras(data || []))
    }, [])

    const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Viagens Caminhão</h1>
                <Link href="/caminhoes/novo" className="btn-primary py-2 px-4 text-sm min-h-[40px] w-auto">
                    <Plus size={16} /> Lançar Viagens
                </Link>
            </div>

            <select className="input" value={obraFiltro} onChange={e => { setObraFiltro(e.target.value); load(e.target.value) }}>
                <option value="">Todas as obras</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>

            {viagens.length === 0 ? (
                <div className="card text-center py-12">
                    <Map size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum romaneio</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Registre o fluxo de terraplanagem e transporte</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {viagens.map(vi => (
                        <div key={vi.id} className="card flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(74, 158, 204, 0.15)' }}>
                                <Map size={20} style={{ color: '#4A9ECC' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-sm text-white">{vi.tipo_caminhao} {vi.placa && `- ${vi.placa}`}</p>
                                    <span className="badge-info font-bold flex-shrink-0 ml-2">{vi.qtd_viagens}x viagens</span>
                                </div>
                                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{vi.origem} → {vi.destino}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Obra: {(vi.obras as any)?.nome} | Data: {formatDate(vi.data)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
