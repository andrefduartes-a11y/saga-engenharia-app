'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useObra } from '@/lib/obra-context'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Trash2, CheckCircle2, XCircle, Search, X, BookOpen, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface Verificacao { item: string; descricao: string; tolerancia: string }
interface IT {
    codigo: string
    titulo: string
    revisao: string
    categoria: string
    subcategoria: string
    verificacoes: Verificacao[]
}
interface CheckItem { item: string; conforme: boolean; observacao: string }
interface ObraSimples { id: string; nome: string }

export default function NovaFVS() {
    const router = useRouter()
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    // Director obra selector
    const [allObras, setAllObras] = useState<ObraSimples[]>([])
    const [selectedObraId, setSelectedObraId] = useState('')
    const obraId = isDirector ? selectedObraId : obraCtx?.id

    // IT list
    const [its, setITs] = useState<IT[]>([])
    const [itsLoading, setItsLoading] = useState(true)
    const [itSearch, setItSearch] = useState('')
    const [selectedIT, setSelectedIT] = useState<IT | null>(null)
    const [showITPicker, setShowITPicker] = useState(false)

    // Form state
    const today = new Date().toISOString().split('T')[0]
    const [data, setData] = useState(today)
    const [servicoInspecionado, setServico] = useState('')
    const [localTrecho, setLocal] = useState('')
    const [responsavel, setResponsavel] = useState('')
    const [status, setStatus] = useState('em_andamento')
    const [observacoes, setObservacoes] = useState('')
    const [itens, setItens] = useState<CheckItem[]>([{ item: '', conforme: true, observacao: '' }])

    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isDirector) return
        supabase.from('obras').select('id, nome').eq('status', 'ativa').order('nome')
            .then(({ data }) => setAllObras(data || []))
    }, [isDirector])

    useEffect(() => {
        fetch('/its_construcao.json')
            .then(r => r.json())
            .then((data: IT[]) => { setITs(data); setItsLoading(false) })
            .catch(() => setItsLoading(false))
    }, [])

    // Filter ITs by search
    const filteredITs = useMemo(() => {
        const q = itSearch.toLowerCase()
        if (!q) return its
        return its.filter(it =>
            it.codigo.toLowerCase().includes(q) ||
            it.titulo.toLowerCase().includes(q) ||
            it.subcategoria.toLowerCase().includes(q)
        )
    }, [its, itSearch])

    // When an IT is selected, auto-populate checklist
    function selectIT(it: IT) {
        setSelectedIT(it)
        setServico(it.titulo)
        if (it.verificacoes.length > 0) {
            setItens(it.verificacoes.map(v => ({
                item: v.item + (v.tolerancia ? ` (${v.tolerancia})` : ''),
                conforme: true,
                observacao: v.descricao || ''
            })))
        }
        setShowITPicker(false)
        setItSearch('')
    }

    function addItem() {
        setItens(p => [...p, { item: '', conforme: true, observacao: '' }])
    }
    function removeItem(i: number) {
        setItens(p => p.filter((_, idx) => idx !== i))
    }
    function updateItem(i: number, field: keyof CheckItem, value: any) {
        setItens(p => p.map((it, idx) => idx === i ? { ...it, [field]: value } : it))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        if (!obraId) { setError('Selecione uma obra.'); return }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const finalChecks = itens.filter(v => v.item.trim() !== '')
        const { error: dbErr } = await supabase.from('fvs').insert({
            obra_id: obraId,
            data,
            servico_inspecionado: servicoInspecionado,
            local_trecho: localTrecho,
            verificacoes: finalChecks,
            status,
            responsavel: responsavel || null,
            observacoes: observacoes || null,
            created_by: user?.id,
        })
        if (dbErr) { setError(`Erro ao salvar: ${dbErr.message}`); setSaving(false); return }
        router.push('/inspecoes')
        router.refresh()
    }

    const conformes = itens.filter(i => i.conforme && i.item).length
    const total = itens.filter(i => i.item).length

    return (
        <div style={{ padding: '20px', maxWidth: 700 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href="/inspecoes" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>Nova FVS</h1>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Ficha de Verificação de Serviço</p>
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Dados Gerais ── */}
                <div style={{ padding: '18px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Dados Gerais</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Director: obra selector */}
                        {isDirector && (
                            <div>
                                <label className="form-label">Obra *</label>
                                <div style={{ position: 'relative' }}>
                                    <select className="input" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} style={{ appearance: 'none', paddingRight: 40 }} required>
                                        <option value="">Selecione a obra...</option>
                                        {allObras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="form-label">Data da Inspeção *</label>
                                <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} required />
                            </div>
                            <div>
                                <label className="form-label">Status Final</label>
                                <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="em_andamento">Em Andamento</option>
                                    <option value="aprovado">Aprovado</option>
                                    <option value="reprovado">Reprovado</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Local / Trecho *</label>
                            <input className="input" placeholder="Ex: Bloco A – 2º Pavimento" value={localTrecho} onChange={e => setLocal(e.target.value)} required />
                        </div>

                        <div>
                            <label className="form-label">Responsável Técnico</label>
                            <input className="input" placeholder="Nome do inspetor" value={responsavel} onChange={e => setResponsavel(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* ── Instrução de Trabalho (IT) ── */}
                <div style={{ padding: '18px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,168,67,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Instrução de Trabalho</p>
                        <button type="button" onClick={() => setShowITPicker(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: showITPicker ? 'rgba(255,255,255,0.06)' : 'rgba(212,168,67,0.12)', border: `1px solid ${showITPicker ? 'var(--border-subtle)' : 'rgba(212,168,67,0.3)'}`, color: showITPicker ? 'var(--text-muted)' : '#D4A843', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <BookOpen size={12} /> {showITPicker ? <><X size={11} /> Fechar</> : 'Selecionar IT'}
                        </button>
                    </div>

                    {/* IT selected info */}
                    {selectedIT && (
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)', marginBottom: showITPicker ? 12 : 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 40, height: 36, borderRadius: 8, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: '#D4A843' }}>{selectedIT.codigo}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedIT.titulo}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{selectedIT.subcategoria} · {selectedIT.verificacoes.length} itens carregados</div>
                            </div>
                            <button type="button" onClick={() => setSelectedIT(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
                        </div>
                    )}

                    {/* IT picker */}
                    {showITPicker && (
                        <div style={{ marginTop: 10 }}>
                            <div style={{ position: 'relative', marginBottom: 10 }}>
                                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                <input
                                    value={itSearch}
                                    onChange={e => setItSearch(e.target.value)}
                                    placeholder="Buscar IT por código, título ou subcategoria..."
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 30px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
                                    autoFocus
                                />
                            </div>
                            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {itsLoading ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Carregando ITs...</div>
                                ) : filteredITs.length === 0 ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Nenhuma IT encontrada</div>
                                ) : filteredITs.slice(0, 40).map(it => (
                                    <button key={it.codigo} type="button" onClick={() => selectIT(it)}
                                        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: selectedIT?.codigo === it.codigo ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selectedIT?.codigo === it.codigo ? 'rgba(212,168,67,0.35)' : 'var(--border-subtle)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.1s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,67,0.08)'; e.currentTarget.style.borderColor = 'rgba(212,168,67,0.3)' }}
                                        onMouseLeave={e => { if (selectedIT?.codigo !== it.codigo) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border-subtle)' } }}
                                    >
                                        <span style={{ fontSize: 9, fontWeight: 800, color: '#D4A843', background: 'rgba(212,168,67,0.15)', padding: '3px 7px', borderRadius: 5, whiteSpace: 'nowrap' }}>{it.codigo}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.titulo}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{it.subcategoria} · {it.verificacoes.length} itens</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Serviço inspecionado (auto-filled from IT but editable) */}
                    <div style={{ marginTop: 14 }}>
                        <label className="form-label">Serviço Inspecionado *</label>
                        <input className="input" placeholder="Ex: Concretagem de Laje" value={servicoInspecionado} onChange={e => setServico(e.target.value)} required />
                        {selectedIT && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Preenchido automaticamente pela IT selecionada. Edite se necessário.</p>}
                    </div>
                </div>

                {/* ── Checklist ── */}
                <div style={{ padding: '18px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(52,152,219,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#3498DB', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Itens de Verificação</p>
                            {total > 0 && (
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                    {conformes}/{total} conformes
                                    {total > 0 && <span style={{ marginLeft: 6, color: conformes === total ? '#10B981' : '#F59E0B', fontWeight: 700 }}>({Math.round(conformes / total * 100)}%)</span>}
                                </p>
                            )}
                        </div>
                        <button type="button" onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: 'rgba(52,152,219,0.12)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498DB', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            + Adicionar item
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {itens.map((check, idx) => (
                            <div key={idx} style={{ padding: '12px 14px', borderRadius: 12, background: check.conforme ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${check.conforme ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, transition: 'all 0.15s' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    {/* Conforme toggle */}
                                    <button type="button" onClick={() => updateItem(idx, 'conforme', !check.conforme)}
                                        style={{ flexShrink: 0, marginTop: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: check.conforme ? '#10B981' : '#EF4444' }}>
                                        {check.conforme ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                    </button>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <input
                                            className="input"
                                            style={{ minHeight: 'unset', padding: '7px 10px', fontSize: 13 }}
                                            placeholder="Descreva o item verificado..."
                                            value={check.item}
                                            onChange={e => updateItem(idx, 'item', e.target.value)}
                                        />
                                        {check.observacao && (
                                            <input
                                                className="input"
                                                style={{ minHeight: 'unset', padding: '6px 10px', fontSize: 11, color: 'var(--text-muted)' }}
                                                placeholder="Observação / tolerância..."
                                                value={check.observacao}
                                                onChange={e => updateItem(idx, 'observacao', e.target.value)}
                                            />
                                        )}
                                        {!check.observacao && (
                                            <button type="button" onClick={() => updateItem(idx, 'observacao', ' ')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                                                + tolerância/observação
                                            </button>
                                        )}
                                    </div>

                                    {itens.length > 1 && (
                                        <button type="button" onClick={() => removeItem(idx)} style={{ flexShrink: 0, marginTop: 2, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Observações ── */}
                <div style={{ padding: '18px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <label className="form-label" style={{ marginBottom: 10 }}>Observações Gerais</label>
                    <textarea className="input" rows={3} placeholder="Anotações adicionais sobre a inspeção..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />
                </div>

                {/* Submit */}
                <button type="submit" disabled={saving || !obraId} style={{ padding: '12px', borderRadius: 12, background: obraId ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.06)', border: 'none', color: obraId ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: obraId ? 'pointer' : 'not-allowed', boxShadow: obraId ? '0 4px 16px rgba(16,185,129,0.3)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : '✅ Salvar FVS'}
                </button>
            </form>
        </div>
    )
}
