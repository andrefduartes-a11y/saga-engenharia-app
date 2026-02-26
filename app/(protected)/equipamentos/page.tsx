'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Truck, Plus } from 'lucide-react'
import Link from 'next/link'

export default function ApontamentoEquipamentosPage() {
    const [apontamentos, setApontamentos] = useState<any[]>([])
    const [obras, setObras] = useState<any[]>([])
    const [obraFiltro, setObraFiltro] = useState('')
    const supabase = createClient()

    async function load(obraId?: string) {
        let query = supabase.from('apontamento_equipamentos').select('*, obras(nome)').order('data', { ascending: false })
        if (obraId) query = query.eq('obra_id', obraId)
        const { data } = await query
        setApontamentos(data || [])
    }

    useEffect(() => {
        load()
        supabase.from('obras').select('id, nome').then(({ data }) => setObras(data || []))
    }, [])

    const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Equipamentos</h1>
                <Link href="/equipamentos/novo" className="btn-primary py-2 px-4 text-sm min-h-[40px] w-auto">
                    <Plus size={16} /> Lançar Horas
                </Link>
            </div>

            <select className="input" value={obraFiltro} onChange={e => { setObraFiltro(e.target.value); load(e.target.value) }}>
                <option value="">Todas as obras</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>

            {apontamentos.length === 0 ? (
                <div className="card text-center py-12">
                    <Truck size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum apontamento</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Registre as horas trabalhadas das máquinas</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {apontamentos.map(ap => (
                        <div key={ap.id} className="card flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(232, 162, 48, 0.15)' }}>
                                <Truck size={20} style={{ color: '#E8A230' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-sm text-white">{ap.equipamento}</p>
                                    <span className="badge-gray font-bold">{ap.horas_trabalhadas}h</span>
                                </div>
                                <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{ap.atividade_realizada}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Obra: {(ap.obras as any)?.nome} | Data: {formatDate(ap.data)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
