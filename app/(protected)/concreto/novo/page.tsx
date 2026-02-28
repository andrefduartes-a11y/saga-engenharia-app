'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useObra } from '@/lib/obra-context'
import { ArrowLeft, ChevronDown, Droplets, Calendar } from 'lucide-react'
import Link from 'next/link'

const ELEMENTOS = [
    'Sapata', 'Bloco', 'Pilar', 'Viga', 'Laje', 'Escada',
    'Muro de Contenção', 'Radier', 'Fundação', 'Parede Estrutural', 'Reservatório', 'Piso'
]

export default function ConcretoNovoPage() {
    const router = useRouter()
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [allObras, setAllObras] = useState<{ id: string; nome: string }[]>([])
    const [selectedObraId, setSelectedObraId] = useState('')
    const obra = isDirector ? (allObras.find(o => o.id === selectedObraId) || null) : obraCtx
    const obraId = obra?.id

    const [form, setForm] = useState({
        data: new Date().toISOString().split('T')[0],
        fck: 25,
        volume_m3: '',
        elementos_concretados: [] as string[],
    })
    const [salvando, setSalvando] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isDirector) return
        supabase.from('obras').select('id, nome').order('nome')
            .then(({ data }) => setAllObras(data || []))
    }, [isDirector])

    const toggleElemento = (el: string) =>
        setForm(p => ({ ...p, elementos_concretados: p.elementos_concretados.includes(el) ? p.elementos_concretados.filter(e => e !== el) : [...p.elementos_concretados, el] }))

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!obraId) { setError('Selecione uma obra.'); return }
        setSalvando(true)
        const { error: dbErr } = await supabase.from('concretagens').insert({
            obra_id: obraId,
            data: form.data,
            fck: Number(form.fck),
            volume_m3: Number(form.volume_m3),
            elementos_concretados: form.elementos_concretados,
        })
        if (dbErr) { setError(`Erro: ${dbErr.message}`); setSalvando(false) }
        else router.push('/concreto')
    }

    return (
        <div style={{ padding: '20px', maxWidth: 600 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href="/concreto" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74,144,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Droplets size={18} style={{ color: '#4A90D9' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Marcar Concretagem</h1>
                        {obra && !isDirector && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{obra.nome}</p>}
                    </div>
                </div>
            </div>

            {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Obra (directors) */}
                {isDirector && (
                    <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(74,144,217,0.2)' }}>
                        <label className="form-label">Obra *</label>
                        <div style={{ position: 'relative' }}>
                            <select className="input" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} style={{ appearance: 'none', paddingRight: 40 }} required>
                                <option value="">Selecione a obra...</option>
                                {allObras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                    </div>
                )}

                {/* Dados principais */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(74,144,217,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#4A90D9', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Dados da Concretagem</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="form-label"><Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />Data *</label>
                                <input className="input" type="date" required value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">FCK (MPa) *</label>
                                <input className="input" type="number" required min={1} value={form.fck} onChange={e => setForm(p => ({ ...p, fck: Number(e.target.value) }))} />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Volume (m³) *</label>
                            <input className="input" type="number" step="0.1" required placeholder="Ex: 12.5" value={form.volume_m3} onChange={e => setForm(p => ({ ...p, volume_m3: e.target.value }))} />
                        </div>
                    </div>
                </div>

                {/* Elementos */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(74,144,217,0.15)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#4A90D9', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Elementos Concretados</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {ELEMENTOS.map(el => {
                            const sel = form.elementos_concretados.includes(el)
                            return (
                                <button key={el} type="button" onClick={() => toggleElemento(el)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: sel ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.04)', color: sel ? '#4A90D9' : 'var(--text-muted)', border: `1px solid ${sel ? 'rgba(74,144,217,0.5)' : 'var(--border-subtle)'}` }}>
                                    {el}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <button type="submit" disabled={salvando} style={{ padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #4A90D9, #3a72b0)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: salvando ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(74,144,217,0.3)' }}>
                    {salvando ? 'Salvando...' : '💧 Registrar Concretagem'}
                </button>
            </form>
        </div>
    )
}
