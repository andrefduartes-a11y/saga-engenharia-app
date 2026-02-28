'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useObra } from '@/lib/obra-context'
import { ArrowLeft, Printer, TestTube, Plus, Trash2 } from 'lucide-react'

interface Rompimento {
    id: string
    idade_dias: number
    data_rompimento?: string
    mpa?: number
    laboratorio?: string
    observacoes?: string
}

interface Concretagem {
    id: string
    data: string
    fck: number
    volume_m3: number
    elementos_concretados: string[]
    fornecedor?: string
    caminhao?: string
    nota_fiscal?: string
    responsavel?: string
    cor_hex?: string
    rompimentos: Rompimento[]
}

export default function ConcretoDetalhePage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { obra } = useObra()
    const supabase = createClient()
    const [c, setC] = useState<Concretagem | null>(null)
    const [loading, setLoading] = useState(true)
    const [novoRomp, setNovoRomp] = useState({ idade_dias: 7, mpa: '', laboratorio: '', observacoes: '' })
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        supabase
            .from('concretagens')
            .select('*, rompimentos(*)')
            .eq('id', params.id)
            .single()
            .then(({ data }) => { setC(data); setLoading(false) })
    }, [params.id])

    async function addRompimento() {
        if (!c || !novoRomp.mpa) return
        setSalvando(true)
        const { data } = await supabase.from('rompimentos').insert({
            concretagem_id: c.id,
            idade_dias: novoRomp.idade_dias,
            mpa: Number(novoRomp.mpa),
            laboratorio: novoRomp.laboratorio || null,
            observacoes: novoRomp.observacoes || null,
            data_rompimento: new Date().toISOString().split('T')[0],
        }).select().single()
        if (data) setC(prev => prev ? { ...prev, rompimentos: [...prev.rompimentos, data] } : prev)
        setNovoRomp({ idade_dias: 7, mpa: '', laboratorio: '', observacoes: '' })
        setSalvando(false)
    }

    async function removeRompimento(id: string) {
        await supabase.from('rompimentos').delete().eq('id', id)
        setC(prev => prev ? { ...prev, rompimentos: prev.rompimentos.filter(r => r.id !== id) } : prev)
    }

    if (loading) return <div className="px-4 py-4"><div className="card animate-pulse" style={{ height: 200 }} /></div>
    if (!c) return <div className="px-4 py-4"><p style={{ color: 'var(--text-muted)' }}>Concretagem não encontrada.</p></div>

    const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
    const fckOk = (mpa: number) => mpa >= c.fck

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: #1a1a1a !important; }
                    .print-area { padding: 0 !important; }
                    .card { background: white !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; }
                }
            `}</style>

            <div className="px-4 py-4 space-y-4 animate-fade-up print-area">
                {/* Header */}
                <div className="no-print flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <ArrowLeft size={18} /> Voltar
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="btn-secondary py-2 px-4 text-sm min-h-[40px] flex items-center gap-2"
                    >
                        <Printer size={16} /> PDF
                    </button>
                </div>

                {/* Cabeçalho do relatório (visível no print) */}
                <div style={{ borderBottom: '2px solid #7FA653', paddingBottom: 12, marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        SAGA Construtora — Relatório de Concretagem
                    </div>
                    {obra && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Obra: {obra.nome}</div>}
                </div>

                {/* Dados principais */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="w-6 h-6 rounded-full flex-shrink-0"
                            style={{ background: c.cor_hex || '#525F6B', boxShadow: `0 0 10px ${c.cor_hex || '#525F6B'}80` }}
                        />
                        <div>
                            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                FCK {c.fck} MPa — {c.volume_m3} m³
                            </h1>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{fmt(c.data)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {c.elementos_concretados?.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Elementos</p>
                                <p style={{ color: 'var(--text-primary)' }}>{c.elementos_concretados.join(', ')}</p>
                            </div>
                        )}
                        {c.fornecedor && (
                            <div>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Fornecedor</p>
                                <p style={{ color: 'var(--text-primary)' }}>{c.fornecedor}</p>
                            </div>
                        )}
                        {c.caminhao && (
                            <div>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Betoneira/Caminhão</p>
                                <p style={{ color: 'var(--text-primary)' }}>{c.caminhao}</p>
                            </div>
                        )}
                        {c.nota_fiscal && (
                            <div>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Nota Fiscal</p>
                                <p style={{ color: 'var(--text-primary)' }}>{c.nota_fiscal}</p>
                            </div>
                        )}
                        {c.responsavel && (
                            <div>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Responsável</p>
                                <p style={{ color: 'var(--text-primary)' }}>{c.responsavel}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rompimentos */}
                <div>
                    <h2 className="section-title mb-3 flex items-center gap-2">
                        <TestTube size={16} /> Rompimentos de CP
                    </h2>

                    {c.rompimentos.length === 0 ? (
                        <div className="card text-center py-6">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum rompimento lançado</p>
                        </div>
                    ) : (
                        <div className="card overflow-hidden" style={{ padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: 'rgba(127,166,83,0.1)' }}>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>Idade</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>MPa</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>Status</th>
                                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>Lab.</th>
                                        <th className="no-print" style={{ padding: '8px 12px', width: 40 }} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {c.rompimentos.map((r, i) => (
                                        <tr key={r.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                            <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{r.idade_dias}d</td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: r.mpa ? (fckOk(r.mpa) ? '#10B981' : '#EF4444') : 'var(--text-muted)' }}>
                                                {r.mpa ?? '—'}
                                            </td>
                                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                {r.mpa ? (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                                                        background: fckOk(r.mpa) ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                        color: fckOk(r.mpa) ? '#10B981' : '#EF4444',
                                                    }}>
                                                        {fckOk(r.mpa) ? 'APROVADO' : 'REPROVADO'}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 12 }}>
                                                {r.laboratorio || '—'}
                                            </td>
                                            <td className="no-print" style={{ padding: '8px 12px' }}>
                                                <button onClick={() => removeRompimento(r.id)} style={{ color: '#EF4444', opacity: 0.6 }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Adicionar rompimento */}
                    <div className="card mt-3 no-print space-y-3">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>+ Lançar Rompimento</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="form-label">Idade (dias)</label>
                                <select className="input" value={novoRomp.idade_dias} onChange={e => setNovoRomp(p => ({ ...p, idade_dias: Number(e.target.value) }))}>
                                    {[3, 7, 14, 28].map(d => <option key={d} value={d}>{d} dias</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Resistência (MPa)</label>
                                <input className="input" type="number" step="0.1" placeholder="Ex: 28.5"
                                    value={novoRomp.mpa}
                                    onChange={e => setNovoRomp(p => ({ ...p, mpa: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Laboratório</label>
                            <input className="input" placeholder="Nome do laboratório"
                                value={novoRomp.laboratorio}
                                onChange={e => setNovoRomp(p => ({ ...p, laboratorio: e.target.value }))} />
                        </div>
                        <button onClick={addRompimento} disabled={salvando || !novoRomp.mpa} className="btn-primary w-full">
                            {salvando ? 'Salvando...' : 'Lançar'}
                        </button>
                    </div>
                </div>

                {/* Rodapé do relatório */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 8, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Gerado pelo SAGA Engenharia em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
            </div>
        </>
    )
}
