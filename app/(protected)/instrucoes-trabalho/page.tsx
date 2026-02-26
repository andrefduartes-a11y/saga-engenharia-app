'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, Download, Star } from 'lucide-react'

interface IT {
    id: string
    codigo: string
    nome: string
    categoria?: string
    revisao: string
    vigente: boolean
    descricao?: string
    anexo_pdf_url?: string
}

export default function ITsPage() {
    const supabase = createClient()
    const [its, setITs] = useState<IT[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [filtroVigente, setFiltroVigente] = useState(false)
    const [form, setForm] = useState({ codigo: '', nome: '', categoria: '', revisao: 'R00', descricao: '', anexo_pdf_url: '' })
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        let q = supabase.from('its').select('*').order('codigo')
        if (filtroVigente) q = q.eq('vigente', true)
        q.then(({ data }) => { setITs(data || []); setLoading(false) })
    }, [filtroVigente])

    async function salvar() {
        if (!form.codigo || !form.nome) return
        setSalvando(true)
        const { data } = await supabase.from('its').insert({
            codigo: form.codigo,
            nome: form.nome,
            categoria: form.categoria || null,
            revisao: form.revisao,
            descricao: form.descricao || null,
            anexo_pdf_url: form.anexo_pdf_url || null,
            vigente: true,
        }).select().single()
        if (data) { setITs(p => [...p, data]); setShowForm(false); setForm({ codigo: '', nome: '', categoria: '', revisao: 'R00', descricao: '', anexo_pdf_url: '' }) }
        setSalvando(false)
    }

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Instruções de Trabalho</h1>
                <button onClick={() => setShowForm(true)} className="btn-primary py-2 px-4 text-sm min-h-[40px]">
                    <Plus size={16} /> Nova IT
                </button>
            </div>

            {/* Filtro vigentes */}
            <button onClick={() => setFiltroVigente(p => !p)}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{
                    background: filtroVigente ? 'var(--green-primary)' : 'var(--bg-card)',
                    color: filtroVigente ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${filtroVigente ? 'var(--green-primary)' : 'var(--border-subtle)'}`,
                }}>
                <Star size={11} className="inline mr-1" /> Somente vigentes
            </button>

            {showForm && (
                <div className="card space-y-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nova IT</p>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="form-label">Código *</label>
                            <input className="input" placeholder="Ex: IT-001" value={form.codigo}
                                onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Revisão</label>
                            <input className="input" placeholder="R00" value={form.revisao}
                                onChange={e => setForm(p => ({ ...p, revisao: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Nome *</label>
                        <input className="input" placeholder="Nome da instrução" value={form.nome}
                            onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                    </div>
                    <div>
                        <label className="form-label">Categoria</label>
                        <input className="input" placeholder="Ex: Concreto, Estrutural..." value={form.categoria}
                            onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} />
                    </div>
                    <div>
                        <label className="form-label">Descrição</label>
                        <textarea className="input" rows={2} value={form.descricao}
                            onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                    </div>
                    <div>
                        <label className="form-label">Link do PDF</label>
                        <input className="input" placeholder="URL do documento" value={form.anexo_pdf_url}
                            onChange={e => setForm(p => ({ ...p, anexo_pdf_url: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                        <button onClick={salvar} disabled={salvando || !form.codigo || !form.nome} className="btn-primary flex-1 text-sm">
                            {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card animate-pulse" style={{ height: 70 }} />)}</div>
            ) : its.length === 0 ? (
                <div className="card text-center py-12">
                    <BookOpen size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma IT cadastrada</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {its.map(it => (
                        <div key={it.id} className="card flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(212,168,67,0.15)' }}>
                                <BookOpen size={18} style={{ color: '#D4A843' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,168,67,0.15)', color: '#D4A843' }}>
                                        {it.codigo}
                                    </span>
                                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(74,144,217,0.15)', color: '#4A90D9' }}>
                                        {it.revisao}
                                    </span>
                                    {!it.vigente && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>arquivada</span>}
                                </div>
                                <p className="font-semibold text-sm mt-1 truncate" style={{ color: 'var(--text-primary)' }}>{it.nome}</p>
                                {it.categoria && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{it.categoria}</p>}
                            </div>
                            {it.anexo_pdf_url && (
                                <a href={it.anexo_pdf_url} target="_blank" rel="noopener"
                                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(74,144,217,0.15)', color: '#4A90D9' }}>
                                    <Download size={16} />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
