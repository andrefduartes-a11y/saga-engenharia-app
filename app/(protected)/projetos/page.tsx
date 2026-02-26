'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import { FolderOpen, Plus, Download, Filter, Star } from 'lucide-react'

const DISCIPLINAS = [
    'Arquitetura', 'Estrutural', 'Fundações', 'Elétrica', 'Hidrossanitária',
    'AVAC', 'Prevenção de Incêndio', 'Impermeabilização', 'Paisagismo',
    'Topografia', 'Geotécnica', 'Ambiental', 'Aprovação / Habite-se'
]

interface Projeto {
    id: string
    disciplina: string
    nome: string
    revisao: string
    vigente: boolean
    data?: string
    download_url?: string
}

export default function ProjetosPage() {
    const { obra } = useObra()
    const supabase = createClient()
    const [projetos, setProjetos] = useState<Projeto[]>([])
    const [loading, setLoading] = useState(true)
    const [disciplinaFiltro, setDisciplinaFiltro] = useState('')
    const [somenteVigentes, setSomenteVigentes] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ disciplina: DISCIPLINAS[0], nome: '', revisao: 'R00', download_url: '' })
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        if (!obra) { setLoading(false); return }
        let q = supabase.from('projetos')
            .select('id, disciplina, nome, revisao, vigente, data, download_url')
            .eq('obra_id', obra.id)
            .order('disciplina')
        if (somenteVigentes) q = q.eq('vigente', true)
        if (disciplinaFiltro) q = q.eq('disciplina', disciplinaFiltro)
        q.then(({ data }) => { setProjetos(data || []); setLoading(false) })
    }, [obra, disciplinaFiltro, somenteVigentes])

    async function salvar() {
        if (!obra) return
        setSalvando(true)
        const { data } = await supabase.from('projetos').insert({
            obra_id: obra.id,
            disciplina: form.disciplina,
            nome: form.nome,
            revisao: form.revisao,
            vigente: true,
            download_url: form.download_url || null,
        }).select().single()
        if (data) { setProjetos(p => [...p, data]); setShowForm(false) }
        setSalvando(false)
    }

    const byDisciplina = (projetos: Projeto[]) => {
        const map: Record<string, Projeto[]> = {}
        projetos.forEach(p => { if (!map[p.disciplina]) map[p.disciplina] = []; map[p.disciplina].push(p) })
        return map
    }

    const grupos = byDisciplina(projetos)

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Projetos</h1>
                <button onClick={() => setShowForm(true)} className="btn-primary py-2 px-4 text-sm min-h-[40px]">
                    <Plus size={16} /> Novo
                </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
                <select className="input flex-1" value={disciplinaFiltro} onChange={e => setDisciplinaFiltro(e.target.value)}>
                    <option value="">Todas as disciplinas</option>
                    {DISCIPLINAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button onClick={() => setSomenteVigentes(p => !p)}
                    className="px-3 rounded-xl text-xs font-semibold transition-all"
                    style={{
                        background: somenteVigentes ? 'var(--green-primary)' : 'var(--bg-card)',
                        color: somenteVigentes ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${somenteVigentes ? 'var(--green-primary)' : 'var(--border-subtle)'}`,
                        whiteSpace: 'nowrap',
                    }}>
                    <Star size={12} className="inline mr-1" />Vigentes
                </button>
            </div>

            {showForm && (
                <div className="card space-y-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Novo Projeto</p>
                    <div>
                        <label className="form-label">Disciplina</label>
                        <select className="input" value={form.disciplina} onChange={e => setForm(p => ({ ...p, disciplina: e.target.value }))}>
                            {DISCIPLINAS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Nome / Descrição *</label>
                        <input className="input" placeholder="Ex: Planta Baixa Térreo"
                            value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="form-label">Revisão</label>
                            <input className="input" placeholder="R00" value={form.revisao}
                                onChange={e => setForm(p => ({ ...p, revisao: e.target.value }))} />
                        </div>
                        <div>
                            <label className="form-label">Link de Download</label>
                            <input className="input" placeholder="URL do arquivo"
                                value={form.download_url} onChange={e => setForm(p => ({ ...p, download_url: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                        <button onClick={salvar} disabled={salvando || !form.nome} className="btn-primary flex-1 text-sm">
                            {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            )}

            {!obra ? (
                <div className="card text-center py-8">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selecione uma obra</p>
                </div>
            ) : loading ? (
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="card animate-pulse" style={{ height: 80 }} />)}</div>
            ) : Object.keys(grupos).length === 0 ? (
                <div className="card text-center py-12">
                    <FolderOpen size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum projeto cadastrado</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grupos).map(([disc, itens]) => (
                        <div key={disc}>
                            <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {disc}
                            </p>
                            <div className="space-y-2">
                                {itens.map(p => (
                                    <div key={p.id} className="card flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'rgba(155,89,182,0.15)' }}>
                                            <FolderOpen size={18} style={{ color: '#9B59B6' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{p.nome}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(74,144,217,0.15)', color: '#4A90D9' }}>
                                                    {p.revisao}
                                                </span>
                                                {!p.vigente && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>arquivado</span>}
                                            </div>
                                        </div>
                                        {p.download_url && (
                                            <a href={p.download_url} target="_blank" rel="noopener"
                                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'rgba(74,144,217,0.15)', color: '#4A90D9' }}>
                                                <Download size={16} />
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
