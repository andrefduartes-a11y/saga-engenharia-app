'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import {
    HardHat, Plus, ChevronRight, Layers, Calendar, Trash2, Pencil,
    ClipboardList, CheckCircle, XCircle, Clock, Lock, X, Loader2, ChevronDown
} from 'lucide-react'

interface Agendamento {
    id: string
    obra_id: string
    data_agendada: string
    elemento?: string
    volume_estimado?: number
    fck_previsto?: number
    observacoes?: string
    status?: string
    obras?: { nome: string } | { nome: string }[]
}

interface Rastreabilidade {
    id: string
    data: string
    identificacao_pecas: string
    agendamento_id?: string | null
    cor_hex?: string
    conforme?: boolean | null
    rompimento_28a?: number
    rompimento_28b?: number
    fck_projeto?: number
    quantidade_m3?: number
    obras?: { nome: string } | { nome: string }[]
}

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtShort = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
const obraName = (o?: { nome: string } | { nome: string }[]) => Array.isArray(o) ? o[0]?.nome : o?.nome

// ── Modal de edição de agendamento ────────────────────────────────────────────
function EditModal({ ag, onClose, onSave }: { ag: Agendamento; onClose: () => void; onSave: (updated: Agendamento) => void }) {
    const supabase = createClient()
    const [form, setForm] = useState({
        data_agendada: ag.data_agendada,
        elemento: ag.elemento || '',
        volume_estimado: ag.volume_estimado?.toString() || '',
        fck_previsto: ag.fck_previsto?.toString() || '',
        observacoes: ag.observacoes || '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

    async function handleSave() {
        setSaving(true)
        const { data, error: err } = await supabase
            .from('concretagens_agendadas')
            .update({
                data_agendada: form.data_agendada,
                elemento: form.elemento || null,
                volume_estimado: form.volume_estimado ? parseFloat(form.volume_estimado) : null,
                fck_previsto: form.fck_previsto ? parseInt(form.fck_previsto) : null,
                observacoes: form.observacoes || null,
            })
            .eq('id', ag.id)
            .select('*, obras(nome)')
            .single()
        if (err) { setError(err.message); setSaving(false); return }
        onSave(data as Agendamento)
        onClose()
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, maxWidth: 440, width: '100%', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>✏️ Editar Concretagem</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <label className="form-label">Data *</label>
                        <input className="input" type="date" value={form.data_agendada} onChange={e => set('data_agendada', e.target.value)} required />
                    </div>
                    <div>
                        <label className="form-label">Elemento / Estrutura</label>
                        <input className="input" placeholder="Ex: Laje 2º Pavimento" value={form.elemento} onChange={e => set('elemento', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                        <textarea className="input" rows={2} placeholder="Anotações..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
                    </div>
                    {error && <p style={{ fontSize: 12, color: '#EF4444' }}>{error}</p>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#4A90D9,#3a72b0)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : '💾 Salvar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function ConcretoPage() {
    const { obra, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [aba, setAba] = useState<'concretagens' | 'rastreabilidade'>('concretagens')
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [rastreabilidades, setRastreabilidades] = useState<Rastreabilidade[]>([])
    const [loading, setLoading] = useState(true)
    const [editando, setEditando] = useState<Agendamento | null>(null)
    const [deletando, setDeletando] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)

        let qA = supabase.from('concretagens_agendadas')
            .select('id, obra_id, data_agendada, elemento, volume_estimado, fck_previsto, observacoes, status, obras(nome)')
            .order('data_agendada', { ascending: false }).limit(80)

        let qR = supabase.from('rastreabilidade_concreto')
            .select('id, data, identificacao_pecas, agendamento_id, cor_hex, conforme, rompimento_28a, rompimento_28b, fck_projeto, quantidade_m3, obras(nome)')
            .order('data', { ascending: false }).limit(80)

        if (!isDirector && obra) {
            qA = qA.eq('obra_id', obra.id)
            qR = qR.eq('obra_id', obra.id)
        }

        Promise.all([qA, qR]).then(([{ data: a }, { data: r }]) => {
            setAgendamentos(a as Agendamento[] || [])
            setRastreabilidades(r as Rastreabilidade[] || [])
            setLoading(false)
        })
    }, [obra?.id, isDirector])

    async function deletarAgendamento(id: string) {
        setDeletando(id)
        await supabase.from('concretagens_agendadas').delete().eq('id', id)
        setAgendamentos(p => p.filter(a => a.id !== id))
        setDeletando(null)
    }

    return (
        <div style={{ padding: '20px', maxWidth: 860 }}>

            {/* ── Header ── */}
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
                {/* Só o botão de agendar nova concretagem */}
                <Link href="/concreto/novo" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#4A90D9,#3a72b0)', textDecoration: 'none', color: '#fff', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 12px rgba(74,144,217,0.3)' }}>
                    <Plus size={13} /> Concretagem
                </Link>
            </div>

            {/* ── Banco de Traços shortcut ── */}
            <Link href="/tracos" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(74,144,217,0.04)', border: '1px solid rgba(74,144,217,0.15)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.08)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.04)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.15)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74,144,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Layers size={16} style={{ color: '#4A90D9' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Banco de Traços</div>
                        <div style={{ fontSize: 11, color: '#4A90D9' }}>Calculadora e traços cadastrados</div>
                    </div>
                    <ChevronRight size={14} style={{ color: '#4A90D9' }} />
                </div>
            </Link>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 16, border: '1px solid var(--border-subtle)' }}>
                {([['concretagens', 'Concretagens', '#4A90D9'], ['rastreabilidade', 'Rastreabilidade', '#D4A843']] as const).map(([v, label, color]) => (
                    <button key={v} onClick={() => setAba(v)} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, transition: 'all 0.15s', background: aba === v ? (v === 'concretagens' ? 'rgba(74,144,217,0.15)' : 'rgba(212,168,67,0.15)') : 'transparent', color: aba === v ? color : 'var(--text-muted)' }}>
                        {label} {v === 'concretagens' ? `(${agendamentos.length})` : `(${rastreabilidades.length})`}
                    </button>
                ))}
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
                </div>
            ) : aba === 'concretagens' ? (
                /* ── ABA CONCRETAGENS = Lista de Agendamentos ── */
                agendamentos.length === 0 ? (
                    <div style={{ padding: '52px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(74,144,217,0.2)', textAlign: 'center' }}>
                        <HardHat size={44} style={{ margin: '0 auto 12px', display: 'block', color: '#4A90D9', opacity: 0.35 }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma concretagem agendada</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clique em "＋ Concretagem" para agendar</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {agendamentos.map(ag => {
                            const realizada = ag.status === 'realizada'
                            const today = new Date().toISOString().split('T')[0]
                            const isFutura = ag.data_agendada > today
                            const isHoje = ag.data_agendada === today
                            const statusColor = realizada ? '#10B981' : isHoje ? '#EF4444' : isFutura ? '#D4A843' : '#6B7280'
                            const statusLabel = realizada ? '✅ Realizada' : isHoje ? '🔴 Hoje' : isFutura ? '📅 Agendada' : '⚫ Passada'

                            return (
                                <div key={ag.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${realizada ? 'rgba(16,185,129,0.2)' : isHoje ? 'rgba(239,68,68,0.25)' : 'rgba(212,168,67,0.2)'}`, transition: 'all 0.15s' }}>
                                    {/* Indicador de status lateral */}
                                    <div style={{ width: 4, height: 44, borderRadius: 2, background: statusColor, flexShrink: 0 }} />

                                    {/* Clicável: vai para o detalhe do agendamento */}
                                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => window.location.href = `/concreto/agendamento/${ag.id}`}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                            {ag.elemento || 'Concretagem'}
                                            {isDirector && obraName(ag.obras) && (
                                                <span style={{ fontSize: 10, fontWeight: 600, color: '#4A90D9', marginLeft: 8 }}>{obraName(ag.obras)}</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={9} />{fmt(ag.data_agendada)}</span>
                                            {ag.fck_previsto && <span>FCK {ag.fck_previsto} MPa</span>}
                                            {ag.volume_estimado && <span>{ag.volume_estimado} m³ prev.</span>}
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}33`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {statusLabel}
                                    </span>

                                    {/* Ações: editar e apagar (apenas se não realizada ou diretor) */}
                                    {(!realizada || isDirector) && (
                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                            <button
                                                onClick={() => setEditando(ag)}
                                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'rgba(74,144,217,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A90D9', transition: 'all 0.15s' }}
                                                title="Editar"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Apagar este agendamento e todas as rastreabilidades vinculadas?')) {
                                                        deletarAgendamento(ag.id)
                                                    }
                                                }}
                                                disabled={deletando === ag.id}
                                                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', transition: 'all 0.15s' }}
                                                title="Apagar"
                                            >
                                                {deletando === ag.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                            </button>
                                        </div>
                                    )}

                                    {/* Se realizada: ícone de cadeado */}
                                    {realizada && !isDirector && (
                                        <Lock size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                                    )}

                                    <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'pointer' }} onClick={() => window.location.href = `/concreto/agendamento/${ag.id}`} />
                                </div>
                            )
                        })}
                    </div>
                )
            ) : (
                /* ── ABA RASTREABILIDADE = Apenas visualização ── */
                rastreabilidades.length === 0 ? (
                    <div style={{ padding: '52px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(212,168,67,0.2)', textAlign: 'center' }}>
                        <ClipboardList size={44} style={{ margin: '0 auto 12px', display: 'block', color: '#D4A843', opacity: 0.35 }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma rastreabilidade registrada</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Para lançar rastreabilidade, acesse uma concretagem agendada</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {rastreabilidades.map(r => {
                            const pendingRomp = r.rompimento_28a == null && r.rompimento_28b == null
                            const conforme = r.conforme
                            return (
                                <Link key={r.id} href={`/concreto/rastreabilidade/${r.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${pendingRomp ? 'rgba(245,158,11,0.2)' : conforme === false ? 'rgba(239,68,68,0.2)' : 'rgba(212,168,67,0.15)'}`, transition: 'all 0.15s', cursor: 'pointer' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.transform = 'none' }}>
                                        {/* Barra de cor lateral */}
                                        <div style={{ width: 4, height: 44, borderRadius: 2, background: r.cor_hex || '#D4A843', flexShrink: 0, boxShadow: `0 0 8px ${r.cor_hex || '#D4A843'}66` }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {r.identificacao_pecas}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={9} />{fmt(r.data)}</span>
                                                {r.fck_projeto && <span>FCK {r.fck_projeto} MPa</span>}
                                                {r.quantidade_m3 && <span>{r.quantidade_m3} m³</span>}
                                                {isDirector && obraName(r.obras) && <span style={{ color: '#D4A843', fontWeight: 600 }}>{obraName(r.obras)}</span>}
                                            </div>
                                        </div>
                                        <div style={{ flexShrink: 0 }}>
                                            {pendingRomp
                                                ? <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap' }}>⏳ Rompimentos</span>
                                                : conforme === true ? <CheckCircle size={16} style={{ color: '#10B981' }} />
                                                    : conforme === false ? <XCircle size={16} style={{ color: '#EF4444' }} />
                                                        : <Clock size={15} style={{ color: 'var(--text-muted)' }} />}
                                        </div>
                                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )
            )}

            {/* ── Modal de edição ── */}
            {editando && (
                <EditModal
                    ag={editando}
                    onClose={() => setEditando(null)}
                    onSave={(updated) => {
                        setAgendamentos(p => p.map(a => a.id === updated.id ? updated : a))
                        setEditando(null)
                    }}
                />
            )}
        </div>
    )
}
