'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import {
    FolderOpen, Download, ChevronRight, ChevronDown,
    Upload, X, Loader2, FileText, FolderPlus, Trash2
} from 'lucide-react'

// ── 13 disciplinas predefinidas ──────────────────────────────────────────────
const DISCIPLINAS_DEFAULT = [
    { nome: 'Arquitetura', emoji: '🏛️', cor: '#9B59B6' },
    { nome: 'Estrutural', emoji: '🏗️', cor: '#E67E22' },
    { nome: 'Fundações', emoji: '⚙️', cor: '#795548' },
    { nome: 'Elétrica', emoji: '⚡', cor: '#F1C40F' },
    { nome: 'Hidrossanitária', emoji: '💧', cor: '#3498DB' },
    { nome: 'AVAC', emoji: '❄️', cor: '#1ABC9C' },
    { nome: 'Prevenção de Incêndio', emoji: '🔥', cor: '#E74C3C' },
    { nome: 'Impermeabilização', emoji: '🛡️', cor: '#607D8B' },
    { nome: 'Paisagismo', emoji: '🌿', cor: '#27AE60' },
    { nome: 'Topografia', emoji: '📐', cor: '#F39C12' },
    { nome: 'Geotécnica', emoji: '🪨', cor: '#8D6E63' },
    { nome: 'Ambiental', emoji: '🌱', cor: '#52A87B' },
    { nome: 'Aprovação / Habite-se', emoji: '📋', cor: '#4A90D9' },
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
    const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})
    const [showNovasPasta, setShowNovaPasta] = useState(false)
    const [showForm] = useState(false) // mantido para evitar erro de ref — não usado na UI
    const [novaPastaNome, setNovaPastaNome] = useState('')
    const [pastasExtras, setPastasExtras] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const todasDisciplinas = [
        ...DISCIPLINAS_DEFAULT.map(d => d.nome),
        ...pastasExtras,
    ]

    useEffect(() => {
        if (!obra) { setLoading(false); return }
        supabase.from('projetos')
            .select('id, disciplina, nome, revisao, vigente, data, download_url')
            .eq('obra_id', obra.id)
            .order('disciplina')
            .then(({ data }) => { setProjetos(data || []); setLoading(false) })
    }, [obra])

    function togglePasta(nome: string) {
        setExpandidos(p => ({ ...p, [nome]: !p[nome] }))
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, disciplina: string) {
        const files = Array.from(e.target.files || [])
        if (!files.length || !obra) return
        setUploading(true)
        for (const file of files) {
            const path = `${obra.id}/projetos/${disciplina}/${Date.now()}-${file.name}`
            const { data: uploaded } = await supabase.storage.from('saga-engenharia').upload(path, file, { cacheControl: '3600' })
            if (uploaded) {
                const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
                const { data } = await supabase.from('projetos').insert({
                    obra_id: obra.id, disciplina,
                    nome: file.name.replace(/\.[^.]+$/, ''),
                    revisao: 'R00', vigente: true, download_url: publicUrl,
                }).select().single()
                if (data) {
                    setProjetos(p => [...p, data])
                    setExpandidos(p => ({ ...p, [disciplina]: true }))
                }
            }
        }
        setUploading(false)
        e.target.value = ''
    }


    async function deleteProjeto(id: string) {
        await supabase.from('projetos').delete().eq('id', id)
        setProjetos(p => p.filter(x => x.id !== id))
    }

    function adicionarPasta() {
        const nome = novaPastaNome.trim()
        if (!nome || todasDisciplinas.includes(nome)) return
        setPastasExtras(p => [...p, nome])
        setExpandidos(p => ({ ...p, [nome]: true }))
        setNovaPastaNome('')
        setShowNovaPasta(false)
    }

    const porDisciplina = (disc: string) => projetos.filter(p => p.disciplina === disc)
    const total = projetos.length
    const discComProjetos = new Set(projetos.map(p => p.disciplina)).size

    return (
        <div style={{ padding: '20px', maxWidth: 800 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(155,89,182,0.15)', border: '1px solid rgba(155,89,182,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FolderOpen size={20} style={{ color: '#9B59B6' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Projetos</h1>
                        {obra && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{obra.nome} · {total} arquivo{total !== 1 ? 's' : ''} em {discComProjetos} disciplina{discComProjetos !== 1 ? 's' : ''}</p>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setShowNovaPasta(p => !p)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.25)', color: '#9B59B6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                        <FolderPlus size={13} /> Nova Pasta
                    </button>
                </div>
            </div>

            {/* ── Form nova pasta ── */}
            {showNovasPasta && (
                <div style={{ marginBottom: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(155,89,182,0.06)', border: '1px solid rgba(155,89,182,0.2)', display: 'flex', gap: 8 }}>
                    <input
                        autoFocus
                        className="input"
                        style={{ flex: 1 }}
                        placeholder="Nome da nova pasta / disciplina"
                        value={novaPastaNome}
                        onChange={e => setNovaPastaNome(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && adicionarPasta()}
                    />
                    <button onClick={adicionarPasta} disabled={!novaPastaNome.trim()} style={{ padding: '0 16px', borderRadius: 10, background: '#9B59B6', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Criar</button>
                    <button onClick={() => setShowNovaPasta(false)} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><X size={14} /></button>
                </div>
            )}


            {!obra ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', borderRadius: 16, border: '1px dashed rgba(155,89,182,0.2)' }}>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Selecione uma obra para ver os projetos</p>
                </div>
            ) : loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={22} className="animate-spin" style={{ color: '#9B59B6' }} /></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {todasDisciplinas.map(disc => {
                        const itens = porDisciplina(disc)
                        const meta = DISCIPLINAS_DEFAULT.find(d => d.nome === disc)
                        const cor = meta?.cor || '#9B59B6'
                        const emoji = meta?.emoji || '📁'
                        const aberto = !!expandidos[disc]
                        const isCustom = !DISCIPLINAS_DEFAULT.find(d => d.nome === disc)

                        return (
                            <div key={disc} style={{ borderRadius: 14, border: `1px solid ${aberto ? `${cor}33` : 'var(--border-subtle)'}`, overflow: 'hidden', background: aberto ? `${cor}08` : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
                                {/* Cabeçalho da pasta */}
                                <div
                                    onClick={() => togglePasta(disc)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                                >
                                    <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: aberto ? cor : 'var(--text-primary)' }}>{disc}</span>
                                        {isCustom && <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom</span>}
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>
                                        {itens.length > 0 ? `${itens.length} arquivo${itens.length !== 1 ? 's' : ''}` : 'vazia'}
                                    </span>
                                    {/* Botão upload rápido na pasta */}
                                    <label
                                        title="Enviar arquivo para esta pasta"
                                        onClick={e => e.stopPropagation()}
                                        style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${cor}33`, background: `${cor}11`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        {uploading ? <Loader2 size={12} className="animate-spin" style={{ color: cor }} /> : <Upload size={12} style={{ color: cor }} />}
                                        <input type="file" multiple style={{ display: 'none' }} accept=".pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.png,.jpg" onChange={e => handleFileUpload(e, disc)} />
                                    </label>
                                    {aberto ? <ChevronDown size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                                </div>

                                {/* Conteúdo da pasta */}
                                {aberto && (
                                    <div style={{ borderTop: `1px solid ${cor}20`, padding: '8px 8px 8px 12px' }}>
                                        {itens.length === 0 ? (
                                            <div style={{ padding: '16px 8px', textAlign: 'center' }}>
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pasta vazia — toque no ⬆️ para enviar arquivos (múltiplos permitidos)</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {itens.map(p => (
                                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.15s' }}>
                                                        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <FileText size={16} style={{ color: cor }} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</p>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: `${cor}18`, color: cor, fontWeight: 700 }}>{p.revisao}</span>
                                                                {!p.vigente && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>arquivado</span>}
                                                                {p.vigente && <span style={{ fontSize: 9, color: '#52A87B', fontWeight: 600 }}>● vigente</span>}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                                            {p.download_url && (
                                                                <a href={p.download_url} target="_blank" rel="noopener noreferrer" style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(74,144,217,0.12)', border: '1px solid rgba(74,144,217,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A90D9' }}>
                                                                    <Download size={14} />
                                                                </a>
                                                            )}
                                                            <button onClick={() => deleteProjeto(p.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
