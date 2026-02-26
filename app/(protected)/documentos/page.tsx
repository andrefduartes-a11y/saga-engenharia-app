'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Upload, X, Loader2, Download, Trash2 } from 'lucide-react'

const TIPOS = ['projeto', 'contrato', 'memorial', 'foto', 'rdo', 'concreto', 'outro']

export default function DocumentosPage() {
    const [documentos, setDocumentos] = useState<any[]>([])
    const [obras, setObras] = useState<any[]>([])
    const [obraFiltro, setObraFiltro] = useState('')
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    async function load(obraId?: string) {
        let query = supabase.from('documentos_projeto').select('*, obras(nome)').order('created_at', { ascending: false })
        if (obraId) query = query.eq('obra_id', obraId)
        const { data } = await query
        setDocumentos(data || [])
    }

    useEffect(() => {
        load()
        supabase.from('obras').select('id, nome').then(({ data }) => setObras(data || []))
    }, [])

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 50 * 1024 * 1024) {
            setError('Arquivo muito grande. Máximo 50MB.')
            return
        }

        setUploading(true)
        setError('')
        const { data: { user } } = await supabase.auth.getUser()
        const obraId = obraFiltro || 'geral'
        const path = `${obraId}/documentos/${Date.now()}-${file.name}`

        const { data, error: uploadError } = await supabase.storage.from('saga-engenharia').upload(path, file)
        if (uploadError) {
            setError('Erro no upload.')
            setUploading(false)
            return
        }

        const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)

        const tipo = TIPOS.find(t => file.name.toLowerCase().includes(t)) || 'outro'

        await supabase.from('documentos_projeto').insert({
            obra_id: obraFiltro || null,
            nome_arquivo: file.name,
            tipo,
            url_storage: publicUrl,
            tamanho_bytes: file.size,
            uploaded_by: user?.id,
        })

        load(obraFiltro)
        setUploading(false)
        e.target.value = ''
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const tipoColor: Record<string, string> = {
        projeto: 'badge-green',
        contrato: 'badge-warning',
        memorial: 'badge-info',
        foto: 'badge-green',
        rdo: 'badge',
        concreto: 'badge-info',
        outro: 'badge',
    }

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Documentos</h1>
                <label className="btn-primary py-2 px-4 text-sm min-h-[40px] cursor-pointer">
                    {uploading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <><Upload size={16} /> Enviar</>}
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.dxf" />
                </label>
            </div>

            {/* Filtro por obra */}
            <select className="input" value={obraFiltro} onChange={e => { setObraFiltro(e.target.value); load(e.target.value) }}>
                <option value="">Todas as obras</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>

            {error && <p className="text-sm" style={{ color: '#E05252' }}>{error}</p>}

            {documentos.length === 0 ? (
                <div className="card text-center py-12">
                    <FileText size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum documento</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Faça upload de projetos, contratos e memoriais</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {documentos.map(doc => (
                        <div key={doc.id} className="card flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(127, 166, 83, 0.15)' }}>
                                <FileText size={20} style={{ color: 'var(--green-primary)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{doc.nome_arquivo}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={tipoColor[doc.tipo] || 'badge'}>{doc.tipo}</span>
                                    {doc.tamanho_bytes && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatSize(doc.tamanho_bytes)}</span>}
                                </div>
                                {doc.obras && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(doc.obras as any)?.nome}</p>}
                            </div>
                            <a href={doc.url_storage} target="_blank" rel="noopener" className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74, 158, 204, 0.15)', color: '#4A9ECC' }}>
                                <Download size={18} />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
