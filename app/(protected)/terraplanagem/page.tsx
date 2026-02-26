'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mountain, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Etapa {
    id: string
    nome_etapa: string
    data_inicio?: string
    responsavel?: string
    status: string
}

export default function TerrapalagemPage() {
    const { obra } = useObra()
    const router = useRouter()
    const supabase = createClient()
    const [etapas, setEtapas] = useState<Etapa[]>([])
    const [loading, setLoading] = useState(true)
    const [novaEtapa, setNovaEtapa] = useState(false)
    const [form, setForm] = useState({ nome_etapa: '', data_inicio: '', responsavel: '' })
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        if (!obra) { setLoading(false); return }
        supabase.from('terraplanagem_etapas')
            .select('*')
            .eq('obra_id', obra.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => { setEtapas(data || []); setLoading(false) })
    }, [obra])

    async function criarEtapa() {
        if (!obra || !form.nome_etapa) return
        setSalvando(true)
        const { data } = await supabase.from('terraplanagem_etapas').insert({
            obra_id: obra.id,
            nome_etapa: form.nome_etapa,
            data_inicio: form.data_inicio || null,
            responsavel: form.responsavel || null,
        }).select().single()
        if (data) { setEtapas(p => [data, ...p]); setNovaEtapa(false); setForm({ nome_etapa: '', data_inicio: '', responsavel: '' }) }
        setSalvando(false)
    }

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Terraplanagem</h1>
                <button onClick={() => setNovaEtapa(true)} className="btn-primary py-2 px-4 text-sm min-h-[40px]">
                    <Plus size={16} /> Nova Etapa
                </button>
            </div>

            {novaEtapa && (
                <div className="card space-y-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nova Etapa</p>
                    <div>
                        <label className="form-label">Nome da Etapa *</label>
                        <input className="input" placeholder="Ex: Corte e aterro eixo A" required
                            value={form.nome_etapa} onChange={e => setForm(p => ({ ...p, nome_etapa: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label">Data Início</label>
                            <input className="input" type="date"
                                value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Responsável</label>
                            <input className="input" placeholder="Encarregado"
                                value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setNovaEtapa(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                        <button onClick={criarEtapa} disabled={salvando || !form.nome_etapa} className="btn-primary flex-1 text-sm">
                            {salvando ? 'Salvando...' : 'Criar'}
                        </button>
                    </div>
                </div>
            )}

            {!obra ? (
                <div className="card text-center py-8">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selecione uma obra</p>
                </div>
            ) : loading ? (
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="card animate-pulse" style={{ height: 70 }} />)}</div>
            ) : etapas.length === 0 ? (
                <div className="card text-center py-12">
                    <Mountain size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma etapa cadastrada</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {etapas.map(e => (
                        <Link key={e.id} href={`/terraplanagem/${e.id}`} className="card-hover flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,168,67,0.15)' }}>
                                <Mountain size={20} style={{ color: '#D4A843' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{e.nome_etapa}</p>
                                {e.responsavel && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.responsavel}</p>}
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                                background: e.status === 'finalizada' ? 'rgba(16,185,129,0.15)' : 'rgba(212,168,67,0.15)',
                                color: e.status === 'finalizada' ? '#10B981' : '#D4A843',
                            }}>
                                {e.status === 'finalizada' ? 'Finalizada' : 'Em andamento'}
                            </span>
                            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
