'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Truck, Plus, Loader2, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'

export default function EquipamentosPage() {
    const [equipamentos, setEquipamentos] = useState<any[]>([])
    const [obras, setObras] = useState<any[]>([])
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    async function load() {
        const { data } = await supabase.from('equipamentos').select('*, obras(nome)').order('created_at', { ascending: false })
        setEquipamentos(data || [])
    }

    useEffect(() => {
        load()
        supabase.from('obras').select('id, nome').then(({ data }) => setObras(data || []))
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const form = e.currentTarget
        const formData = new FormData(form)
        const { error } = await supabase.from('equipamentos').insert({
            obra_id: formData.get('obra_id') || null,
            nome: formData.get('nome'),
            horas_utilizadas: formData.get('horas') ? Number(formData.get('horas')) : null,
            custo_estimado: formData.get('custo_estimado') ? Number(formData.get('custo_estimado')) : null,
            custo_real: formData.get('custo_real') ? Number(formData.get('custo_real')) : null,
            data_registro: formData.get('data_registro') || null,
        })
        if (!error) {
            setShowForm(false)
            form.reset()
            load()
        } else {
            setError('Erro ao salvar.')
        }
        setLoading(false)
    }

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Equipamentos</h1>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2 px-4 text-sm min-h-[40px]">
                    {showForm ? <X size={16} /> : <><Plus size={16} /> Adicionar</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card space-y-4">
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>NOVO EQUIPAMENTO</h2>
                    <div>
                        <label className="label">Nome do equipamento *</label>
                        <input name="nome" type="text" className="input" placeholder="Ex: Grua, Betoneira, Escavadeira" required />
                    </div>
                    <div>
                        <label className="label">Obra</label>
                        <select name="obra_id" className="input">
                            <option value="">Selecione (opcional)</option>
                            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Data</label>
                            <input name="data_registro" type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                            <label className="label">Horas utilizadas</label>
                            <input name="horas" type="number" step="0.5" min="0" className="input" placeholder="0" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Custo estimado</label>
                            <input name="custo_estimado" type="number" step="0.01" min="0" className="input" placeholder="R$ 0,00" />
                        </div>
                        <div>
                            <label className="label">Custo real</label>
                            <input name="custo_real" type="number" step="0.01" min="0" className="input" placeholder="R$ 0,00" />
                        </div>
                    </div>
                    {error && <p className="text-sm" style={{ color: '#E05252' }}>{error}</p>}
                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar Equipamento'}
                    </button>
                </form>
            )}

            {equipamentos.length === 0 ? (
                <div className="card text-center py-12">
                    <Truck size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum equipamento registrado</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {equipamentos.map(eq => (
                        <div key={eq.id} className="card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232, 162, 48, 0.15)' }}>
                                        <Truck size={20} style={{ color: '#E8A230' }} />
                                    </div>
                                    <div>
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{eq.nome}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(eq.obras as any)?.nome}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {eq.horas_utilizadas && <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{eq.horas_utilizadas}h</p>}
                                    {eq.custo_real && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>R$ {Number(eq.custo_real).toLocaleString('pt-BR')}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
