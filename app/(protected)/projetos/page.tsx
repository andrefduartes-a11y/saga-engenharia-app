'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Plus, Download, FolderGit2 } from 'lucide-react'
import Link from 'next/link'

export default function ProjetosPage() {
    const [projetos, setProjetos] = useState<any[]>([])
    const [obras, setObras] = useState<any[]>([])
    const [obraFiltro, setObraFiltro] = useState('')
    const supabase = createClient()

    async function load(obraId?: string) {
        let query = supabase.from('projetos').select('*, obras(nome)').order('created_at', { ascending: false })
        if (obraId) query = query.eq('obra_id', obraId)
        const { data } = await query
        setProjetos(data || [])
    }

    useEffect(() => {
        load()
        supabase.from('obras').select('id, nome').then(({ data }) => setObras(data || []))
    }, [])

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Projetos</h1>
                <Link href="/projetos/novo" className="btn-primary py-2 px-4 text-sm min-h-[40px] w-auto">
                    <Plus size={16} /> Novo
                </Link>
            </div>

            <select className="input" value={obraFiltro} onChange={e => { setObraFiltro(e.target.value); load(e.target.value) }}>
                <option value="">Todas as obras</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>

            {projetos.length === 0 ? (
                <div className="card text-center py-12">
                    <FolderGit2 size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum projeto</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Adicione arquivos de engenharia e arquitetura</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {projetos.map(proj => (
                        <div key={proj.id} className="card flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(58, 68, 78, 0.15)' }}>
                                <FolderGit2 size={20} style={{ color: 'var(--saga-gray-light)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{proj.nome}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="badge-gray">{proj.disciplina || 'Geral'}</span>
                                    <span className="badge">{proj.revisao || 'R00'}</span>
                                </div>
                                {proj.obras && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{(proj.obras as any)?.nome}</p>}
                            </div>
                            <a href={proj.url_arquivo} target="_blank" rel="noopener" className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74, 158, 204, 0.15)', color: '#4A9ECC' }}>
                                <Download size={18} />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
