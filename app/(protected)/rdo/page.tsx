'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import {
    ClipboardList, Plus, ChevronRight, Cloud, Users, Calendar,
    Building2, ChevronDown, AlertCircle
} from 'lucide-react'

interface Rdo {
    id: string
    data: string
    clima?: string
    equipe_presente?: number
    obra_id?: string
    obras?: { nome: string }
}

interface ObraSimples { id: string; nome: string; cidade?: string }

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })

export default function RdoListPage() {
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [allObras, setAllObras] = useState<ObraSimples[]>([])
    const [selectedObraId, setSelectedObraId] = useState('')
    const obra = isDirector ? (allObras.find(o => o.id === selectedObraId) || null) : obraCtx

    const [rdos, setRdos] = useState<Rdo[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isDirector) return
        supabase.from('obras').select('id, nome, cidade').order('nome')
            .then(({ data }) => setAllObras(data || []))
    }, [isDirector])

    useEffect(() => {
        if (!obra) { setRdos([]); return }
        setLoading(true)
        supabase.from('rdos')
            .select('id, data, clima, equipe_presente, obra_id')
            .eq('obra_id', obra.id)
            .order('data', { ascending: false })
            .limit(50)
            .then(({ data }) => { setRdos(data || []); setLoading(false) })
    }, [obra?.id])

    return (
        <div style={{ padding: '20px', maxWidth: 860 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(82,168,123,0.15)', border: '1px solid rgba(82,168,123,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={20} style={{ color: '#52A87B' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>RDO</h1>
                        {obra && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{obra.nome}</p>}
                    </div>
                </div>
                <Link
                    href="/rdo/novo"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px', borderRadius: 10,
                        background: obra ? 'linear-gradient(135deg, #52A87B, #3d8460)' : 'rgba(255,255,255,0.06)',
                        textDecoration: 'none', color: obra ? '#fff' : 'var(--text-muted)',
                        fontSize: 13, fontWeight: 700,
                        boxShadow: obra ? '0 4px 14px rgba(82,168,123,0.3)' : 'none',
                        pointerEvents: obra ? 'auto' : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    <Plus size={15} /> Novo RDO
                </Link>
            </div>

            {/* Director obra selector */}
            {isDirector && (
                <div style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Building2 size={11} /> OBRA
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedObraId}
                            onChange={e => setSelectedObraId(e.target.value)}
                            className="input"
                            style={{ appearance: 'none', paddingRight: 40 }}
                        >
                            <option value="">Selecione uma obra...</option>
                            {allObras.map(o => (
                                <option key={o.id} value={o.id}>{o.nome}{o.cidade ? ` — ${o.cidade}` : ''}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                </div>
            )}

            {/* Content */}
            {!obra ? (
                <div style={{ padding: '52px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <AlertCircle size={40} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-muted)', opacity: 0.4 }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{isDirector ? 'Selecione uma obra acima' : 'Nenhuma obra vinculada'}</p>
                </div>
            ) : loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 74, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />)}
                </div>
            ) : rdos.length === 0 ? (
                <div style={{ padding: '60px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(82,168,123,0.2)', textAlign: 'center' }}>
                    <ClipboardList size={48} style={{ margin: '0 auto 14px', display: 'block', color: '#52A87B', opacity: 0.4 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhum RDO lançado</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Registre o primeiro diário de obra</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rdos.map(rdo => (
                        <Link key={rdo.id} href={`/rdo/${rdo.id}`} style={{ textDecoration: 'none' }}>
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '14px 18px', borderRadius: 14,
                                    background: 'rgba(255,255,255,0.025)',
                                    border: '1px solid rgba(82,168,123,0.15)',
                                    transition: 'all 0.15s', cursor: 'pointer',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(82,168,123,0.06)'
                                    e.currentTarget.style.borderColor = 'rgba(82,168,123,0.35)'
                                    e.currentTarget.style.transform = 'translateY(-1px)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                                    e.currentTarget.style.borderColor = 'rgba(82,168,123,0.15)'
                                    e.currentTarget.style.transform = 'none'
                                }}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(82,168,123,0.12)', border: '1px solid rgba(82,168,123,0.2)' }}>
                                    <ClipboardList size={20} style={{ color: '#52A87B' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, textTransform: 'capitalize' }}>
                                        {fmt(rdo.data)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                                        {rdo.clima && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Cloud size={10} /> {rdo.clima}</span>}
                                        {rdo.equipe_presente && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={10} /> {rdo.equipe_presente} pessoas</span>}
                                    </div>
                                </div>
                                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
