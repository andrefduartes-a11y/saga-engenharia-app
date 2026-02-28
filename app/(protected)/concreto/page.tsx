'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import {
    HardHat, Plus, ChevronRight, Layers, Calendar, Trash2, X,
    Building2, ChevronDown, AlertCircle, Droplets
} from 'lucide-react'

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

interface ObraSimples { id: string; nome: string; cidade?: string }

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtShort = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

export default function ConcretoPage() {
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [allObras, setAllObras] = useState<ObraSimples[]>([])
    const [selectedObraId, setSelectedObraId] = useState('')
    const obra = isDirector ? (allObras.find(o => o.id === selectedObraId) || null) : obraCtx

    const [itens, setItens] = useState<Concretagem[]>([])
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [loading, setLoading] = useState(true)
    const [showAgendar, setShowAgendar] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const [form, setForm] = useState({ data_agendada: '', elemento: '', volume_estimado: '', fck_previsto: '', observacoes: '' })

    useEffect(() => {
        if (!isDirector) return
        supabase.from('obras').select('id, nome, cidade').order('nome')
            .then(({ data }) => setAllObras(data || []))
    }, [isDirector])

    useEffect(() => {
        if (!obra) { setLoading(false); return }
        Promise.all([
            supabase.from('concretagens')
                .select('id, data_concretagem, fck, volume_m3, elementos_concretados, fornecedor, responsavel, cor_hex')
                .eq('obra_id', obra.id).order('data_concretagem', { ascending: false }),
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
    }, [obra?.id])

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
        if (data) setAgendamentos(p => [...p, data].sort((a, b) => a.data_agendada.localeCompare(b.data_agendada)))
        setForm({ data_agendada: '', elemento: '', volume_estimado: '', fck_previsto: '', observacoes: '' })
        setShowAgendar(false)
        setSalvando(false)
    }

    async function deletarAgendamento(id: string) {
        await supabase.from('concretagens_agendadas').delete().eq('id', id)
        setAgendamentos(p => p.filter(a => a.id !== id))
    }

    return (
        <div style={{ padding: '20px', maxWidth: 860 }}>

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(74,144,217,0.15)', border: '1px solid rgba(74,144,217,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HardHat size={20} style={{ color: '#4A90D9' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>Concretagem</h1>
                        {obra && !isDirector && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{obra.nome}</p>}
                    </div>
                </div>
                <Link
                    href={obra ? '/concreto/novo' : '#'}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px', borderRadius: 10,
                        background: obra ? 'linear-gradient(135deg, #4A90D9, #3a72b0)' : 'rgba(255,255,255,0.06)',
                        textDecoration: 'none', color: obra ? '#fff' : 'var(--text-muted)',
                        fontSize: 13, fontWeight: 700,
                        boxShadow: obra ? '0 4px 14px rgba(74,144,217,0.3)' : 'none',
                        pointerEvents: obra ? 'auto' : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    <Plus size={15} /> Nova
                </Link>
            </div>

            {/* ── Director obra selector ── */}
            {isDirector && (
                <div style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Building2 size={11} /> OBRA
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} className="input" style={{ appearance: 'none', paddingRight: 40 }}>
                            <option value="">Selecione uma obra...</option>
                            {allObras.map(o => <option key={o.id} value={o.id}>{o.nome}{o.cidade ? ` — ${o.cidade}` : ''}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                </div>
            )}

            {/* ── Banco de Traços shortcut ── */}
            <Link href="/tracos" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: 'rgba(74,144,217,0.04)', border: '1px solid rgba(74,144,217,0.2)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.08)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.04)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.2)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(74,144,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Layers size={18} style={{ color: '#4A90D9' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Banco de Traços</div>
                        <div style={{ fontSize: 11, color: '#4A90D9', marginTop: 1 }}>Calculadora e traços cadastrados</div>
                    </div>
                    <ChevronRight size={16} style={{ color: '#4A90D9' }} />
                </div>
            </Link>

            {!obra ? (
                <div style={{ padding: '52px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <AlertCircle size={40} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-muted)', opacity: 0.4 }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{isDirector ? 'Selecione uma obra acima' : 'Nenhuma obra vinculada'}</p>
                </div>
            ) : (
                <>
                    {/* ── Próximas Concretagens ── */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Calendar size={14} style={{ color: '#D4A843' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Próximas Concretagens</span>
                            </div>
                            <button onClick={() => setShowAgendar(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: showAgendar ? 'rgba(255,255,255,0.06)' : 'rgba(212,168,67,0.12)', border: `1px solid ${showAgendar ? 'var(--border-subtle)' : 'rgba(212,168,67,0.3)'}`, color: showAgendar ? 'var(--text-muted)' : '#D4A843', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                {showAgendar ? <><X size={12} /> Cancelar</> : <><Plus size={12} /> Agendar</>}
                            </button>
                        </div>

                        {/* Scheduling form */}
                        {showAgendar && (
                            <div style={{ marginBottom: 14, padding: '18px', borderRadius: 14, background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.2)' }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Nova Concretagem Agendada</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label className="form-label">Data *</label>
                                            <input className="input" type="date" value={form.data_agendada} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(p => ({ ...p, data_agendada: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="form-label">FCK previsto (MPa)</label>
                                            <input className="input" type="number" placeholder="Ex: 30" value={form.fck_previsto} onChange={e => setForm(p => ({ ...p, fck_previsto: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label">Elemento a concretar</label>
                                        <input className="input" placeholder="Ex: Laje do 3º pavimento" value={form.elemento} onChange={e => setForm(p => ({ ...p, elemento: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="form-label">Volume estimado (m³)</label>
                                        <input className="input" type="number" step="0.1" placeholder="Ex: 45.5" value={form.volume_estimado} onChange={e => setForm(p => ({ ...p, volume_estimado: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="form-label">Observações</label>
                                        <textarea className="input" rows={2} placeholder="Notas adicionais..." value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
                                    </div>
                                    <button onClick={salvarAgendamento} disabled={salvando || !form.data_agendada} style={{ padding: '10px', borderRadius: 10, background: form.data_agendada ? 'linear-gradient(135deg, #D4A843, #c49130)' : 'rgba(212,168,67,0.3)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: form.data_agendada ? 'pointer' : 'not-allowed' }}>
                                        {salvando ? 'Agendando...' : '📅 Confirmar Agendamento'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {agendamentos.length === 0 ? (
                            <div style={{ padding: '14px 18px', borderRadius: 12, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
                                Nenhuma concretagem agendada. Use o botão acima para agendar.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {agendamentos.map(ag => (
                                    <div key={ag.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)' }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={16} style={{ color: '#D4A843' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtShort(ag.data_agendada)}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                                                {[ag.elemento, ag.fck_previsto ? `FCK ${ag.fck_previsto} MPa` : null, ag.volume_estimado ? `${ag.volume_estimado} m³` : null].filter(Boolean).join(' • ') || 'Concretagem agendada'}
                                            </div>
                                        </div>
                                        <button onClick={() => deletarAgendamento(ag.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }} title="Remover">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Histórico ── */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Histórico</span>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[1, 2, 3].map(i => <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
                        </div>
                    ) : itens.length === 0 ? (
                        <div style={{ padding: '60px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(74,144,217,0.2)', textAlign: 'center' }}>
                            <HardHat size={48} style={{ margin: '0 auto 14px', display: 'block', color: '#4A90D9', opacity: 0.4 }} />
                            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma concretagem registrada</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clique em "+ Nova" para registrar a primeira</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {itens.map(c => (
                                <Link key={c.id} href={`/concreto/${c.id}`} style={{ textDecoration: 'none' }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(74,144,217,0.15)', transition: 'all 0.15s', cursor: 'pointer' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.06)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.15)'; e.currentTarget.style.transform = 'none' }}
                                    >
                                        {/* Color circle w/ glow */}
                                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c.cor_hex || '#525F6B'}22`, border: `2px solid ${c.cor_hex || '#525F6B'}55`, boxShadow: `0 0 10px ${c.cor_hex || '#525F6B'}44` }}>
                                            <Droplets size={20} style={{ color: c.cor_hex || '#4A90D9' }} />
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                                                FCK {c.fck} MPa — {c.volume_m3} m³
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={9} /> {fmt(c.data_concretagem)}</span>
                                                {c.elementos_concretados?.length > 0 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.elementos_concretados.join(', ')}</span>}
                                                {c.fornecedor && <span>{c.fornecedor}</span>}
                                            </div>
                                        </div>

                                        <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
