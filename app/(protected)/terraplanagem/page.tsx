'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import { Mountain, Plus, ChevronRight, X, Calendar, User, Building2, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Etapa {
    id: string
    nome_etapa: string
    data_inicio?: string
    responsavel?: string
    status: string
}

interface ObraSimples { id: string; nome: string; cidade?: string }

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

export default function TerrapalagemPage() {
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    // Directors pick obra in-page; engineers have it auto-set
    const [allObras, setAllObras] = useState<ObraSimples[]>([])
    const [selectedObraId, setSelectedObraId] = useState<string>('')
    const obra = isDirector
        ? (allObras.find(o => o.id === selectedObraId) || null)
        : obraCtx

    const [etapas, setEtapas] = useState<Etapa[]>([])
    const [loading, setLoading] = useState(false)
    const [novaEtapa, setNovaEtapa] = useState(false)
    const [form, setForm] = useState({ nome_etapa: '', data_inicio: '', responsavel: '' })
    const [salvando, setSalvando] = useState(false)

    // Load all obras for directors
    useEffect(() => {
        if (!isDirector) return
        supabase.from('obras').select('id, nome, cidade').order('nome')
            .then(({ data }) => setAllObras(data || []))
    }, [isDirector])

    // Load etapas when obra changes
    useEffect(() => {
        if (!obra) { setEtapas([]); return }
        setLoading(true)
        supabase.from('terraplanagem_etapas')
            .select('*')
            .eq('obra_id', obra.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => { setEtapas(data || []); setLoading(false) })
    }, [obra?.id])


    async function criarEtapa() {
        if (!obra || !form.nome_etapa) return
        setSalvando(true)
        const { data } = await supabase.from('terraplanagem_etapas').insert({
            obra_id: obra.id,
            nome_etapa: form.nome_etapa,
            data_inicio: form.data_inicio || null,
            responsavel: form.responsavel || null,
        }).select().single()
        if (data) {
            setEtapas(p => [data, ...p])
            setNovaEtapa(false)
            setForm({ nome_etapa: '', data_inicio: '', responsavel: '' })
        }
        setSalvando(false)
    }

    // ── Edit etapa ──────────────────────────────────────────────────────────
    const [editId, setEditId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({ nome_etapa: '', data_inicio: '', responsavel: '' })
    const [editSalvando, setEditSalvando] = useState(false)

    function startEdit(e: Etapa) {
        setEditId(e.id)
        setEditForm({ nome_etapa: e.nome_etapa, data_inicio: e.data_inicio || '', responsavel: e.responsavel || '' })
    }

    async function salvarEdit() {
        if (!editId || !editForm.nome_etapa) return
        setEditSalvando(true)
        const { data } = await supabase.from('terraplanagem_etapas').update({
            nome_etapa: editForm.nome_etapa,
            data_inicio: editForm.data_inicio || null,
            responsavel: editForm.responsavel || null,
        }).eq('id', editId).select().single()
        if (data) setEtapas(p => p.map(x => x.id === editId ? data : x))
        setEditId(null)
        setEditSalvando(false)
    }

    // ── Delete etapa ─────────────────────────────────────────────────────────
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    async function confirmarDelete() {
        if (!deleteId) return
        setDeleting(true)
        await supabase.from('terraplanagem_etapas').delete().eq('id', deleteId)
        setEtapas(p => p.filter(x => x.id !== deleteId))
        setDeleteId(null)
        setDeleting(false)
    }

    return (
        <div style={{ padding: '20px', maxWidth: 860 }}>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mountain size={20} style={{ color: '#D4A843' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>Terraplanagem</h1>
                        {obra && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{obra.nome}</p>}
                    </div>
                </div>
                <button
                    onClick={() => setNovaEtapa(true)}
                    disabled={!obra}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px', borderRadius: 10,
                        background: obra ? 'linear-gradient(135deg, #D4A843, #c49130)' : 'rgba(255,255,255,0.06)',
                        border: 'none', color: obra ? '#fff' : 'var(--text-muted)',
                        fontSize: 13, fontWeight: 700, cursor: obra ? 'pointer' : 'not-allowed',
                        boxShadow: obra ? '0 4px 14px rgba(212,168,67,0.35)' : 'none',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => obra && (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                >
                    <Plus size={15} /> Nova Etapa
                </button>
            </div>

            {/* ── Director: obra selector ── */}
            {isDirector && (
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                        <Building2 size={11} /> Obra
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedObraId}
                            onChange={e => { setSelectedObraId(e.target.value); setNovaEtapa(false) }}
                            style={{
                                width: '100%', boxSizing: 'border-box', appearance: 'none',
                                padding: '11px 40px 11px 14px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                                color: selectedObraId ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontSize: 13, outline: 'none', cursor: 'pointer',
                            }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(212,168,67,0.5)')}
                            onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
                        >
                            <option value="">Selecione uma obra para visualizar...</option>
                            {allObras.map(o => (
                                <option key={o.id} value={o.id}>{o.nome}{o.cidade ? ` — ${o.cidade}` : ''}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
                </div>
            )}

            {/* ── New Etapa form ── */}
            {novaEtapa && (
                <div style={{
                    marginBottom: 20, borderRadius: 16,
                    background: 'linear-gradient(145deg, rgba(212,168,67,0.06), rgba(212,168,67,0.03))',
                    border: '1px solid rgba(212,168,67,0.25)',
                    overflow: 'hidden',
                }}>
                    {/* Form header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(212,168,67,0.15)', background: 'rgba(212,168,67,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Mountain size={15} style={{ color: '#D4A843' }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#D4A843' }}>Nova Etapa de Terraplanagem</span>
                        </div>
                        <button onClick={() => setNovaEtapa(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Form body */}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Nome */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'block' }}>
                                Nome da Etapa *
                            </label>
                            <input
                                value={form.nome_etapa}
                                onChange={e => setForm(p => ({ ...p, nome_etapa: e.target.value }))}
                                placeholder="Ex: Corte e aterro eixo A, Compactação do sub-leito..."
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    padding: '11px 14px', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(212,168,67,0.25)',
                                    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(212,168,67,0.6)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(212,168,67,0.25)')}
                            />
                        </div>

                        {/* Data + Responsável */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Calendar size={10} /> Data de Início
                                </label>
                                <input
                                    type="date"
                                    value={form.data_inicio}
                                    onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        padding: '11px 14px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                        transition: 'border-color 0.15s',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,168,67,0.4)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <User size={10} /> Responsável
                                </label>
                                <input
                                    value={form.responsavel}
                                    onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))}
                                    placeholder="Nome do encarregado"
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        padding: '11px 14px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                        transition: 'border-color 0.15s',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,168,67,0.4)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                            <button
                                onClick={() => setNovaEtapa(false)}
                                style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={criarEtapa}
                                disabled={salvando || !form.nome_etapa}
                                style={{
                                    flex: 2, padding: '10px', borderRadius: 10,
                                    background: !form.nome_etapa ? 'rgba(212,168,67,0.3)' : 'linear-gradient(135deg, #D4A843, #c49130)',
                                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                                    cursor: !form.nome_etapa ? 'not-allowed' : 'pointer',
                                    boxShadow: form.nome_etapa ? '0 4px 12px rgba(212,168,67,0.3)' : 'none',
                                    opacity: salvando ? 0.7 : 1,
                                }}
                            >
                                {salvando ? '⏳ Criando...' : '✓ Criar Etapa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            {!obra ? (
                <div style={{ padding: '48px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Mountain size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                    <p style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma obra selecionada</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Você será redirecionado automaticamente</p>
                </div>
            ) : loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 76, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />)}
                </div>
            ) : etapas.length === 0 ? (
                <div style={{ padding: '60px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(212,168,67,0.2)', textAlign: 'center' }}>
                    <Mountain size={48} style={{ margin: '0 auto 14px', display: 'block', color: '#D4A843', opacity: 0.4 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma etapa registrada</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Comece adicionando a primeira etapa de terraplanagem</p>
                    <button onClick={() => setNovaEtapa(true)} style={{ padding: '8px 20px', borderRadius: 8, background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        + Nova Etapa
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {etapas.map(e => {
                        const finalizada = e.status === 'finalizada'
                        const isEditing = editId === e.id
                        return (
                            <div key={e.id}>
                                {/* ── Card row ── */}
                                <div
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 18px', borderRadius: isEditing ? '14px 14px 0 0' : 14,
                                        background: 'rgba(255,255,255,0.025)',
                                        border: `1px solid ${finalizada ? 'rgba(16,185,129,0.2)' : 'rgba(212,168,67,0.15)'}`,
                                        transition: 'all 0.15s',
                                        borderBottom: isEditing ? 'none' : undefined,
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: finalizada ? 'rgba(16,185,129,0.12)' : 'rgba(212,168,67,0.12)', border: `1px solid ${finalizada ? 'rgba(16,185,129,0.2)' : 'rgba(212,168,67,0.2)'}` }}>
                                        <Mountain size={20} style={{ color: finalizada ? '#10B981' : '#D4A843' }} />
                                    </div>

                                    {/* Info — navigates to detail */}
                                    <Link href={`/terraplanagem/${e.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {e.nome_etapa}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                                            {e.data_inicio && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} /> {fmt(e.data_inicio)}</span>}
                                            {e.responsavel && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={10} /> {e.responsavel}</span>}
                                        </div>
                                    </Link>

                                    {/* Status badge */}
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, flexShrink: 0, background: finalizada ? 'rgba(16,185,129,0.12)' : 'rgba(212,168,67,0.12)', color: finalizada ? '#10B981' : '#D4A843', border: `1px solid ${finalizada ? 'rgba(16,185,129,0.25)' : 'rgba(212,168,67,0.25)'}` }}>
                                        {finalizada ? '✅ Finalizada' : '🔨 Em andamento'}
                                    </span>

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                        <button
                                            onClick={() => isEditing ? setEditId(null) : startEdit(e)}
                                            title="Editar etapa"
                                            style={{ padding: '6px 10px', borderRadius: 8, background: isEditing ? 'rgba(255,255,255,0.08)' : 'rgba(212,168,67,0.1)', border: `1px solid ${isEditing ? 'rgba(255,255,255,0.12)' : 'rgba(212,168,67,0.25)'}`, color: isEditing ? 'var(--text-muted)' : '#D4A843', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                                        >
                                            {isEditing ? <X size={13} /> : <Pencil size={13} />}
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(e.id)}
                                            title="Apagar etapa"
                                            style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* ── Inline edit form ── */}
                                {isEditing && (
                                    <div style={{ padding: '16px 18px', background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.15)', borderTop: 'none', borderRadius: '0 0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div>
                                            <label className="form-label">Nome da Etapa *</label>
                                            <input value={editForm.nome_etapa} onChange={ev => setEditForm(p => ({ ...p, nome_etapa: ev.target.value }))} className="input" style={{ minHeight: 'unset', padding: '9px 12px', fontSize: 13 }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <div>
                                                <label className="form-label">Data Início</label>
                                                <input type="date" value={editForm.data_inicio} onChange={ev => setEditForm(p => ({ ...p, data_inicio: ev.target.value }))} className="input" style={{ minHeight: 'unset', padding: '9px 12px', fontSize: 13 }} />
                                            </div>
                                            <div>
                                                <label className="form-label">Responsável</label>
                                                <input value={editForm.responsavel} onChange={ev => setEditForm(p => ({ ...p, responsavel: ev.target.value }))} className="input" style={{ minHeight: 'unset', padding: '9px 12px', fontSize: 13 }} placeholder="Encarregado" />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => setEditId(null)} style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                                            <button onClick={salvarEdit} disabled={editSalvando || !editForm.nome_etapa} style={{ flex: 2, padding: '8px', borderRadius: 8, background: 'linear-gradient(135deg,#D4A843,#c49130)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                                {editSalvando ? 'Salvando...' : '✓ Salvar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Delete confirm overlay ── */}
            {deleteId && (
                <>
                    <div onClick={() => setDeleteId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                        width: 'min(380px, 92vw)', background: 'var(--bg-card)',
                        border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: '24px', zIndex: 201,
                    }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>⚠️ Apagar etapa?</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                            Todos os registros de viagens e horas desta etapa serão apagados permanentemente.
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={confirmarDelete} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#EF4444', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                {deleting ? 'Apagando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
