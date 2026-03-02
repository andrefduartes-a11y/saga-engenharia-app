'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Wrench, Trash2 } from 'lucide-react'
import Link from 'next/link'

const TIPOS_FERRAMENTA = [
    'Furadeira', 'Serra Circular', 'Lixadeira', 'Makita / Parafusadeira',
    'Martelete', 'Esmerilhadeira', 'Outros',
]

export default function EditarFerramentaPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string
    const supabase = createClient()

    const [obras, setObras] = useState<{ id: string; nome: string }[]>([])
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deletando, setDeletando] = useState(false)
    const [form, setForm] = useState({
        nome: '', numero_id: '', tipo: '', status: 'disponivel',
        obra_id: '', responsavel: '', observacoes: '',
    })

    useEffect(() => {
        async function load() {
            const [ferrRes, obrasRes] = await Promise.all([
                supabase.from('ferramentas_internas').select('*').eq('id', id).single(),
                supabase.from('obras').select('id, nome').order('nome'),
            ])
            if (ferrRes.data) {
                const d = ferrRes.data
                setForm({ nome: d.nome, numero_id: d.numero_id, tipo: d.tipo || '', status: d.status, obra_id: d.obra_id || '', responsavel: d.responsavel || '', observacoes: d.observacoes || '' })
            }
            setObras(obrasRes.data || [])
            setLoading(false)
        }
        load()
    }, [id])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true); setError('')
        const { error: err } = await supabase.from('ferramentas_internas').update({
            nome: form.nome.trim(),
            numero_id: form.numero_id.trim(),
            tipo: form.tipo || null,
            status: form.status,
            obra_id: form.obra_id || null,
            responsavel: form.responsavel.trim() || null,
            observacoes: form.observacoes.trim() || null,
        }).eq('id', id)
        if (err) { setError('Erro: ' + err.message); setSaving(false); return }
        router.push('/ferramentas')
    }

    async function handleDelete() {
        if (!confirm('Apagar esta ferramenta? Esta ação não pode ser desfeita.')) return
        setDeletando(true)
        await supabase.from('ferramentas_internas').delete().eq('id', id)
        router.push('/ferramentas')
    }

    if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Carregando...</div>

    return (
        <div style={{ padding: '20px', maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href="/ferramentas" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
                    <ArrowLeft size={20} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(127,166,83,0.15)', border: '1px solid rgba(127,166,83,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wrench size={18} style={{ color: '#7FA653' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>Editar Ferramenta</h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{form.nome} · #{form.numero_id}</p>
                    </div>
                </div>
                <button onClick={handleDelete} disabled={deletando} title="Apagar ferramenta" style={{ padding: '8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={16} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 13 }}>{error}</div>}

                <div>
                    <label className="label">Nome do Equipamento *</label>
                    <input className="input" required value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                </div>

                <div>
                    <label className="label">N° de ID / Patrimônio *</label>
                    <input className="input" required value={form.numero_id} onChange={e => setForm(p => ({ ...p, numero_id: e.target.value }))} />
                </div>

                <div>
                    <label className="label">Tipo / Categoria</label>
                    <select className="input" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                        <option value="">Selecione...</option>
                        {TIPOS_FERRAMENTA.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="label">Status</label>
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
                            }}>{s.label}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="label">Obra Atual</label>
                    <select className="input" value={form.obra_id} onChange={e => setForm(p => ({ ...p, obra_id: e.target.value }))}>
                        <option value="">Nenhuma</option>
                        {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                </div>

                <div>
                    <label className="label">Responsável Atual</label>
                    <input className="input" placeholder="Nome do responsável" value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} />
                </div>

                <div>
                    <label className="label">Observações</label>
                    <textarea className="input min-h-[80px]" value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <Link href="/ferramentas" style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
                        Cancelar
                    </Link>
                    <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg, #7FA653, #6a8f44)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : '✓ Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    )
}
