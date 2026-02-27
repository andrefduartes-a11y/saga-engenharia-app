'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import { HardHat, Plus, ChevronRight, Layers, Calendar, Trash2, X } from 'lucide-react'

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

interface Agendamento {
    id: string
    data_agendada: string
    elemento?: string
    volume_estimado?: number
    fck_previsto?: number
    observacoes?: string
}

export default function ConcretoPage() {
    const { obra } = useObra()
    const supabase = createClient()
    const [itens, setItens] = useState<Concretagem[]>([])
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [loading, setLoading] = useState(true)
    const [showAgendar, setShowAgendar] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [form, setForm] = useState({ data_agendada: '', elemento: '', volume_estimado: '', fck_previsto: '', observacoes: '' })

    useEffect(() => {
        if (!obra) { setLoading(false); return }
        Promise.all([
            supabase.from('concretagens')
                .select('id, data_concretagem, fck, volume_m3, elementos_concretados, fornecedor, responsavel, cor_hex')
                .eq('obra_id', obra.id)
                .order('data_concretagem', { ascending: false }),
            supabase.from('concretagens_agendadas')
                .select('id, data_agendada, elemento, volume_estimado, fck_previsto, observacoes')
                .eq('obra_id', obra.id)
                .gte('data_agendada', new Date().toISOString().split('T')[0])
                .order('data_agendada', { ascending: true }),
        ]).then(([{ data: c }, { data: a }]) => {
            setItens(c || [])
            setAgendamentos(a || [])
            setLoading(false)
        })
    }, [obra])

    async function salvarAgendamento() {
        if (!obra || !form.data_agendada) return
        setSalvando(true)
        const { data } = await supabase.from('concretagens_agendadas').insert({
            obra_id: obra.id,
            data_agendada: form.data_agendada,
            elemento: form.elemento || null,
            volume_estimado: form.volume_estimado ? parseFloat(form.volume_estimado) : null,
            fck_previsto: form.fck_previsto ? parseInt(form.fck_previsto) : null,
            observacoes: form.observacoes || null,
        }).select().single()
        if (data) { setAgendamentos(p => [...p, data].sort((a, b) => a.data_agendada.localeCompare(b.data_agendada))) }
        setForm({ data_agendada: '', elemento: '', volume_estimado: '', fck_previsto: '', observacoes: '' })
        setShowAgendar(false)
        setSalvando(false)
    }

    async function deletarAgendamento(id: string) {
        await supabase.from('concretagens_agendadas').delete().eq('id', id)
        setAgendamentos(p => p.filter(a => a.id !== id))
    }

    const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    const fmtShort = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

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

            {/* ── Próximas Concretagens ── */}
            <div>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={14} style={{ color: '#D4A843' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Próximas Concretagens
                        </span>
                    </div>
                    <button onClick={() => setShowAgendar(v => !v)} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 6,
                        background: showAgendar ? 'rgba(255,255,255,0.06)' : 'rgba(212,168,67,0.12)',
                        border: `1px solid ${showAgendar ? 'var(--border-subtle)' : 'rgba(212,168,67,0.3)'}`,
                        color: showAgendar ? 'var(--text-muted)' : '#D4A843', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                        {showAgendar ? <><X size={12} /> Cancelar</> : <><Plus size={12} /> Agendar</>}
                    </button>
                </div>

                {/* Form de agendamento */}
                {showAgendar && (
                    <div className="card" style={{ marginBottom: 12, padding: '16px 18px' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Nova Concretagem Agendada</p>
                        <div style={{ display: 'grid', gap: 10 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label className="label">Data *</label>
                                    <input className="input" type="date" value={form.data_agendada}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setForm(p => ({ ...p, data_agendada: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label">FCK previsto (MPa)</label>
                                    <input className="input" type="number" placeholder="Ex: 30" value={form.fck_previsto}
                                        onChange={e => setForm(p => ({ ...p, fck_previsto: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Elemento a concretar</label>
                                <input className="input" placeholder="Ex: Laje do 3º pavimento" value={form.elemento}
                                    onChange={e => setForm(p => ({ ...p, elemento: e.target.value }))} />
                            </div>
                            <div>
                                <label className="label">Volume estimado (m³)</label>
                                <input className="input" type="number" step="0.1" placeholder="Ex: 45.5" value={form.volume_estimado}
                                    onChange={e => setForm(p => ({ ...p, volume_estimado: e.target.value }))} />
                            </div>
                            <div>
                                <label className="label">Observações</label>
                                <textarea className="input" rows={2} placeholder="Notas adicionais..." value={form.observacoes}
                                    onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
                            </div>
                            <button onClick={salvarAgendamento} disabled={salvando || !form.data_agendada}
                                className="btn-primary" style={{ background: '#D4A843', borderColor: '#D4A843' }}>
                                {salvando ? 'Agendando...' : '📅 Confirmar Agendamento'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de agendamentos */}
                {!obra ? null : agendamentos.length === 0 ? (
                    <div style={{
                        padding: '14px 18px', borderRadius: 12, textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)',
                        fontSize: 12, color: 'var(--text-muted)',
                    }}>
                        Nenhuma concretagem agendada. Use o botão acima para agendar.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 6 }}>
                        {agendamentos.map(ag => (
                            <div key={ag.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12,
                                background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)',
                            }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                    background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Calendar size={16} style={{ color: '#D4A843' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {fmtShort(ag.data_agendada)}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                                        {[ag.elemento, ag.fck_previsto ? `FCK ${ag.fck_previsto} MPa` : null, ag.volume_estimado ? `${ag.volume_estimado} m³` : null]
                                            .filter(Boolean).join(' • ') || 'Concretagem agendada'}
                                    </div>
                                </div>
                                <button onClick={() => deletarAgendamento(ag.id)} style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', padding: 4, flexShrink: 0,
                                }} title="Remover agendamento">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Divisor */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Histórico
                </div>
            </div>

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
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma concretagem registrada</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Use o botão acima para registrar</p>
                </div>
            )}

            {obra && !loading && itens.length > 0 && (
                <div className="space-y-2">
                    {itens.map(c => (
                        <Link key={c.id} href={`/concreto/${c.id}`} className="card-hover flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full flex-shrink-0"
                                style={{ background: c.cor_hex || '#525F6B', boxShadow: `0 0 8px ${c.cor_hex || '#525F6B'}80` }} />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    FCK {c.fck} MPa — {c.volume_m3} m³
                                </p>
                                {c.elementos_concretados?.length > 0 && (
                                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                        {c.elementos_concretados.join(', ')}
                                    </p>
                                )}
                                {c.fornecedor && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.fornecedor}</p>}
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
