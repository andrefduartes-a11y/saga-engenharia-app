'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, CheckCircle, XCircle } from 'lucide-react'

interface FVSDetalhe {
    id: string
    data: string
    elemento?: string
    status: string
    responsavel?: string
    observacoes?: string
    verificacoes: { item: string; conforme: boolean }[]
    its?: { codigo: string; nome: string; descricao?: string }
}

const statusColor: Record<string, { bg: string; text: string; label: string }> = {
    aprovado: { bg: 'rgba(16,185,129,0.15)', text: '#10B981', label: 'APROVADO' },
    reprovado: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'REPROVADO' },
    em_andamento: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', label: 'EM ANDAMENTO' },
}

export default function FVSDetalhePage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { obra } = useObra()
    const supabase = createClient()
    const [fvs, setFvs] = useState<FVSDetalhe | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.from('fvs')
            .select('*, its(codigo, nome, descricao)')
            .eq('id', params.id)
            .single()
            .then(({ data }) => { setFvs(data as any); setLoading(false) })
    }, [params.id])

    if (loading) return <div className="px-4 py-4"><div className="card animate-pulse" style={{ height: 200 }} /></div>
    if (!fvs) return <div className="px-4 py-4"><p style={{ color: 'var(--text-muted)' }}>FVS não encontrada.</p></div>

    const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const st = statusColor[fvs.status] || statusColor.em_andamento
    const verificacoes: { item: string; conforme: boolean }[] = Array.isArray(fvs.verificacoes) ? fvs.verificacoes : []
    const aprovados = verificacoes.filter(v => v.conforme).length

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: #1a1a1a !important; }
                    .card { background: white !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; }
                }
            `}</style>

            <div className="px-4 py-4 space-y-4 animate-fade-up">
                {/* Header */}
                <div className="no-print flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <ArrowLeft size={18} /> Voltar
                    </button>
                    <button onClick={() => window.print()}
                        className="btn-secondary py-2 px-4 text-sm min-h-[40px] flex items-center gap-2">
                        <Printer size={16} /> PDF
                    </button>
                </div>

                {/* Cabeçalho do documento */}
                <div style={{ borderBottom: '2px solid var(--green-primary)', paddingBottom: 16 }}>
                    <div className="flex items-start justify-between">
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                SAGA Construtora
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                                Ficha de Verificação de Serviço
                            </div>
                            {obra && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Obra: {obra.nome}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: st.bg, color: st.text }}>
                                {st.label}
                            </span>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{fmt(fvs.data)}</div>
                        </div>
                    </div>
                </div>

                {/* Dados */}
                <div className="card">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {fvs.elemento && (
                            <div className="col-span-2">
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Elemento / Serviço</p>
                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{fvs.elemento}</p>
                            </div>
                        )}
                        {fvs.its && (
                            <div className="col-span-2">
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Instrução de Trabalho (IT)</p>
                                <p style={{ color: 'var(--text-primary)' }}>{(fvs.its as any).codigo} — {(fvs.its as any).nome}</p>
                            </div>
                        )}
                        {fvs.responsavel && (
                            <div>
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Responsável</p>
                                <p style={{ color: 'var(--text-primary)' }}>{fvs.responsavel}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Resultado</p>
                            <p style={{ color: 'var(--text-primary)' }}>{aprovados}/{verificacoes.length} itens conformes</p>
                        </div>
                    </div>
                </div>

                {/* Checklist */}
                {verificacoes.length > 0 && (
                    <div>
                        <h2 className="section-title mb-3">Checklist de Verificação</h2>
                        <div className="card overflow-hidden" style={{ padding: 0 }}>
                            {verificacoes.map((v, i) => (
                                <div key={i} className="flex items-center gap-3"
                                    style={{ padding: '10px 14px', borderBottom: i < verificacoes.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                    {v.conforme
                                        ? <CheckCircle size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                                        : <XCircle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
                                    }
                                    <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{v.item}</span>
                                    <span className="text-xs font-bold" style={{ color: v.conforme ? '#10B981' : '#EF4444' }}>
                                        {v.conforme ? 'OK' : 'NOK'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Observações */}
                {fvs.observacoes && (
                    <div className="card">
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Observações</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fvs.observacoes}</p>
                    </div>
                )}

                {/* Assinatura */}
                <div className="card" style={{ marginTop: 16 }}>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: 4, height: 40 }} />
                            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>Responsável pela Inspeção</p>
                        </div>
                        <div>
                            <div style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: 4, height: 40 }} />
                            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>Responsável Técnico</p>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Documento gerado pelo SAGA Engenharia em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}. Documento de rastreabilidade.
                </div>
            </div>
        </>
    )
}
