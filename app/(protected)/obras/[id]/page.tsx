'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import {
    ArrowLeft, Building2, ClipboardList, HardHat,
    Calendar, ChevronRight, Pencil, Trash2, Save, X, Loader2, AlertTriangle,
} from 'lucide-react'

interface Obra {
    id: string
    nome: string
    status: string
    spe_id?: string
    cidade?: string
    endereco?: string
    responsavel_tecnico?: string
    descricao?: string
    data_inicio?: string
    data_previsao_fim?: string
}

export default function ObraDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const supabase = createClient()
    const { role } = useObra()
    const canEdit = role === 'diretor' || role === 'admin'
    const [obra, setObra] = useState<Obra | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [form, setForm] = useState<Partial<Obra>>({})
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')


    useEffect(() => {
        supabase.from('obras').select('*').eq('id', params.id).single()
            .then(({ data, error }) => {
                if (error || !data) { router.push('/obras'); return }
                setObra(data)
                setForm(data)
                setLoading(false)
            })
    }, [params.id])

    async function handleSave() {
        if (!form.nome?.trim()) return
        setSaving(true); setError('')
        const { error } = await supabase.from('obras').update({
            nome: form.nome,
            status: form.status,
            cidade: form.cidade || null,
            endereco: form.endereco || null,
            responsavel_tecnico: form.responsavel_tecnico || null,
            spe_id: form.spe_id || null,
            descricao: form.descricao || null,
            data_inicio: form.data_inicio || null,
            data_previsao_fim: form.data_previsao_fim || null,
        }).eq('id', params.id)
        if (error) { setError('Erro ao salvar.'); setSaving(false); return }
        setObra({ ...obra!, ...form as Obra })
        setEditing(false)
        setSuccess('Obra atualizada!')
        setTimeout(() => setSuccess(''), 3000)
        setSaving(false)
    }

    async function handleDelete() {
        setDeleting(true)
        await supabase.from('obras').delete().eq('id', params.id)
        router.push('/obras')
        router.refresh()
    }

    if (loading) {
        return (
            <div className="px-4 py-4 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="card animate-pulse" style={{ height: 80 }} />)}
            </div>
        )
    }

    if (!obra) return null

    const statusColor: Record<string, string> = { ativa: 'badge-green', pausada: 'badge-warning', concluida: 'badge-info' }

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up" style={{ maxWidth: 720 }}>
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/obras" className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{obra.nome}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={statusColor[obra.status] || 'badge'}>{obra.status}</span>
                        {obra.cidade && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📍 {obra.cidade}</span>}
                    </div>
                </div>
                {/* Action buttons — directors only */}
                {canEdit && (
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => { setEditing(v => !v); setError(''); setForm(obra) }}
                            className="btn-secondary"
                            style={{ minHeight: 38, padding: '7px 14px', borderRadius: 10, fontSize: 13, gap: 6 }}>
                            {editing ? <><X size={14} /> Cancelar</> : <><Pencil size={14} /> Editar</>}
                        </button>
                        <button onClick={() => setConfirmDelete(true)}
                            className="btn-secondary"
                            style={{ minHeight: 38, padding: '7px 12px', borderRadius: 10, color: 'var(--danger)', borderColor: 'rgba(217,82,82,0.3)', background: 'rgba(217,82,82,0.08)' }}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Alerts */}
            {success && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(127,166,83,0.12)', border: '1px solid rgba(127,166,83,0.3)', color: '#7FA653', fontSize: 13, fontWeight: 600 }}>
                    ✓ {success}
                </div>
            )}
            {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 13, fontWeight: 600 }}>
                    ✕ {error}
                </div>
            )}

            {/* Delete confirm modal */}
            {confirmDelete && (
                <div style={{
                    padding: '20px', borderRadius: 14, background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.3)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                        <AlertTriangle size={20} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                Tem certeza que quer apagar esta obra?
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Todos os dados vinculados (RDOs, concretagens, FVS...) serão apagados permanentemente.
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#EF4444', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            {deleting ? 'Apagando...' : 'Sim, apagar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Edit form */}
            {editing ? (
                <div className="card" style={{ padding: '20px' }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Editar Obra</h2>
                    <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                            <label className="label">Nome da Obra *</label>
                            <input className="input" value={form.nome || ''} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label className="label">Cidade</label>
                                <input className="input" value={form.cidade || ''} placeholder="Ex: Belo Horizonte"
                                    onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} />
                            </div>
                            <div>
                                <label className="label">Bairro / Endereço</label>
                                <input className="input" value={form.endereco || ''} placeholder="Ex: Savassi"
                                    onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className="label">Responsável Técnico</label>
                            <input className="input" value={form.responsavel_tecnico || ''} placeholder="Ex: João Silva - CREA 12345"
                                onChange={e => setForm(p => ({ ...p, responsavel_tecnico: e.target.value }))} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label className="label">Status</label>
                                <select className="input" value={form.status || 'ativa'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                    <option value="ativa">Ativa</option>
                                    <option value="pausada">Pausada</option>
                                    <option value="concluida">Concluída</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">SPE / ID</label>
                                <input className="input" value={form.spe_id || ''} onChange={e => setForm(p => ({ ...p, spe_id: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label className="label">Data de início</label>
                                <input className="input" type="date" value={form.data_inicio || ''}
                                    onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
                            </div>
                            <div>
                                <label className="label">Previsão de fim</label>
                                <input className="input" type="date" value={form.data_previsao_fim || ''}
                                    onChange={e => setForm(p => ({ ...p, data_previsao_fim: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className="label">Descrição</label>
                            <textarea className="input" rows={2} value={form.descricao || ''} placeholder="Observações sobre a obra..."
                                onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                        </div>
                        <button onClick={handleSave} disabled={saving || !form.nome?.trim()} className="btn-primary" style={{ marginTop: 4 }}>
                            {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><Save size={14} /> Salvar alterações</>}
                        </button>
                    </div>
                </div>
            ) : (
                /* View mode — info cards */
                <>
                    {(obra.data_inicio || obra.data_previsao_fim || obra.responsavel_tecnico || obra.descricao) && (
                        <div className="card" style={{ display: 'grid', gap: 10 }}>
                            {obra.responsavel_tecnico && (
                                <div>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Responsável Técnico</p>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{obra.responsavel_tecnico}</p>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {obra.data_inicio && (
                                    <div>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Início</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Calendar size={12} /> {new Date(obra.data_inicio + 'T12:00').toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                )}
                                {obra.data_previsao_fim && (
                                    <div>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Previsão de fim</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Calendar size={12} /> {new Date(obra.data_previsao_fim + 'T12:00').toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {obra.descricao && (
                                <div>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Descrição</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{obra.descricao}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Link href={`/rdo/novo?obra=${obra.id}`} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 10, padding: '20px 12px', borderRadius: 16, textDecoration: 'none',
                            background: 'linear-gradient(135deg, rgba(52,152,219,0.15), rgba(52,152,219,0.08))',
                            border: '1px solid rgba(52,152,219,0.3)',
                            color: '#3498DB', fontWeight: 700, fontSize: 14,
                            transition: 'all 0.2s',
                        }}>
                            <ClipboardList size={26} />
                            Novo RDO
                        </Link>
                        <Link href={`/concreto/novo?obra=${obra.id}`} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 10, padding: '20px 12px', borderRadius: 16, textDecoration: 'none',
                            background: 'linear-gradient(135deg, rgba(127,166,83,0.15), rgba(127,166,83,0.08))',
                            border: '1px solid rgba(127,166,83,0.3)',
                            color: '#7FA653', fontWeight: 700, fontSize: 14,
                            transition: 'all 0.2s',
                        }}>
                            <HardHat size={26} />
                            Nova Concretagem
                        </Link>
                    </div>
                </>
            )}
        </div>
    )
}
