'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import {
    FolderOpen, FolderPlus, ChevronRight, ChevronDown,
    Upload, Loader2, FileText, Trash2, Download, Plus, X, Building2
} from 'lucide-react'

// ── 14 disciplinas com numeração exata ──────────────────────────────────────
const DISCIPLINAS_DEFAULT = [
    { num: '01', nome: 'ARQUITETURA', cor: '#9B59B6', emoji: '🏛️' },
    { num: '02', nome: 'CONTENÇÃO', cor: '#E67E22', emoji: '⚒️' },
    { num: '03', nome: 'FUNDAÇÃO', cor: '#795548', emoji: '🏗️' },
    { num: '04', nome: 'ESTRUTURA', cor: '#607D8B', emoji: '🔩' },
    { num: '05', nome: 'HIDRÁULICA', cor: '#2196F3', emoji: '💧' },
    { num: '06', nome: 'ELÉTRICA', cor: '#F1C40F', emoji: '⚡' },
    { num: '07', nome: 'SPDA', cor: '#FF5722', emoji: '⚡' },
    { num: '08', nome: 'TELECOM', cor: '#00BCD4', emoji: '📡' },
    { num: '09', nome: 'AQUECIMENTO', cor: '#FF7043', emoji: '🔥' },
    { num: '10', nome: 'PROTEÇÃO E COMBATE À INCÊNDIO (PCI)', cor: '#E53935', emoji: '🚒' },
    { num: '11', nome: 'GÁS', cor: '#26A69A', emoji: '🔵' },
    { num: '12', nome: 'AR CONDICIONADO', cor: '#42A5F5', emoji: '❄️' },
    { num: '14', nome: 'INTERIORES', cor: '#AB47BC', emoji: '🛋️' },
    { num: '15', nome: 'IMAGENS', cor: '#66BB6A', emoji: '🖼️' },
]

type Arquivo = {
    id: string
    nome: string
    revisao: string
    download_url: string | null
    disciplina: string
    subpasta: string | null
    vigente: boolean
}

export default function ProjetosPage() {
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    // Director picks obra in-page
    const [allObras, setAllObras] = useState<{ id: string; nome: string }[]>([])
    const [selectedObraId, setSelectedObraId] = useState('')
    const obra = isDirector
        ? (allObras.find(o => o.id === selectedObraId) || null)
        : obraCtx

    useEffect(() => {
        if (!isDirector) return
        supabase.from('obras').select('id, nome').order('nome')
            .then(({ data }) => setAllObras(data || []))
    }, [isDirector])

    const [arquivos, setArquivos] = useState<Arquivo[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Expansão de pastas e subpastas
    const [abertas, setAbertas] = useState<Record<string, boolean>>({})
    const [abertasSub, setAbertasSub] = useState<Record<string, boolean>>({})

    // Pastas extras (disciplinas customizadas)
    const [pastasExtras, setPastasExtras] = useState<{ num: string; nome: string; cor: string; emoji: string }[]>([])
    const [showNovaPasta, setShowNovaPasta] = useState(false)
    const [novaPastaNome, setNovaPastaNome] = useState('')

    // Subpastas extras por disciplina (incluindo as vazias criadas pelo usuário)
    // chave: `${num}-${nome_disciplina}`, valor: lista de nomes de subpastas
    const [subpastasExtras, setSubpastasExtras] = useState<Record<string, string[]>>({})
    const [showNovaSubpasta, setShowNovaSubpasta] = useState<string | null>(null)
    const [novaSubpastaNome, setNovaSubpastaNome] = useState('')

    // Selecionar subpasta no upload
    const [uploadTarget, setUploadTarget] = useState<{ disc: string; sub: string | null } | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!obra) { setArquivos([]); return }
        setLoading(true)
        supabase.from('projetos')
            .select('id, nome, revisao, download_url, disciplina, subpasta, vigente')
            .eq('obra_id', obra.id)
            .order('disciplina')
            .then(({ data }) => { setArquivos(data || []); setLoading(false) })
    }, [obra?.id])

    const todasDisciplinas = [
        ...DISCIPLINAS_DEFAULT,
        ...pastasExtras,
    ]

    // ── helpers ──────────────────────────────────────────────────────────────
    function discKey(disc: { num: string; nome: string }) {
        return `${disc.num}-${disc.nome}`
    }

    function togglePasta(key: string) {
        setAbertas(p => ({ ...p, [key]: !p[key] }))
    }

    function toggleSub(key: string) {
        setAbertasSub(p => ({ ...p, [key]: !p[key] }))
    }

    // arquivos desta disciplina, opcionalmente filtrados por subpasta
    function arquivosDe(discNome: string, sub: string | null) {
        return arquivos.filter(a =>
            a.disciplina === discNome &&
            (sub === null ? !a.subpasta : a.subpasta === sub)
        )
    }

    // subpastas existentes nos arquivos desta disciplina + extras criadas
    function subpastasDisc(key: string, discNome: string) {
        const dasDB = Array.from(new Set(
            arquivos
                .filter(a => a.disciplina === discNome && a.subpasta)
                .map(a => a.subpasta as string)
        ))
        const extras = subpastasExtras[key] || []
        return Array.from(new Set([...dasDB, ...extras]))
    }

    // ── upload ───────────────────────────────────────────────────────────────
    function triggerUpload(disc: string, sub: string | null) {
        setUploadTarget({ disc, sub })
        fileRef.current?.click()
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || [])
        if (!files.length || !obra || !uploadTarget) return
        setUploading(true)
        for (const file of files) {
            const subPath = uploadTarget.sub ? `/${uploadTarget.sub}` : ''
            const path = `${obra.id}/projetos/${uploadTarget.disc}${subPath}/${Date.now()}-${file.name}`
            const { data: uploaded } = await supabase.storage
                .from('saga-engenharia').upload(path, file, { cacheControl: '3600' })
            if (uploaded) {
                const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
                const { data } = await supabase.from('projetos').insert({
                    obra_id: obra.id,
                    disciplina: uploadTarget.disc,
                    subpasta: uploadTarget.sub || null,
                    nome: file.name.replace(/\.[^.]+$/, ''),
                    revisao: 'R00', vigente: true, download_url: publicUrl,
                }).select().single()
                if (data) setArquivos(p => [...p, data])
            }
        }
        setUploading(false)
        setUploadTarget(null)
        e.target.value = ''
    }

    // ── delete ────────────────────────────────────────────────────────────────
    async function deleteArquivo(id: string) {
        await supabase.from('projetos').delete().eq('id', id)
        setArquivos(p => p.filter(a => a.id !== id))
    }

    // ── nova pasta ────────────────────────────────────────────────────────────
    function adicionarPasta() {
        const nome = novaPastaNome.trim().toUpperCase()
        if (!nome) return
        const num = String(DISCIPLINAS_DEFAULT.length + pastasExtras.length + 1).padStart(2, '0')
        setPastasExtras(p => [...p, { num, nome, cor: '#78909C', emoji: '📁' }])
        setNovaPastaNome('')
        setShowNovaPasta(false)
    }

    // ── nova subpasta ─────────────────────────────────────────────────────────
    function adicionarSubpasta(key: string) {
        const nome = novaSubpastaNome.trim()
        if (!nome) return
        setSubpastasExtras(p => ({ ...p, [key]: [...(p[key] || []), nome] }))
        setAbertasSub(p => ({ ...p, [`${key}::${nome}`]: false }))
        setNovaSubpastaNome('')
        setShowNovaSubpasta(null)
    }

    const total = arquivos.length

    return (
        <div style={{ padding: '20px', maxWidth: 840 }}>
            {/* Hidden file input */}
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }}
                accept=".pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.rvt,.ifc"
                onChange={handleFileUpload} />

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(155,89,182,0.15)', border: '1px solid rgba(155,89,182,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FolderOpen size={20} style={{ color: '#9B59B6' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Projetos</h1>
                        {obra && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{obra.nome} · {total} arquivo{total !== 1 ? 's' : ''}</p>}
                    </div>
                </div>
                <button
                    onClick={() => setShowNovaPasta(p => !p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.25)', color: '#9B59B6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                    <FolderPlus size={13} /> Nova Pasta
                </button>
            </div>

            {/* ── Form nova pasta ── */}
            {showNovaPasta && (
                <div style={{ marginBottom: 14, padding: '12px 16px', borderRadius: 14, background: 'rgba(155,89,182,0.06)', border: '1px solid rgba(155,89,182,0.2)', display: 'flex', gap: 8 }}>
                    <input
                        autoFocus className="input"
                        placeholder="Nome da pasta (ex: SINALIZAÇÃO)"
                        value={novaPastaNome}
                        onChange={e => setNovaPastaNome(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && adicionarPasta()}
                        style={{ flex: 1 }}
                    />
                    <button onClick={adicionarPasta} style={{ padding: '8px 14px', borderRadius: 10, background: '#9B59B6', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Criar</button>
                    <button onClick={() => { setShowNovaPasta(false); setNovaPastaNome('') }} style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                </div>
            )}

            {/* ── Seletor de obra (diretor/admin) ── */}
            {isDirector && (
                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                        <Building2 size={11} /> Obra
                    </label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedObraId}
                            onChange={e => { setSelectedObraId(e.target.value); setArquivos([]) }}
                            style={{
                                width: '100%', boxSizing: 'border-box', appearance: 'none',
                                padding: '11px 40px 11px 14px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
                                color: selectedObraId ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontSize: 13, outline: 'none', cursor: 'pointer',
                            }}
                        >
                            <option value="">Selecione uma obra para visualizar...</option>
                            {allObras.map(o => (
                                <option key={o.id} value={o.id}>{o.nome}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>
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
                        const key = discKey(disc)
                        const aberta = !!abertas[key]
                        const subs = subpastasDisc(key, disc.nome)
                        const arquivosRaiz = arquivosDe(disc.nome, null)
                        const totalDisc = arquivos.filter(a => a.disciplina === disc.nome).length

                        return (
                            <div key={key} style={{ borderRadius: 14, border: `1px solid ${aberta ? `${disc.cor}33` : 'var(--border-subtle)'}`, overflow: 'hidden', background: aberta ? `${disc.cor}06` : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>

                                {/* ── Cabeçalho da pasta principal ── */}
                                <div
                                    onClick={() => togglePasta(key)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                                >
                                    <span style={{ fontSize: 18, flexShrink: 0 }}>{disc.emoji}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <span style={{ color: disc.cor, marginRight: 6, fontSize: 11 }}>{disc.num}</span>
                                            {disc.nome}
                                        </p>
                                        {totalDisc > 0 && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{totalDisc} arquivo{totalDisc !== 1 ? 's' : ''}{subs.length > 0 ? ` · ${subs.length} subpasta${subs.length !== 1 ? 's' : ''}` : ''}</p>}
                                    </div>
                                    {/* Botão upload na raiz da pasta */}
                                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
                                        {uploading && uploadTarget?.disc === disc.nome && !uploadTarget.sub
                                            ? <Loader2 size={14} style={{ color: disc.cor, animation: 'spin 1s linear infinite' }} />
                                            : <button onClick={() => triggerUpload(disc.nome, null)} title="Enviar para raiz" style={{ padding: '4px 8px', borderRadius: 7, background: `${disc.cor}15`, border: `1px solid ${disc.cor}33`, color: disc.cor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                                                <Upload size={11} /> Enviar
                                            </button>
                                        }
                                        <button onClick={() => { setShowNovaSubpasta(key); setNovaSubpastaNome(''); setAbertas(p => ({ ...p, [key]: true })) }} title="Nova subpasta" style={{ padding: '4px 7px', borderRadius: 7, background: `${disc.cor}15`, border: `1px solid ${disc.cor}33`, color: disc.cor, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <FolderPlus size={11} />
                                        </button>
                                    </div>
                                    {aberta ? <ChevronDown size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                                </div>

                                {/* ── Conteúdo da pasta ── */}
                                {aberta && (
                                    <div style={{ borderTop: `1px solid ${disc.cor}20`, padding: '8px 12px 12px' }}>

                                        {/* Form nova subpasta */}
                                        {showNovaSubpasta === key && (
                                            <div style={{ marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <input
                                                    autoFocus className="input"
                                                    placeholder="Nome da subpasta"
                                                    value={novaSubpastaNome}
                                                    onChange={e => setNovaSubpastaNome(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && adicionarSubpasta(key)}
                                                    style={{ flex: 1, height: 34, fontSize: 12 }}
                                                />
                                                <button onClick={() => adicionarSubpasta(key)} style={{ padding: '6px 12px', borderRadius: 8, background: disc.cor, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Criar</button>
                                                <button onClick={() => setShowNovaSubpasta(null)} style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={12} /></button>
                                            </div>
                                        )}

                                        {/* ── Subpastas ── */}
                                        {subs.map(sub => {
                                            const subKey = `${key}::${sub}`
                                            const subAberta = !!abertasSub[subKey]
                                            const arquivosSub = arquivosDe(disc.nome, sub)
                                            return (
                                                <div key={sub} style={{ marginBottom: 4, borderRadius: 10, border: `1px solid ${disc.cor}20`, overflow: 'hidden', background: subAberta ? `${disc.cor}04` : 'transparent' }}>
                                                    <div
                                                        onClick={() => toggleSub(subKey)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', userSelect: 'none' }}
                                                    >
                                                        <span style={{ fontSize: 13 }}>📂</span>
                                                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{sub}</span>
                                                        {arquivosSub.length > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{arquivosSub.length} arq.</span>}
                                                        <div onClick={e => e.stopPropagation()}>
                                                            <button onClick={() => triggerUpload(disc.nome, sub)} title="Enviar para esta subpasta" style={{ padding: '3px 8px', borderRadius: 6, background: `${disc.cor}15`, border: `1px solid ${disc.cor}33`, color: disc.cor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600 }}>
                                                                {uploading && uploadTarget?.disc === disc.nome && uploadTarget.sub === sub ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={10} />} Enviar
                                                            </button>
                                                        </div>
                                                        {subAberta ? <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />}
                                                    </div>
                                                    {subAberta && (
                                                        <div style={{ borderTop: `1px solid ${disc.cor}15`, padding: '6px 10px' }}>
                                                            <ArquivosList arquivos={arquivosSub} cor={disc.cor} onDelete={deleteArquivo} />
                                                            {arquivosSub.length === 0 && <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 4px' }}>Subpasta vazia — toque em Enviar acima</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}

                                        {/* ── Arquivos na raiz da disciplina ── */}
                                        {arquivosRaiz.length > 0 && (
                                            <div style={{ marginTop: subs.length > 0 ? 8 : 0 }}>
                                                {subs.length > 0 && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, paddingLeft: 4 }}>Raiz</p>}
                                                <ArquivosList arquivos={arquivosRaiz} cor={disc.cor} onDelete={deleteArquivo} />
                                            </div>
                                        )}

                                        {subs.length === 0 && arquivosRaiz.length === 0 && (
                                            <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 4px', textAlign: 'center' }}>
                                                Pasta vazia — envie arquivos ou crie subpastas com 📁+
                                            </p>
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

// ── Componente de lista de arquivos ─────────────────────────────────────────
function ArquivosList({ arquivos, cor, onDelete }: { arquivos: Arquivo[]; cor: string; onDelete: (id: string) => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {arquivos.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={14} style={{ color: cor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</p>
                        <div style={{ display: 'flex', gap: 5, marginTop: 1 }}>
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 99, background: `${cor}18`, color: cor, fontWeight: 700 }}>{a.revisao}</span>
                            {a.vigente && <span style={{ fontSize: 9, color: '#52A87B', fontWeight: 600 }}>● vigente</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                        {a.download_url && (
                            <a href={a.download_url} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(74,144,217,0.12)', border: '1px solid rgba(74,144,217,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A90D9' }}>
                                <Download size={12} />
                            </a>
                        )}
                        <button onClick={() => onDelete(a.id)} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}>
                            <Trash2 size={11} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
