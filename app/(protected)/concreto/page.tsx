'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import {
    HardHat, Plus, ChevronRight, Layers, Calendar, Trash2, Droplets
} from 'lucide-react'

interface Concretagem {
    id: string
    data_concretagem: string
    fck: number
    volume_m3: number
    elementos_concretados: string[]
    fornecedor?: string
    cor_hex?: string
    obras?: { nome: string } | { nome: string }[]
}

interface Agendamento {
    id: string
    data_agendada: string
    elemento?: string
    volume_estimado?: number
    fck_previsto?: number
    obras?: { nome: string } | { nome: string }[]
}

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtShort = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
const obraName = (o?: { nome: string } | { nome: string }[]) => Array.isArray(o) ? o[0]?.nome : o?.nome

export default function ConcretoPage() {
    const { obra, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [itens, setItens] = useState<Concretagem[]>([])
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0]

        let qItens = supabase
            .from('concretagens')
            .select('id, data_concretagem, fck, volume_m3, elementos_concretados, fornecedor, cor_hex, obras(nome)')
            .order('data_concretagem', { ascending: false })
            .limit(50)

        let qAgend = supabase
            .from('concretagens_agendadas')
            .select('id, data_agendada, elemento, volume_estimado, fck_previsto, obras(nome)')
            .gte('data_agendada', today)
            .order('data_agendada', { ascending: true })

        if (!isDirector && obra) {
            qItens = qItens.eq('obra_id', obra.id)
            qAgend = qAgend.eq('obra_id', obra.id)
        }

        Promise.all([qItens, qAgend]).then(([{ data: c }, { data: a }]) => {
            setItens(c || [])
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
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
                    href="/concreto/novo"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #4A90D9, #3a72b0)',
                        textDecoration: 'none', color: '#fff',
                        fontSize: 13, fontWeight: 700,
                        boxShadow: '0 4px 14px rgba(74,144,217,0.3)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                >
                    <Plus size={15} /> Nova
                </Link>
            </div>

            {/* ── Banco de Traços shortcut ── */}
            <Link href="/tracos" style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: 'rgba(74,144,217,0.04)', border: '1px solid rgba(74,144,217,0.2)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.08)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.04)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.2)' }}
                >
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

            {/* ── Próximas Concretagens (always visible) ── */}
            {agendamentos.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Calendar size={13} style={{ color: '#D4A843' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Próximas Concretagens</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {agendamentos.map(ag => (
                            <div key={ag.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={15} style={{ color: '#D4A843' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtShort(ag.data_agendada)}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {isDirector && obraName(ag.obras) && <span style={{ color: '#4A90D9', marginRight: 6 }}>{obraName(ag.obras)}</span>}
                                        {[ag.elemento, ag.fck_previsto ? `FCK ${ag.fck_previsto} MPa` : null, ag.volume_estimado ? `${ag.volume_estimado} m³` : null].filter(Boolean).join(' • ') || 'Concretagem agendada'}
                                    </div>
                                </div>
                                <button onClick={() => deletarAgendamento(ag.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Histórico ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Histórico</span>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 76, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
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
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(74,144,217,0.15)', transition: 'all 0.15s', cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,144,217,0.06)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.15)'; e.currentTarget.style.transform = 'none' }}
                            >
                                {/* Color glow icon */}
                                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${c.cor_hex || '#525F6B'}22`, border: `2px solid ${c.cor_hex || '#525F6B'}55`, boxShadow: `0 0 10px ${c.cor_hex || '#525F6B'}44` }}>
                                    <Droplets size={18} style={{ color: c.cor_hex || '#4A90D9' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                        FCK {c.fck} MPa — {c.volume_m3} m³
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={9} /> {fmt(c.data_concretagem)}</span>
                                        {isDirector && obraName(c.obras) && <span style={{ color: '#4A90D9', fontWeight: 600 }}>{obraName(c.obras)}</span>}
                                        {c.elementos_concretados?.length > 0 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.elementos_concretados.join(', ')}</span>}
                                        {c.fornecedor && <span>{c.fornecedor}</span>}
                                    </div>
                                </div>
                                <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
