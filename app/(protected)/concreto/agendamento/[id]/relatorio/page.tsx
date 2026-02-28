'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Printer, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Rastreabilidade {
    id: string
    identificacao_pecas: string
    area_pavto?: string
    cor_hex?: string
    quantidade_m3?: number
    fck_projeto?: number
    usinado: boolean
    nota_transporte?: string
    placa_caminhao?: string
    horario_chegada?: string
    horario_inicio?: string
    horario_final?: string
    horario_moldagem_cp?: string
    slump?: number
    rompimento_3?: number
    rompimento_7?: number
    rompimento_28a?: number
    rompimento_28b?: number
    conforme?: boolean | null
    responsavel?: string
}

interface Agendamento {
    id: string
    data_agendada: string
    elemento?: string
    volume_estimado?: number
    fck_previsto?: number
    foto_mapa_url?: string
    obras?: { nome: string }
}

const fmtDate = (d: string) => new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const fmtTime = (t?: string) => t ? t.slice(0, 5) : '—'
const fmtNum = (v?: number) => v != null ? v : '—'

export default function RelatorioRastreabilidadePage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const [ag, setAg] = useState<Agendamento | null>(null)
    const [rastrs, setRastrs] = useState<Rastreabilidade[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            supabase.from('concretagens_agendadas').select('*, obras(nome)').eq('id', params.id).single(),
            supabase.from('rastreabilidade_concreto')
                .select('id, identificacao_pecas, area_pavto, cor_hex, quantidade_m3, fck_projeto, usinado, nota_transporte, placa_caminhao, horario_chegada, horario_inicio, horario_final, horario_moldagem_cp, slump, rompimento_3, rompimento_7, rompimento_28a, rompimento_28b, conforme, responsavel')
                .eq('agendamento_id', params.id)
                .order('created_at', { ascending: true }),
        ]).then(([{ data: a }, { data: r }]) => {
            setAg(a as any)
            setRastrs(r || [])
            setLoading(false)
        })
    }, [params.id])

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
    if (!ag) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Não encontrado.</div>

    const obraName = (ag.obras as any)?.nome || ''
    const totalM3 = rastrs.reduce((s, r) => s + (r.quantidade_m3 || 0), 0)
    const todosConformes = rastrs.filter(r => r.conforme != null)
    const aprovados = todosConformes.filter(r => r.conforme === true).length

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: #1a1a1a !important; font-size: 11px; }
                    .print-page { padding: 0 !important; max-width: 100% !important; }
                    table { font-size: 10px; }
                    th, td { padding: 5px 6px !important; }
                }
            `}</style>

            <div className="print-page" style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>

                {/* Controles — ocultos no print */}
                <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                    <Link href={`/concreto/agendamento/${params.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13 }}>
                        <ArrowLeft size={16} /> Voltar
                    </Link>
                    <button onClick={() => window.print()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#10B981,#0d9466)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                        <Printer size={15} /> Imprimir / Salvar PDF
                    </button>
                </div>

                {/* Cabeçalho do relatório */}
                <div style={{ borderBottom: '3px solid #7FA653', paddingBottom: 14, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                                SAGA Construtora — Relatório de Rastreabilidade de Concreto
                            </div>
                            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                {ag.elemento || 'Concretagem'}
                            </h1>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                                {obraName} · {fmtDate(ag.data_agendada)}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total lançado: <strong>{totalM3.toFixed(2)} m³</strong></div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Caminhões: <strong>{rastrs.length}</strong></div>
                            {ag.fck_previsto && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>FCK aprovado: <strong>{ag.fck_previsto} MPa</strong></div>}
                            {todosConformes.length > 0 && (
                                <div style={{ fontSize: 11, marginTop: 4, fontWeight: 700, color: aprovados === todosConformes.length ? '#10B981' : '#EF4444' }}>
                                    {aprovados === todosConformes.length ? '✅' : '⚠️'} {aprovados}/{todosConformes.length} conformes
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Foto do mapa */}
                {ag.foto_mapa_url && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 10 }}>
                            Mapa de Rastreabilidade
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ag.foto_mapa_url} alt="Mapa de rastreabilidade" style={{ width: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border-subtle)', background: '#fff' }} />
                    </div>
                )}

                {/* Legenda de cores */}
                {rastrs.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 10 }}>Legenda de Cores</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {rastrs.map((r, i) => (
                                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: `${r.cor_hex || '#D4A843'}18`, border: `1px solid ${r.cor_hex || '#D4A843'}44` }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: r.cor_hex || '#D4A843', flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: r.cor_hex || '#D4A843' }}>#{i + 1}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.identificacao_pecas}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabela principal */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 10 }}>Dados por Caminhão</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ background: 'rgba(127,166,83,0.1)' }}>
                                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>#</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>Elemento / Peça</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>m³</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>NF</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>Placa</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>Chegada</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>Início</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>Final</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>Slump</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>3d</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>7d</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>28d(1)</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>28d(2)</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, borderBottom: '1px solid var(--border-subtle)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rastrs.map((r, i) => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <td style={{ padding: '8px 10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.cor_hex || '#D4A843', flexShrink: 0 }} />
                                                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 11 }}>#{i + 1}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.identificacao_pecas}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{fmtNum(r.quantidade_m3)}</td>
                                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontSize: 11 }}>{r.nota_transporte || '—'}</td>
                                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontSize: 11 }}>{r.placa_caminhao || '—'}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{fmtTime(r.horario_chegada)}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{fmtTime(r.horario_inicio)}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{fmtTime(r.horario_final)}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{r.slump != null ? `${r.slump} cm` : '—'}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: r.rompimento_3 != null ? (r.fck_projeto && r.rompimento_3 >= r.fck_projeto ? '#10B981' : 'var(--text-primary)') : 'var(--text-muted)' }}>{fmtNum(r.rompimento_3)}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: r.rompimento_7 != null ? (r.fck_projeto && r.rompimento_7 >= r.fck_projeto ? '#10B981' : 'var(--text-primary)') : 'var(--text-muted)' }}>{fmtNum(r.rompimento_7)}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: r.rompimento_28a != null ? (r.fck_projeto && r.rompimento_28a >= r.fck_projeto ? '#10B981' : '#EF4444') : 'var(--text-muted)' }}>{fmtNum(r.rompimento_28a)}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: r.rompimento_28b != null ? (r.fck_projeto && r.rompimento_28b >= r.fck_projeto ? '#10B981' : '#EF4444') : 'var(--text-muted)' }}>{fmtNum(r.rompimento_28b)}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                            {r.conforme === true ? <CheckCircle size={15} style={{ color: '#10B981' }} />
                                                : r.conforme === false ? <XCircle size={15} style={{ color: '#EF4444' }} />
                                                    : <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⏳</span>}
                                        </td>
                                    </tr>
                                ))}
                                {/* Totais */}
                                <tr style={{ background: 'rgba(127,166,83,0.06)', borderTop: '2px solid rgba(127,166,83,0.3)' }}>
                                    <td colSpan={2} style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 11 }}>TOTAL</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: '#7FA653' }}>{totalM3.toFixed(2)}</td>
                                    <td colSpan={11} />
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Rodapé */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>SAGA Engenharia — Relatório gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{obraName}</span>
                </div>
            </div>
        </>
    )
}
