'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClipboardList, Plus, ChevronRight, Cloud, Users, Pencil, Trash2, Settings } from 'lucide-react'

interface Rdo {
    id: string
    data: string
    clima?: string
    equipe_presente?: number
    obra_id?: string
    obras?: { nome: string } | { nome: string }[]
}

const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })

export default function RdoListPage() {
    const { obra, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()
    const router = useRouter()
    const [rdos, setRdos] = useState<Rdo[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmId, setConfirmId] = useState<string | null>(null)

    useEffect(() => {
        let query = supabase
            .from('rdos')
            .select('id, data, clima, equipe_presente, obra_id, obras(nome)')
            .order('data', { ascending: false })
            .limit(50)

        if (!isDirector && obra) query = query.eq('obra_id', obra.id)

        query.then(({ data }) => { setRdos(data || []); setLoading(false) })
    }, [obra?.id, isDirector])

    async function handleDelete(id: string) {
        setDeletingId(id)
        const { error: delErr } = await supabase.from('rdos').delete().eq('id', id)
        if (delErr) {
            alert(`Erro ao apagar: ${delErr.message}`)
            setDeletingId(null)
            setConfirmId(null)
            return
        }
        setRdos(p => p.filter(r => r.id !== id))
        setDeletingId(null)
        setConfirmId(null)
    }

    return (
        <div style={{ padding: '20px', maxWidth: 860 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(82,168,123,0.15)', border: '1px solid rgba(82,168,123,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={20} style={{ color: '#52A87B' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>RDO</h1>
                        {obra && !isDirector && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{obra.nome}</p>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link href="/rdo/equipe" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: 'rgba(82,168,123,0.1)', border: '1px solid rgba(82,168,123,0.25)', textDecoration: 'none', color: '#52A87B', fontSize: 12, fontWeight: 700 }}>
                        <Settings size={13} /> Equipe
                    </Link>
                    <Link href="/rdo/novo" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #52A87B, #3d8460)', textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(82,168,123,0.3)' }}>
                        <Plus size={15} /> Novo RDO
                    </Link>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 74, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
                </div>
            ) : rdos.length === 0 ? (
                <div style={{ padding: '60px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(82,168,123,0.2)', textAlign: 'center' }}>
                    <ClipboardList size={48} style={{ margin: '0 auto 14px', display: 'block', color: '#52A87B', opacity: 0.4 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhum RDO lançado</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clique em "+ Novo RDO" para registrar o primeiro</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rdos.map(rdo => (
                        <div key={rdo.id} style={{ position: 'relative' }}>
                            {/* Modal de confirmação de delete */}
                            {confirmId === rdo.id && (
                                <div style={{ position: 'absolute', inset: 0, zIndex: 10, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 20px', backdropFilter: 'blur(4px)' }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>Apagar este RDO?</span>
                                    <button
                                        onClick={() => handleDelete(rdo.id)}
                                        disabled={deletingId === rdo.id}
                                        style={{ padding: '6px 14px', borderRadius: 8, background: '#EF4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {deletingId === rdo.id ? '...' : 'Apagar'}
                                    </button>
                                    <button
                                        onClick={() => setConfirmId(null)}
                                        style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(82,168,123,0.15)', transition: 'all 0.15s' }}>
                                {/* Ícone */}
                                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(82,168,123,0.12)', border: '1px solid rgba(82,168,123,0.2)' }}>
                                    <ClipboardList size={20} style={{ color: '#52A87B' }} />
                                </div>

                                {/* Info — clicável */}
                                <Link href={`/rdo/${rdo.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, textTransform: 'capitalize' }}>
                                        {fmt(rdo.data)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                        {isDirector && (rdo.obras as any)?.nome && (
                                            <span style={{ fontWeight: 600, color: 'rgba(82,168,123,0.8)' }}>{(rdo.obras as any).nome}</span>
                                        )}
                                        {rdo.clima && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Cloud size={10} /> {rdo.clima}</span>}
                                        {rdo.equipe_presente != null && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={10} /> {rdo.equipe_presente} pessoas</span>}
                                    </div>
                                </Link>

                                {/* Ações */}
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <Link
                                        href={`/rdo/${rdo.id}/editar`}
                                        style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(82,168,123,0.25)', background: 'rgba(82,168,123,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#52A87B' }}
                                    >
                                        <Pencil size={13} />
                                    </Link>
                                    <button
                                        onClick={() => setConfirmId(confirmId === rdo.id ? null : rdo.id)}
                                        style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                    <Link href={`/rdo/${rdo.id}`} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text-muted)' }}>
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
