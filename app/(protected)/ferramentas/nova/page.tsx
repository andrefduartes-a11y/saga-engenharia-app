'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Wrench, Plus, X } from 'lucide-react'
import Link from 'next/link'

const TIPOS_FERRAMENTA_BASE = [
    'Furadeira',
    'Serra Circular',
    'Lixadeira',
    'Makita / Parafusadeira',
    'Martelete',
    'Esmerilhadeira',
    'Tablet',
    'Notebook',
    'Outros',
]

export default function NovaFerramentaPage() {
    const router = useRouter()
    const supabase = createClient()
    const [obras, setObras] = useState<{ id: string; nome: string }[]>([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [tiposCustom, setTiposCustom] = useState<string[]>([])
    const [novoTipoInput, setNovoTipoInput] = useState('')
    const [showAddTipo, setShowAddTipo] = useState(false)

    const [form, setForm] = useState({
        nome: '',
        numero_id: '',
        tipo: '',
        status: 'disponivel',
        obra_id: '',
        responsavel: '',
        observacoes: '',
    })

    const tiposTodos = [...TIPOS_FERRAMENTA_BASE, ...tiposCustom]

    useEffect(() => {
        supabase.from('obras').select('id, nome').order('nome').then(({ data }) => setObras(data || []))
    }, [])

    function handleAddTipo() {
        const trimmed = novoTipoInput.trim()
        if (!trimmed) return
        if (tiposTodos.includes(trimmed)) {
            setForm(p => ({ ...p, tipo: trimmed }))
            setNovoTipoInput('')
            setShowAddTipo(false)
            return
        }
        setTiposCustom(p => [...p, trimmed])
        setForm(p => ({ ...p, tipo: trimmed }))
        setNovoTipoInput('')
        setShowAddTipo(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.nome.trim() || !form.numero_id.trim()) { setError('Nome e N° de ID são obrigatórios.'); return }
        setSaving(true); setError('')

        const { error: err } = await supabase.from('ferramentas_internas').insert({
            nome: form.nome.trim(),
            numero_id: form.numero_id.trim(),
            tipo: form.tipo || null,
            status: form.status,
            obra_id: form.obra_id || null,
            responsavel: form.responsavel.trim() || null,
            observacoes: form.observacoes.trim() || null,
        })

        if (err) { setError('Erro ao salvar: ' + err.message); setSaving(false); return }
        router.push('/ferramentas')
    }

    return (
        <div style={{ padding: '20px', maxWidth: 600 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href="/ferramentas" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                    <ArrowLeft size={20} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(127,166,83,0.15)', border: '1px solid rgba(127,166,83,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wrench size={18} style={{ color: '#7FA653' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>Novo Equipamento</h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cadastrar equipamento ou ferramenta</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                    <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 13 }}>
                        {error}
                    </div>
                )}

                {/* Nome */}
                <div>
                    <label className="label">Nome do Equipamento *</label>
                    <input className="input" required placeholder="Ex: Lixadeira Angular, Makita DHP484..." value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                </div>

                {/* N° ID */}
                <div>
                    <label className="label">N° de ID / Patrimônio *</label>
                    <input className="input" required placeholder="Ex: FER-001, SA-042..." value={form.numero_id} onChange={e => setForm(p => ({ ...p, numero_id: e.target.value }))} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Código único para identificação física.</p>
                </div>

                {/* Tipo */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label className="label" style={{ marginBottom: 0 }}>Tipo / Categoria</label>
                        <button
                            type="button"
                            onClick={() => setShowAddTipo(p => !p)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 8, background: 'rgba(127,166,83,0.1)', border: '1px solid rgba(127,166,83,0.25)', color: '#7FA653', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            <Plus size={11} /> Novo tipo
                        </button>
                    </div>

                    {showAddTipo && (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                            <input
                                className="input"
                                placeholder="Nome do novo tipo..."
                                value={novoTipoInput}
                                onChange={e => setNovoTipoInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTipo() } }}
                                autoFocus
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={handleAddTipo}
                                style={{ padding: '0 14px', borderRadius: 8, background: 'linear-gradient(135deg, #7FA653, #6a8f44)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Adicionar
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowAddTipo(false); setNovoTipoInput('') }}
                                style={{ width: 36, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <select className="input" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                        <option value="">Selecione...</option>
                        {tiposTodos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {tiposCustom.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {tiposCustom.map(t => (
                                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 10px', borderRadius: 99, background: 'rgba(127,166,83,0.1)', border: '1px solid rgba(127,166,83,0.25)', fontSize: 11, color: '#7FA653', fontWeight: 600 }}>
                                    {t}
                                    <button type="button" onClick={() => { setTiposCustom(p => p.filter(x => x !== t)); if (form.tipo === t) setForm(p => ({ ...p, tipo: '' })) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7FA653', display: 'flex', alignItems: 'center', padding: 0 }}>
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status */}
                <div>
                    <label className="label">Status Inicial</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                        {[
                            { value: 'disponivel', label: '✅ Disponível', color: '#10B981' },
                            { value: 'em_uso', label: '🔵 Em Uso', color: '#3498DB' },
                            { value: 'em_manutencao', label: '🔧 Manutenção', color: '#F59E0B' },
                        ].map(s => (
                            <button key={s.value} type="button" onClick={() => setForm(p => ({ ...p, status: s.value }))} style={{
                                padding: '10px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                background: form.status === s.value ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                                border: `2px solid ${form.status === s.value ? s.color : 'var(--border-subtle)'}`,
                                color: form.status === s.value ? s.color : 'var(--text-muted)',
                                transition: 'all 0.15s',
                            }}>{s.label}</button>
                        ))}
                    </div>
                </div>

                {/* Obra (opcional) */}
                {form.status !== 'disponivel' && (
                    <div>
                        <label className="label">Obra Atual</label>
                        <select className="input" value={form.obra_id} onChange={e => setForm(p => ({ ...p, obra_id: e.target.value }))}>
                            <option value="">Selecione...</option>
                            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </select>
                    </div>
                )}

                {/* Responsável (opcional) */}
                {form.status !== 'disponivel' && (
                    <div>
                        <label className="label">Responsável Atual</label>
                        <input className="input" placeholder="Nome do responsável" value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} />
                    </div>
                )}

                {/* Observações */}
                <div>
                    <label className="label">Observações</label>
                    <textarea className="input min-h-[80px]" placeholder="Número de série, marca, modelo, condição..." value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <Link href="/ferramentas" style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                        Cancelar
                    </Link>
                    <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 10, background: saving ? 'rgba(127,166,83,0.4)' : 'linear-gradient(135deg, #7FA653, #6a8f44)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : '✓ Cadastrar Equipamento'}
                    </button>
                </div>
            </form>
        </div>
    )
}
