'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import { CheckSquare, Plus, ChevronRight, Building2, ChevronDown, AlertCircle, ClipboardCheck } from 'lucide-react'

interface FVS {
    id: string
    data: string
    servico_inspecionado?: string
    elemento?: string
    status: string
    responsavel?: string
    its?: { codigo: string; nome?: string; titulo?: string } | { codigo: string; nome?: string; titulo?: string }[]
    obras?: { nome: string } | { nome: string }[]
}

interface ObraSimples { id: string; nome: string }

const STATUS_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
    aprovado: { bg: 'rgba(16,185,129,0.12)', text: '#10B981', border: 'rgba(16,185,129,0.3)', label: '✅ Aprovado' },
    reprovado: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', border: 'rgba(239,68,68,0.3)', label: '❌ Reprovado' },
    em_andamento: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)', label: '🔄 Em andamento' },
}
const statusStyle = (s: string) => STATUS_MAP[s] || STATUS_MAP.em_andamento

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const obraName = (o?: FVS['obras']) => Array.isArray(o) ? o[0]?.nome : o?.nome
const itCode = (it?: FVS['its']) => Array.isArray(it) ? it[0]?.codigo : it?.codigo

export default function FVSPage() {
    const { obra, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [allObras, setAllObras] = useState<ObraSimples[]>([])
    const [selectedObraId, setSelectedObraId] = useState('')
    const [itens, setItens] = useState<FVS[]>([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('')

    useEffect(() => {
        if (!isDirector) return
        supabase.from('obras').select('id, nome').order('nome').then(({ data }) => setAllObras(data || []))
    }, [isDirector])

    useEffect(() => {
        setLoading(true)
        let q = supabase
            .from('fvs')
            .select('id, data, servico_inspecionado, elemento, status, responsavel, its(codigo, titulo), obras(nome)')
            .order('data', { ascending: false })
            .limit(50)

        if (filtro) q = q.eq('status', filtro)

        if (!isDirector && obra) {
            q = q.eq('obra_id', obra.id)
        } else if (isDirector && selectedObraId) {
            q = q.eq('obra_id', selectedObraId)
        }

        q.then(({ data }) => { setItens(data as any || []); setLoading(false) })
    }, [obra?.id, isDirector, selectedObraId, filtro])

    return (
        <div style={{ padding: '20px', maxWidth: 860 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardCheck size={20} style={{ color: '#10B981' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>FVS</h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Fichas de Verificação de Serviço</p>
                    </div>
                </div>
                <Link
                    href="/inspecoes/nova"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #10B981, #059669)', textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                >
                    <Plus size={15} /> Nova FVS
                </Link>
            </div>

            {/* ── Director obra filter ── */}
            {isDirector && (
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                        <Building2 size={11} /> Obra
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} className="input" style={{ appearance: 'none', paddingRight: 40 }}>
                            <option value="">Todas as obras</option>
                            {allObras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                </div>
            )}

            {/* ── Status filter pills ── */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {[['', 'Todas'], ['aprovado', 'Aprovadas'], ['reprovado', 'Reprovadas'], ['em_andamento', 'Em andamento']].map(([v, l]) => {
                    const active = filtro === v
                    return (
                        <button key={v} onClick={() => setFiltro(v)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#10B981' : 'var(--text-muted)', borderColor: active ? 'rgba(16,185,129,0.4)' : 'var(--border-subtle)' }}>
                            {l}
                        </button>
                    )
                })}
            </div>

            {/* ── No obra state (engineers without obra) ── */}
            {!obra && !isDirector ? (
                <div style={{ padding: '52px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <AlertCircle size={40} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-muted)', opacity: 0.4 }} />
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma obra vinculada</p>
                </div>
            ) : loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 76, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
                </div>
            ) : itens.length === 0 ? (
                <div style={{ padding: '60px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(16,185,129,0.2)', textAlign: 'center' }}>
                    <CheckSquare size={48} style={{ margin: '0 auto 14px', display: 'block', color: '#10B981', opacity: 0.4 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma FVS registrada</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clique em "+ Nova FVS" para registrar a primeira inspeção</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {itens.map(fvs => {
                        const s = statusStyle(fvs.status)
                        const code = itCode(fvs.its)
                        return (
                            <Link key={fvs.id} href={`/inspecoes/${fvs.id}`} style={{ textDecoration: 'none' }}>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(16,185,129,0.15)', transition: 'all 0.15s', cursor: 'pointer' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.05)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.15)'; e.currentTarget.style.transform = 'none' }}
                                >
                                    {/* IT code badge */}
                                    <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: s.bg, border: `1px solid ${s.border}` }}>
                                        {code ? (
                                            <span style={{ fontSize: 8, fontWeight: 800, color: s.text, textAlign: 'center', lineHeight: 1.2 }}>{code}</span>
                                        ) : (
                                            <ClipboardCheck size={18} style={{ color: s.text }} />
                                        )}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {fvs.servico_inspecionado || fvs.elemento || 'FVS sem título'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            <span>{fmt(fvs.data)}</span>
                                            {isDirector && obraName(fvs.obras) && <span style={{ color: '#10B981', fontWeight: 600 }}>{obraName(fvs.obras)}</span>}
                                            {fvs.responsavel && <span>{fvs.responsavel}</span>}
                                        </div>
                                    </div>

                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap', background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                                        {s.label}
                                    </span>
                                    <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
