'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import Link from 'next/link'
import { ArrowLeft, Users, Plus, Trash2, Loader2, ChevronDown, CheckCircle, X } from 'lucide-react'

const FUNCOES = ['Engenheiro', 'Supervisor', 'Encarregado', 'Pedreiro', 'Carpinteiro', 'Armador', 'Meio-Oficial', 'Ajudante']

interface Membro {
    id: string
    nome: string
    funcao: string
    ativo: boolean
}

export default function EquipePage() {
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [allObras, setAllObras] = useState<{ id: string; nome: string }[]>([])
    const [obraId, setObraId] = useState(obraCtx?.id || '')
    const [membros, setMembros] = useState<Membro[]>([])
    const [loading, setLoading] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [novoNome, setNovoNome] = useState('')
    const [novaFuncao, setNovaFuncao] = useState('Pedreiro')
    const [error, setError] = useState('')

    useEffect(() => {
        if (isDirector) {
            supabase.from('obras').select('id, nome').order('nome')
                .then(({ data }) => setAllObras(data || []))
        }
    }, [isDirector])

    useEffect(() => {
        if (!obraId) { setLoading(false); return }
        setLoading(true)
        supabase.from('equipe_obra').select('*').eq('obra_id', obraId).order('nome')
            .then(({ data }) => { setMembros((data as Membro[]) || []); setLoading(false) })
    }, [obraId])

    async function adicionarMembro() {
        if (!novoNome.trim()) { setError('Informe o nome.'); return }
        if (!obraId) { setError('Selecione a obra.'); return }
        setSalvando(true); setError('')
        const { data, error: err } = await supabase.from('equipe_obra')
            .insert({ obra_id: obraId, nome: novoNome.trim(), funcao: novaFuncao })
            .select().single()
        if (err) { setError(err.message); setSalvando(false); return }
        setMembros(p => [...p, data as Membro])
        setNovoNome('')
        setSalvando(false)
    }

    async function removerMembro(id: string) {
        await supabase.from('equipe_obra').delete().eq('id', id)
        setMembros(p => p.filter(m => m.id !== id))
    }

    const obraAtual = isDirector ? allObras.find(o => o.id === obraId) : obraCtx

    return (
        <div style={{ padding: '20px', maxWidth: 600 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href="/rdo" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(82,168,123,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} style={{ color: '#52A87B' }} />
                </div>
                <div>
                    <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Cadastro de Equipe</h1>
                    {obraAtual && <p style={{ fontSize: 11, color: '#52A87B' }}>{obraAtual.nome}</p>}
                </div>
            </div>

            {/* Seletor de obra (diretores) */}
            {isDirector && (
                <div style={{ marginBottom: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(82,168,123,0.2)' }}>
                    <label className="form-label">Obra</label>
                    <div style={{ position: 'relative' }}>
                        <select className="input" value={obraId} onChange={e => setObraId(e.target.value)} style={{ appearance: 'none', paddingRight: 40 }}>
                            <option value="">Selecione a obra...</option>
                            {allObras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                    </div>
                </div>
            )}

            {!obraId ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Selecione a obra para gerenciar a equipe.</p>
            ) : (
                <>
                    {/* Adicionar novo membro */}
                    <div style={{ marginBottom: 16, padding: '16px', borderRadius: 16, background: 'rgba(82,168,123,0.05)', border: '1px solid rgba(82,168,123,0.2)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Adicionar Membro</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                            <input
                                className="input"
                                placeholder="Nome completo"
                                value={novoNome}
                                onChange={e => setNovoNome(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarMembro())}
                            />
                            <button
                                onClick={adicionarMembro}
                                disabled={salvando || !novoNome.trim()}
                                style={{ padding: '0 16px', borderRadius: 10, background: 'linear-gradient(135deg,#52A87B,#3d8460)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                            >
                                {salvando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Adicionar
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <select className="input" value={novaFuncao} onChange={e => setNovaFuncao(e.target.value)} style={{ appearance: 'none', paddingRight: 36 }}>
                                {FUNCOES.map(f => <option key={f}>{f}</option>)}
                            </select>
                            <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                        </div>
                        {error && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 8 }}>{error}</p>}
                    </div>

                    {/* Lista de membros */}
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[1, 2, 3].map(i => <div key={i} style={{ height: 54, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }} />)}
                        </div>
                    ) : membros.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', borderRadius: 14, border: '1px dashed rgba(82,168,123,0.2)' }}>
                            <Users size={36} style={{ margin: '0 auto 10px', display: 'block', color: '#52A87B', opacity: 0.4 }} />
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum membro cadastrado ainda</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                                {membros.length} membro{membros.length > 1 ? 's' : ''} cadastrado{membros.length > 1 ? 's' : ''}
                            </p>
                            {membros.map(m => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52A87B', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{m.nome}</span>
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(82,168,123,0.12)', color: '#52A87B', border: '1px solid rgba(82,168,123,0.25)' }}>
                                        {m.funcao}
                                    </span>
                                    <button
                                        onClick={() => removerMembro(m.id)}
                                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
