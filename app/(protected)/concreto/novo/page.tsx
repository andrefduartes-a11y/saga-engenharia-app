'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useObra } from '@/lib/obra-context'
import { ArrowLeft, ChevronDown, HardHat, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'

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
        data_agendada: new Date().toISOString().split('T')[0],
        elemento: '',
        volume_estimado: '',
        fck_previsto: '',
        observacoes: '',
    })
    const [salvando, setSalvando] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isDirector) return
        supabase.from('obras').select('id, nome').order('nome')
            .then(({ data }) => setAllObras(data || []))
    }, [isDirector])

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!obraId) { setError('Selecione uma obra.'); return }
        setSalvando(true)
        setError('')

        const { error: dbErr } = await supabase.from('concretagens_agendadas').insert({
            obra_id: obraId,
            data_agendada: form.data_agendada,
            elemento: form.elemento || null,
            volume_estimado: form.volume_estimado ? parseFloat(form.volume_estimado) : null,
            fck_previsto: form.fck_previsto ? parseInt(form.fck_previsto) : null,
            observacoes: form.observacoes || null,
            status: 'agendada',
        })

        if (dbErr) { setError(`Erro: ${dbErr.message}`); setSalvando(false) }
        else router.push('/concreto')
    }

    return (
        <div style={{ padding: '20px', maxWidth: 560 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href="/concreto" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74,144,217,0.15)', border: '1px solid rgba(74,144,217,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HardHat size={18} style={{ color: '#4A90D9' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Agendar Concretagem</h1>
                        {obra && !isDirector && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{obra.nome}</p>}
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Obra — apenas para diretores */}
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

                {/* Dados do agendamento */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(74,144,217,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#4A90D9', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Dados do Agendamento</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        <div>
                            <label className="form-label"><Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />Data da Concretagem *</label>
                            <input className="input" type="date" required value={form.data_agendada} onChange={e => set('data_agendada', e.target.value)} />
                        </div>

                        <div>
                            <label className="form-label">Elemento / Estrutura</label>
                            <input className="input" placeholder="Ex: Laje 2º Pavimento — Eixos A-E" value={form.elemento} onChange={e => set('elemento', e.target.value)} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="form-label">Volume previsto (m³)</label>
                                <input className="input" type="number" step="0.5" placeholder="Ex: 40" value={form.volume_estimado} onChange={e => set('volume_estimado', e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">FCK previsto (MPa)</label>
                                <input className="input" type="number" placeholder="Ex: 25" value={form.fck_previsto} onChange={e => set('fck_previsto', e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Observações</label>
                            <textarea className="input" rows={2} placeholder="Detalhes adicionais..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={salvando} style={{ padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #4A90D9, #3a72b0)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: salvando ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(74,144,217,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {salvando ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : '📅 Agendar Concretagem'}
                </button>
            </form>
        </div>
    )
}
