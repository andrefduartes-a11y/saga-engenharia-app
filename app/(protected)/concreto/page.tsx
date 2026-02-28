'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import {
    HardHat, Plus, ChevronRight, Layers, Calendar, Trash2,
    Droplets, ClipboardList, AlertCircle, CheckCircle, XCircle, Clock
} from 'lucide-react'

interface Concretagem {
    id: string
    data_concretagem: string
    fck: number
    volume_m3: number
    elementos_concretados: string[]
    obras?: { nome: string } | { nome: string }[]
}

interface Rastreabilidade {
    id: string
    data: string
    identificacao_pecas: string
    area_pavto?: string
    fck_projeto?: number
    quantidade_m3?: number
    cor_hex?: string
    conforme?: boolean | null
    rompimento_28a?: number
    rompimento_28b?: number
    obras?: { nome: string } | { nome: string }[]
}

interface Agendamento {
    id: string
    data_agendada: string
    elemento?: string
    volume_estimado?: number
    fck_previsto?: number
}

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtShort = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
const obraName = (o?: { nome: string } | { nome: string }[]) => Array.isArray(o) ? o[0]?.nome : o?.nome

export default function ConcretoPage() {
    const { obra, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [aba, setAba] = useState<'concretagens' | 'rastreabilidade'>('concretagens')
    const [concretagens, setConcretagens] = useState<Concretagem[]>([])
    const [rastreabilidades, setRastreabilidades] = useState<Rastreabilidade[]>([])
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]

        let qC = supabase.from('concretagens')
            .select('id, data_concretagem, fck, volume_m3, elementos_concretados, obras(nome)')
            .order('data_concretagem', { ascending: false }).limit(50)

        let qR = supabase.from('rastreabilidade_concreto')
            .select('id, data, identificacao_pecas, area_pavto, fck_projeto, quantidade_m3, cor_hex, conforme, rompimento_28a, rompimento_28b, obras(nome)')
            .order('data', { ascending: false }).limit(50)

        let qA = supabase.from('concretagens_agendadas')
            .select('id, data_agendada, elemento, volume_estimado, fck_previsto')
            .gte('data_agendada', today).order('data_agendada', { ascending: true })

        if (!isDirector && obra) {
            qC = qC.eq('obra_id', obra.id)
            qR = qR.eq('obra_id', obra.id)
            qA = qA.eq('obra_id', obra.id)
        }

        Promise.all([qC, qR, qA]).then(([{ data: c }, { data: r }, { data: a }]) => {
            setConcretagens(c || [])
            setRastreabilidades(r || [])
            setAgendamentos(a || [])
            setLoading(false)
        })
    }, [obra?.id, isDirector])

    async function deletarAgendamento(id: string) {
        await supabase.from('concretagens_agendadas').delete().eq('id', id)
        setAgendamentos(p => p.filter(a => a.id !== id))
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
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link href="/concreto/novo" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: aba === 'concretagens' ? 'linear-gradient(135deg,#4A90D9,#3a72b0)' : 'rgba(255,255,255,0.06)', border: `1px solid ${aba === 'concretagens' ? 'transparent' : 'var(--border-subtle)'}`, textDecoration: 'none', color: aba === 'concretagens' ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', boxShadow: aba === 'concretagens' ? '0 4px 12px rgba(74,144,217,0.3)' : 'none' }}>
                        <Plus size={13} /> Concretagem
                    </Link>
                    <Link href="/concreto/rastreabilidade/novo" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: aba === 'rastreabilidade' ? 'linear-gradient(135deg,#D4A843,#c49130)' : 'rgba(255,255,255,0.06)', border: `1px solid ${aba === 'rastreabilidade' ? 'transparent' : 'var(--border-subtle)'}`, textDecoration: 'none', color: aba === 'rastreabilidade' ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, transition: 'all 0.2s', boxShadow: aba === 'rastreabilidade' ? '0 4px 12px rgba(212,168,67,0.3)' : 'none' }}>
                        <Plus size={13} /> Rastreabilidade
                    </Link>
                </div>
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

            {/* ── Próximas Concretagens ── */}
            {agendamentos.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Calendar size={12} style={{ color: '#D4A843' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Próximas Programadas</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {agendamentos.map(ag => (
                            <div key={ag.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)' }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={14} style={{ color: '#D4A843' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtShort(ag.data_agendada)}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {[ag.elemento, ag.fck_previsto ? `FCK ${ag.fck_previsto} MPa` : null, ag.volume_estimado ? `${ag.volume_estimado} m³` : null].filter(Boolean).join(' • ') || 'Agendada'}
                                    </div>
                                </div>
                                <button onClick={() => deletarAgendamento(ag.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 12, marginBottom: 16, border: '1px solid var(--border-subtle)' }}>
                {([['concretagens', 'Concretagens', '#4A90D9'], ['rastreabilidade', 'Rastreabilidade', '#D4A843']] as const).map(([v, label, color]) => (
                    <button key={v} onClick={() => setAba(v)} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, transition: 'all 0.15s', background: aba === v ? (v === 'concretagens' ? 'rgba(74,144,217,0.15)' : 'rgba(212,168,67,0.15)') : 'transparent', color: aba === v ? color : 'var(--text-muted)' }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
                </div>
            ) : aba === 'concretagens' ? (
                concretagens.length === 0 ? (
                    <div style={{ padding: '52px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(74,144,217,0.2)', textAlign: 'center' }}>
                        <HardHat size={44} style={{ margin: '0 auto 12px', display: 'block', color: '#4A90D9', opacity: 0.35 }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma concretagem marcada</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clique em "+ Concretagem" para registrar</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {concretagens.map(c => (
                            <Link key={c.id} href={`/concreto/${c.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(74,144,217,0.15)', transition: 'all 0.15s', cursor: 'pointer' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.06)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.15)'; e.currentTarget.style.transform = 'none' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(74,144,217,0.12)', border: '1px solid rgba(74,144,217,0.25)' }}>
                                        <Droplets size={18} style={{ color: '#4A90D9' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>FCK {c.fck} MPa — {c.volume_m3} m³</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={9} />{fmt(c.data_concretagem)}</span>
                                            {isDirector && obraName(c.obras) && <span style={{ color: '#4A90D9', fontWeight: 600 }}>{obraName(c.obras)}</span>}
                                            {c.elementos_concretados?.length > 0 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.elementos_concretados.join(', ')}</span>}
                                        </div>
                                    </div>
                                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )
            ) : (
                /* Rastreabilidade tab */
                rastreabilidades.length === 0 ? (
                    <div style={{ padding: '52px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(212,168,67,0.2)', textAlign: 'center' }}>
                        <ClipboardList size={44} style={{ margin: '0 auto 12px', display: 'block', color: '#D4A843', opacity: 0.35 }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma rastreabilidade registrada</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clique em "+ Rastreabilidade" para criar a primeira ficha</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {rastreabilidades.map(r => {
                            const pendingRomp = r.rompimento_28a == null
                            const conforme = r.conforme
                            return (
                                <Link key={r.id} href={`/concreto/rastreabilidade/${r.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${pendingRomp ? 'rgba(245,158,11,0.2)' : conforme === false ? 'rgba(239,68,68,0.2)' : 'rgba(212,168,67,0.15)'}`, transition: 'all 0.15s', cursor: 'pointer' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.transform = 'none' }}>
                                        {/* Color dot */}
                                        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${r.cor_hex || '#4A90D9'}22`, border: `2px solid ${r.cor_hex || '#4A90D9'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 8px ${r.cor_hex || '#4A90D9'}33` }}>
                                            <ClipboardList size={16} style={{ color: r.cor_hex || '#D4A843' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {r.identificacao_pecas}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={9} />{fmt(r.data)}</span>
                                                {r.fck_projeto && <span>FCK {r.fck_projeto} MPa</span>}
                                                {r.quantidade_m3 && <span>{r.quantidade_m3} m³</span>}
                                                {r.area_pavto && <span>{r.area_pavto}</span>}
                                                {isDirector && obraName(r.obras) && <span style={{ color: '#D4A843', fontWeight: 600 }}>{obraName(r.obras)}</span>}
                                            </div>
                                        </div>
                                        {/* Status */}
                                        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                            {pendingRomp ? (
                                                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap' }}>
                                                    ⏳ Rompimentos
                                                </span>
                                            ) : conforme === true ? (
                                                <CheckCircle size={18} style={{ color: '#10B981' }} />
                                            ) : conforme === false ? (
                                                <XCircle size={18} style={{ color: '#EF4444' }} />
                                            ) : (
                                                <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                                            )}
                                        </div>
                                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )
            )}
        </div>
    )
}
