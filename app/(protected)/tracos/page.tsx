'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Layers, Plus, Trash2, Calculator } from 'lucide-react'

interface Traco {
    id: string
    nome_traco: string
    fck?: number
    cimento_kg_m3?: number
    areia_m3?: number
    brita_m3?: number
    agua_l?: number
    aditivo?: string
    slump?: string
    observacoes?: string
}

export default function TracosPage() {
    const supabase = createClient()
    const [tracos, setTracos] = useState<Traco[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [volCalc, setVolCalc] = useState<{ traco: Traco; volume: string } | null>(null)
    const [form, setForm] = useState({
        nome_traco: '', fck: '', cimento_kg_m3: '', areia_m3: '', brita_m3: '', agua_l: '', aditivo: '', slump: '', observacoes: ''
    })
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        supabase.from('tracos_concreto').select('*').order('nome_traco')
            .then(({ data }) => { setTracos(data || []); setLoading(false) })
    }, [])

    async function salvar() {
        if (!form.nome_traco) return
        setSalvando(true)
        const { data } = await supabase.from('tracos_concreto').insert({
            nome_traco: form.nome_traco,
            fck: form.fck ? Number(form.fck) : null,
            cimento_kg_m3: form.cimento_kg_m3 ? Number(form.cimento_kg_m3) : null,
            areia_m3: form.areia_m3 ? Number(form.areia_m3) : null,
            brita_m3: form.brita_m3 ? Number(form.brita_m3) : null,
            agua_l: form.agua_l ? Number(form.agua_l) : null,
            aditivo: form.aditivo || null,
            slump: form.slump || null,
            observacoes: form.observacoes || null,
        }).select().single()
        if (data) { setTracos(p => [...p, data]); setShowForm(false); setForm({ nome_traco: '', fck: '', cimento_kg_m3: '', areia_m3: '', brita_m3: '', agua_l: '', aditivo: '', slump: '', observacoes: '' }) }
        setSalvando(false)
    }

    async function excluir(id: string) {
        if (!confirm('Excluir traço?')) return
        await supabase.from('tracos_concreto').delete().eq('id', id)
        setTracos(p => p.filter(t => t.id !== id))
    }

    const calcular = (t: Traco, vol: number) => ({
        cimento: t.cimento_kg_m3 ? (t.cimento_kg_m3 * vol).toFixed(1) + ' kg' : '—',
        areia: t.areia_m3 ? (t.areia_m3 * vol).toFixed(2) + ' m³' : '—',
        brita: t.brita_m3 ? (t.brita_m3 * vol).toFixed(2) + ' m³' : '—',
        agua: t.agua_l ? (t.agua_l * vol).toFixed(0) + ' L' : '—',
    })

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Banco de Traços</h1>
                <button onClick={() => setShowForm(true)} className="btn-primary py-2 px-4 text-sm min-h-[40px]">
                    <Plus size={16} /> Novo
                </button>
            </div>

            {showForm && (
                <div className="card space-y-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Novo Traço</p>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                            <label className="form-label">Nome do Traço *</label>
                            <input className="input" placeholder="Ex: FCK25 - Pilares" value={form.nome_traco}
                                onChange={e => setForm(p => ({ ...p, nome_traco: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">FCK (MPa)</label>
                            <input className="input" type="number" placeholder="Ex: 25" value={form.fck}
                                onChange={e => setForm(p => ({ ...p, fck: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Slump (cm)</label>
                            <input className="input" placeholder="Ex: 10±2" value={form.slump}
                                onChange={e => setForm(p => ({ ...p, slump: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Cimento (kg/m³)</label>
                            <input className="input" type="number" step="0.1" value={form.cimento_kg_m3}
                                onChange={e => setForm(p => ({ ...p, cimento_kg_m3: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Areia (m³/m³)</label>
                            <input className="input" type="number" step="0.01" value={form.areia_m3}
                                onChange={e => setForm(p => ({ ...p, areia_m3: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Brita (m³/m³)</label>
                            <input className="input" type="number" step="0.01" value={form.brita_m3}
                                onChange={e => setForm(p => ({ ...p, brita_m3: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Água (L/m³)</label>
                            <input className="input" type="number" step="1" value={form.agua_l}
                                onChange={e => setForm(p => ({ ...p, agua_l: e.target.value }))} />
                        </div>
                        <div className="col-span-2">
                            <label className="form-label">Aditivo</label>
                            <input className="input" placeholder="Tipo e dosagem" value={form.aditivo}
                                onChange={e => setForm(p => ({ ...p, aditivo: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                        <button onClick={salvar} disabled={salvando || !form.nome_traco} className="btn-primary flex-1 text-sm">
                            {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Calculadora */}
            {volCalc && (
                <div className="card space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            📐 {volCalc.traco.nome_traco}
                        </p>
                        <button onClick={() => setVolCalc(null)} style={{ color: 'var(--text-muted)', fontSize: 18 }}>×</button>
                    </div>
                    <div>
                        <label className="form-label">Volume a concretar (m³)</label>
                        <input className="input" type="number" step="0.5" placeholder="Ex: 12.5"
                            value={volCalc.volume}
                            onChange={e => setVolCalc(p => p ? { ...p, volume: e.target.value } : null)} />
                    </div>
                    {volCalc.volume && Number(volCalc.volume) > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(calcular(volCalc.traco, Number(volCalc.volume))).map(([k, v]) => (
                                <div key={k} className="rounded-xl p-3" style={{ background: 'var(--bg-card-hover)' }}>
                                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{k}</p>
                                    <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{v}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card animate-pulse" style={{ height: 70 }} />)}</div>
            ) : tracos.length === 0 ? (
                <div className="card text-center py-12">
                    <Layers size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum traço cadastrado</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tracos.map(t => (
                        <div key={t.id} className="card">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t.nome_traco}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {t.fck && <span className="badge-info">FCK {t.fck} MPa</span>}
                                        {t.slump && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Slump: {t.slump}</span>}
                                        {t.cimento_kg_m3 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cimento: {t.cimento_kg_m3} kg/m³</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                    <button onClick={() => setVolCalc({ traco: t, volume: '' })}
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ background: 'rgba(127,166,83,0.15)', color: 'var(--green-primary)' }}
                                        title="Calcular proporção">
                                        <Calculator size={14} />
                                    </button>
                                    <button onClick={() => excluir(t.id)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
