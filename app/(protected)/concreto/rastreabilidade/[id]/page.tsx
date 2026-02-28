'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle, Clock, ExternalLink, FileText, ClipboardList } from 'lucide-react'
import Link from 'next/link'

interface Rastreabilidade {
    id: string
    obra_id: string
    identificacao_pecas: string
    area_pavto?: string
    data: string
    quantidade_m3?: number
    fck_projeto?: number
    usinado: boolean
    nota_transporte?: string
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
    observacoes?: string
    cor_hex?: string
    relatorio_url?: string
    relatorio_nome?: string
    obras?: { nome: string }
}

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const fmtT = (t?: string) => t ? t.slice(0, 5) : '—'

export default function RastreabilidadeDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const supabase = createClient()
    const fileRef = useRef<HTMLInputElement>(null)

    const [data, setData] = useState<Rastreabilidade | null>(null)
    const [loading, setLoading] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Editable rompimento fields (common use case: fill these later)
    const [romp3, setRomp3] = useState('')
    const [romp7, setRomp7] = useState('')
    const [romp28a, setRomp28a] = useState('')
    const [romp28b, setRomp28b] = useState('')
    const [conforme, setConforme] = useState<'' | 'true' | 'false'>('')
    const [observacoes, setObservacoes] = useState('')
    const [relatorioFile, setRelatorioFile] = useState<File | null>(null)

    useEffect(() => {
        supabase.from('rastreabilidade_concreto')
            .select('*, obras(nome)')
            .eq('id', params.id)
            .single()
            .then(({ data: d }) => {
                if (d) {
                    setData(d as any)
                    setRomp3(d.rompimento_3?.toString() || '')
                    setRomp7(d.rompimento_7?.toString() || '')
                    setRomp28a(d.rompimento_28a?.toString() || '')
                    setRomp28b(d.rompimento_28b?.toString() || '')
                    setConforme(d.conforme === true ? 'true' : d.conforme === false ? 'false' : '')
                    setObservacoes(d.observacoes || '')
                }
                setLoading(false)
            })
    }, [params.id])

    async function handleSave() {
        if (!data) return
        setSaving(true); setError('')
        const n = (v: string) => v !== '' ? parseFloat(v) : null

        let relatorio_url = data.relatorio_url
        let relatorio_nome = data.relatorio_nome
        if (relatorioFile) {
            const path = `${data.obra_id}/rastreabilidade/${Date.now()}-${relatorioFile.name}`
            const { data: uploaded } = await supabase.storage.from('saga-engenharia').upload(path, relatorioFile)
            if (uploaded) {
                const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
                relatorio_url = publicUrl
                relatorio_nome = relatorioFile.name
            }
        }

        const { error: dbErr } = await supabase.from('rastreabilidade_concreto').update({
            rompimento_3: n(romp3),
            rompimento_7: n(romp7),
            rompimento_28a: n(romp28a),
            rompimento_28b: n(romp28b),
            conforme: conforme === 'true' ? true : conforme === 'false' ? false : null,
            observacoes: observacoes || null,
            relatorio_url,
            relatorio_nome,
        }).eq('id', data.id)

        if (dbErr) { setError(dbErr.message); setSaving(false); return }

        setData(p => p ? { ...p, rompimento_3: n(romp3) ?? undefined, rompimento_7: n(romp7) ?? undefined, rompimento_28a: n(romp28a) ?? undefined, rompimento_28b: n(romp28b) ?? undefined, conforme: conforme === 'true' ? true : conforme === 'false' ? false : null, observacoes, relatorio_url: relatorio_url || undefined, relatorio_nome: relatorio_nome || undefined } : p)
        setRelatorioFile(null)
        setSaving(false)
        setEditMode(false)
    }

    if (loading) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
    if (!data) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Registro não encontrado.</div>

    const pendingRomp = data.rompimento_28a == null && data.rompimento_28b == null

    return (
        <div style={{ padding: '20px', maxWidth: 720 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href="/concreto" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${data.cor_hex || '#D4A843'}22`, border: `2px solid ${data.cor_hex || '#D4A843'}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 10px ${data.cor_hex || '#D4A843'}33` }}>
                        <ClipboardList size={16} style={{ color: data.cor_hex || '#D4A843' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.identificacao_pecas}</h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(data.data)} {(data.obras as any)?.nome && `· ${(data.obras as any).nome}`}</p>
                    </div>
                </div>
                <button onClick={() => setEditMode(v => !v)} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${editMode ? 'rgba(212,168,67,0.4)' : 'var(--border-subtle)'}`, background: editMode ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.05)', color: editMode ? '#D4A843' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {editMode ? 'Cancelar' : '✏️ Editar'}
                </button>
            </div>

            {/* Pending rompimentos banner */}
            {pendingRomp && (
                <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>Rompimentos pendentes</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Volte para preencher os resultados dos ensaios de rompimento.</p>
                    </div>
                    {!editMode && (
                        <button onClick={() => setEditMode(true)} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#F59E0B', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Preencher
                        </button>
                    )}
                </div>
            )}

            {error && <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>}

            {/* Data grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Resumo rápido */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                    {[
                        ['Área / Pavto', data.area_pavto || '—'],
                        ['Quantidade', data.quantidade_m3 ? `${data.quantidade_m3} m³` : '—'],
                        ['FCK Projeto', data.fck_projeto ? `${data.fck_projeto} MPa` : '—'],
                        ['Slump', data.slump ? `${data.slump} cm` : '—'],
                        ['Usinado', data.usinado ? 'Sim' : 'Não'],
                        ['Nota Transporte', data.nota_transporte || '—'],
                    ].map(([label, value]) => (
                        <div key={label} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Horários */}
                <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(26,188,156,0.15)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1ABC9C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Horários</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                            ['Chegada Caminhão', data.horario_chegada],
                            ['Início Lançamento', data.horario_inicio],
                            ['Final Lançamento', data.horario_final],
                            ['Moldagem CP', data.horario_moldagem_cp],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtT(value)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rompimentos */}
                <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${pendingRomp ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.2)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: pendingRomp ? '#F59E0B' : '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resultados dos Ensaios (MPa)</p>
                        {data.conforme === true && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#10B981' }}><CheckCircle size={14} /> Conforme</div>}
                        {data.conforme === false && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#EF4444' }}><XCircle size={14} /> Não Conforme</div>}
                    </div>

                    {editMode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                                {[['romp3', '3 dias', romp3, setRomp3], ['romp7', '7 dias', romp7, setRomp7], ['romp28a', '28 dias (1)', romp28a, setRomp28a], ['romp28b', '28 dias (2)', romp28b, setRomp28b]].map(([k, label, val, setVal]) => (
                                    <div key={k as string}>
                                        <label className="form-label">{label as string}</label>
                                        <input className="input" type="number" step="0.1" placeholder="—" value={val as string} onChange={e => (setVal as any)(e.target.value)} />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="form-label">Conforme?</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[['true', '✅ Sim'], ['false', '❌ Não'], ['', 'Pendente']].map(([v, label]) => (
                                        <button key={v} type="button" onClick={() => setConforme(v as any)}
                                            style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: conforme === v ? (v === 'true' ? 'rgba(16,185,129,0.15)' : v === 'false' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)', color: conforme === v ? (v === 'true' ? '#10B981' : v === 'false' ? '#EF4444' : 'var(--text-primary)') : 'var(--text-muted)', borderColor: conforme === v ? (v === 'true' ? 'rgba(16,185,129,0.4)' : v === 'false' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)') : 'var(--border-subtle)' }}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                            {[['3 dias', data.rompimento_3], ['7 dias', data.rompimento_7], ['28 dias (1)', data.rompimento_28a], ['28 dias (2)', data.rompimento_28b]].map(([label, value]) => (
                                <div key={label} style={{ textAlign: 'center', padding: '10px', borderRadius: 10, background: value != null ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.05)', border: `1px solid ${value != null ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)'}` }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: value != null ? '#10B981' : '#F59E0B' }}>{value != null ? value : '—'}</div>
                                    {value != null && <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>MPa</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Relatório usina */}
                <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Relatório da Usina</p>
                    {data.relatorio_url ? (
                        <a href={data.relatorio_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', textDecoration: 'none' }}>
                            <FileText size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.relatorio_nome || 'Relatório anexado'}</span>
                            <ExternalLink size={14} style={{ color: '#10B981' }} />
                        </a>
                    ) : editMode ? (
                        <div onClick={() => fileRef.current?.click()} style={{ padding: '16px', borderRadius: 10, border: `2px dashed ${relatorioFile ? 'rgba(16,185,129,0.4)' : 'var(--border-subtle)'}`, textAlign: 'center', cursor: 'pointer', background: relatorioFile ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)' }}>
                            <Upload size={18} style={{ margin: '0 auto 6px', display: 'block', color: relatorioFile ? '#10B981' : 'var(--text-muted)' }} />
                            <p style={{ fontSize: 12, color: relatorioFile ? '#10B981' : 'var(--text-muted)', fontWeight: 600 }}>{relatorioFile ? relatorioFile.name : 'Clique para anexar relatório da usina'}</p>
                        </div>
                    ) : (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum relatório anexado.</p>
                    )}
                    <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls" style={{ display: 'none' }} onChange={e => setRelatorioFile(e.target.files?.[0] || null)} />
                </div>

                {/* Observações */}
                {editMode ? (
                    <div>
                        <label className="form-label">Observações</label>
                        <textarea className="input" rows={3} value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Anotações adicionais..." />
                    </div>
                ) : data.observacoes ? (
                    <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Observações</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{data.observacoes}</p>
                    </div>
                ) : null}

                {/* Responsável */}
                {data.responsavel && (
                    <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Responsável: </span>{data.responsavel}
                    </div>
                )}

                {/* Save button (edit mode) */}
                {editMode && (
                    <button onClick={handleSave} disabled={saving} style={{ padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #D4A843, #c49130)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(212,168,67,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : '💾 Salvar Alterações'}
                    </button>
                )}
            </div>
        </div>
    )
}
