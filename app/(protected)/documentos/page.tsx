'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import {
    FileText, Upload, X, Loader2, Download, Trash2, File,
    FileSpreadsheet, Image, Archive, ChevronDown, Search
} from 'lucide-react'

const TIPOS = ['projeto', 'contrato', 'memorial', 'foto', 'rdo', 'concreto', 'laudo', 'outro']

const TIPO_CONFIG: Record<string, { label: string; cor: string; bg: string }> = {
    projeto: { label: 'Projeto', cor: '#9B59B6', bg: 'rgba(155,89,182,0.12)' },
    contrato: { label: 'Contrato', cor: '#F39C12', bg: 'rgba(243,156,18,0.12)' },
    memorial: { label: 'Memorial', cor: '#4A90D9', bg: 'rgba(74,144,217,0.12)' },
    foto: { label: 'Foto', cor: '#1ABC9C', bg: 'rgba(26,188,156,0.12)' },
    rdo: { label: 'RDO', cor: '#E67E22', bg: 'rgba(230,126,34,0.12)' },
    concreto: { label: 'Concreto', cor: '#607D8B', bg: 'rgba(96,125,139,0.12)' },
    laudo: { label: 'Laudo', cor: '#E74C3C', bg: 'rgba(231,76,60,0.12)' },
    outro: { label: 'Outro', cor: '#52A87B', bg: 'rgba(82,168,123,0.12)' },
}

function fileIcon(nome: string) {
    const ext = nome.split('.').pop()?.toLowerCase() || ''
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image size={18} />
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={18} />
    if (['zip', 'rar', '7z'].includes(ext)) return <Archive size={18} />
    if (['pdf', 'doc', 'docx'].includes(ext)) return <FileText size={18} />
    return <File size={18} />
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DocumentosPage() {
    const { obra, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [documentos, setDocumentos] = useState<any[]>([])
    const [obras, setObras] = useState<any[]>([])
    const [obraFiltro, setObraFiltro] = useState('')
    const [tipoFiltro, setTipoFiltro] = useState('')
    const [busca, setBusca] = useState('')
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Tipo padrão ao fazer upload
    const [tipoUpload, setTipoUpload] = useState('outro')

    async function load(obraId?: string, tipo?: string) {
        let query = supabase.from('documentos_projeto')
            .select('*, obras(nome)')
            .order('created_at', { ascending: false })
        if (obraId) query = query.eq('obra_id', obraId)
        if (tipo) query = query.eq('tipo', tipo)
        const { data } = await query
        setDocumentos(data || [])
    }

    useEffect(() => {
        // Engenheiros: filtra automaticamente pela obra
        const obraInicial = !isDirector && obra ? obra.id : ''
        setObraFiltro(obraInicial)
        load(obraInicial)
        if (isDirector) {
            supabase.from('obras').select('id, nome').then(({ data }) => setObras(data || []))
        }
    }, [obra?.id, isDirector])

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 50 * 1024 * 1024) { setError('Arquivo muito grande. Máximo 50MB.'); return }

        setUploading(true); setError('')
        const { data: { user } } = await supabase.auth.getUser()
        const efetivObraId = obraFiltro || obra?.id || 'geral'
        const path = `${efetivObraId}/documentos/${Date.now()}-${file.name}`

        const { error: uploadError } = await supabase.storage.from('saga-engenharia').upload(path, file)
        if (uploadError) { setError('Erro no upload: ' + uploadError.message); setUploading(false); return }

        const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)

        await supabase.from('documentos_projeto').insert({
            obra_id: efetivObraId !== 'geral' ? efetivObraId : null,
            nome_arquivo: file.name,
            tipo: tipoUpload,
            url_storage: publicUrl,
            tamanho_bytes: file.size,
            uploaded_by: user?.id,
        })

        await load(obraFiltro, tipoFiltro)
        setUploading(false)
        e.target.value = ''
    }

    async function handleDelete(id: string) {
        setDeletingId(id)
        await supabase.from('documentos_projeto').delete().eq('id', id)
        setDocumentos(p => p.filter(d => d.id !== id))
        setDeletingId(null)
    }

    const filtrados = documentos.filter(d => {
        if (busca && !d.nome_arquivo.toLowerCase().includes(busca.toLowerCase())) return false
        return true
    })

    const totalSize = filtrados.reduce((acc, d) => acc + (d.tamanho_bytes || 0), 0)

    return (
        <div style={{ padding: '20px', maxWidth: 800 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(74,144,217,0.15)', border: '1px solid rgba(74,144,217,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} style={{ color: '#4A90D9' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Documentos</h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {filtrados.length} arquivo{filtrados.length !== 1 ? 's' : ''} · {formatSize(totalSize)}
                        </p>
                    </div>
                </div>

                {/* Painel de upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                        <select value={tipoUpload} onChange={e => setTipoUpload(e.target.value)} style={{ padding: '8px 28px 8px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, appearance: 'none', cursor: 'pointer' }}>
                            {TIPOS.map(t => <option key={t} value={t}>{TIPO_CONFIG[t]?.label || t}</option>)}
                        </select>
                        <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #4A90D9, #2C6FAC)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: uploading ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(74,144,217,0.3)' }}>
                        {uploading ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : <><Upload size={14} /> Enviar</>}
                        <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.png,.jpg,.jpeg,.zip,.rar" />
                    </label>
                </div>
            </div>

            {/* ── Filtros ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {/* Busca */}
                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                    <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                        className="input"
                        style={{ paddingLeft: 34 }}
                        placeholder="Buscar documento..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
                </div>
                {/* Tipo */}
                <div style={{ position: 'relative' }}>
                    <select className="input" style={{ paddingRight: 30, minWidth: 120 }} value={tipoFiltro} onChange={e => { setTipoFiltro(e.target.value); load(obraFiltro, e.target.value) }}>
                        <option value="">Todos os tipos</option>
                        {TIPOS.map(t => <option key={t} value={t}>{TIPO_CONFIG[t]?.label || t}</option>)}
                    </select>
                    <ChevronDown size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
                {/* Obra (diretores) */}
                {isDirector && (
                    <div style={{ position: 'relative' }}>
                        <select className="input" style={{ paddingRight: 30, minWidth: 140 }} value={obraFiltro} onChange={e => { setObraFiltro(e.target.value); load(e.target.value, tipoFiltro) }}>
                            <option value="">Todas as obras</option>
                            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </select>
                        <ChevronDown size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                    </div>
                )}
            </div>

            {error && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 13 }}>{error}</div>}

            {/* ── Lista ── */}
            {filtrados.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', borderRadius: 16, border: '1px dashed rgba(74,144,217,0.2)', background: 'rgba(255,255,255,0.01)' }}>
                    <FileText size={48} style={{ margin: '0 auto 14px', display: 'block', color: '#4A90D9', opacity: 0.4 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhum documento</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selecione o tipo e clique em "Enviar" para adicionar</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filtrados.map(doc => {
                        const cfg = TIPO_CONFIG[doc.tipo] || TIPO_CONFIG.outro
                        return (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)', transition: 'all 0.15s' }}>
                                {/* Ícone do tipo de arquivo */}
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cfg.cor }}>
                                    {fileIcon(doc.nome_arquivo)}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                                        {doc.nome_arquivo}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: cfg.bg, color: cfg.cor, fontWeight: 700 }}>
                                            {cfg.label}
                                        </span>
                                        {doc.tamanho_bytes && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatSize(doc.tamanho_bytes)}</span>}
                                        {doc.created_at && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(doc.created_at)}</span>}
                                        {isDirector && doc.obras && <span style={{ fontSize: 11, color: 'rgba(82,168,123,0.8)', fontWeight: 600 }}>{(doc.obras as any).nome}</span>}
                                    </div>
                                </div>

                                {/* Ações */}
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <a
                                        href={doc.url_storage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A90D9' }}
                                    >
                                        <Download size={14} />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        disabled={deletingId === doc.id}
                                        style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}
                                    >
                                        {deletingId === doc.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
