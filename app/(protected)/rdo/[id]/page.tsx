'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Cloud, Users, FileText, Share2, AlertCircle, MapPin, Calendar, Loader2, Printer } from 'lucide-react'

interface Rdo {
    id: string
    data: string
    clima?: string
    equipe_presente?: number
    equipe_json?: { nome: string; funcao: string }[]
    empreiteiros_quantidade?: number
    empreiteiros_json?: { empresa: string; servico: string; quantidade: number }[]
    descricao_atividades?: string
    ocorrencias?: string
    fotos_url?: string[]
    obras?: { nome: string; cidade?: string; endereco?: string }
    created_at?: string
}

const CLIMA_EMOJI: Record<string, string> = {
    'Ensolarado': '☀️', 'Nublado': '☁️', 'Chuvoso': '🌧️', 'Parcialmente nublado': '⛅',
}

const PRATICAVEL_LABEL: Record<string, { emoji: string; label: string; color: string }> = {
    praticavel: { emoji: '✅', label: 'Praticável', color: '#10B981' },
    impraticavel: { emoji: '🚫', label: 'Impraticável', color: '#EF4444' },
}

export default function RdoDetailPage() {
    const { id } = useParams<{ id: string }>()
    const supabase = createClient()
    const printRef = useRef<HTMLDivElement>(null)

    const [rdo, setRdo] = useState<Rdo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        if (!id) return
        supabase
            .from('rdos')
            .select('*, obras(nome, cidade, endereco)')
            .eq('id', id)
            .single()
            .then(({ data, error: err }) => {
                if (err || !data) { setError('RDO não encontrado'); setLoading(false); return }
                setRdo(data as Rdo)
                setLoading(false)
            })
    }, [id])

    const fmt = (d: string) =>
        new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

    async function gerarECompartilhar() {
        if (!printRef.current || !rdo) return
        setGenerating(true)

        try {
            // Import html2pdf dynamically (client-only)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const html2pdf = (await import('html2pdf.js' as any)).default
            const obra = rdo.obras as any
            const dataStr = rdo.data ? new Date(rdo.data + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
            const filename = `RDO_${obra?.nome?.replace(/\s+/g, '_') || 'SAGA'}_${rdo.data || ''}.pdf`

            const opt = {
                margin: [10, 10, 10, 10],
                filename,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pdfBlob: Blob = await (html2pdf() as any).set(opt).from(printRef.current).outputPdf('blob')
            const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })

            // Tenta compartilhar via Web Share API
            if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    title: `RDO — ${obra?.nome || ''} — ${dataStr}`,
                    files: [pdfFile],
                })
            } else {
                // Fallback: download direto
                const url = URL.createObjectURL(pdfBlob)
                const a = document.createElement('a')
                a.href = url; a.download = filename; a.click()
                URL.revokeObjectURL(url)
            }
        } catch (err) {
            console.error(err)
            window.print()
        }

        setGenerating(false)
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#52A87B' }} />
            </div>
        )
    }

    if (error || !rdo) {
        return (
            <div style={{ padding: 24, maxWidth: 500 }}>
                <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertCircle size={20} style={{ color: '#EF4444', flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>RDO não encontrado</div>
                        <Link href="/rdo" style={{ fontSize: 12, color: '#52A87B' }}>← Voltar para a lista</Link>
                    </div>
                </div>
            </div>
        )
    }

    const obra = rdo.obras as any
    const fotos = rdo.fotos_url || []
    const equipe = rdo.equipe_json || []

    // Parseia clima (JSON ou string legada)
    let climaManha = '', climaTarde = '', praticManha = 'praticavel', praticTarde = 'praticavel'
    if (rdo.clima) {
        try {
            const c = JSON.parse(rdo.clima)
            climaManha = c.manha || ''
            climaTarde = c.tarde || ''
            praticManha = c.praticabilidade_manha || c.praticabilidade || 'praticavel'
            praticTarde = c.praticabilidade_tarde || c.praticabilidade || 'praticavel'
        } catch {
            climaManha = rdo.clima
        }
    }

    return (
        <div style={{ padding: '20px', maxWidth: 780 }}>
            {/* ── Barra de ações (não imprime) ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link href="/rdo" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(82,168,123,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={18} style={{ color: '#52A87B' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>RDO</div>
                        {obra?.nome && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{obra.nome}</div>}
                    </div>
                </div>
                <button
                    onClick={gerarECompartilhar}
                    disabled={generating}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #52A87B, #3d8460)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: generating ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(82,168,123,0.35)' }}
                >
                    {generating ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
                    {generating ? 'Gerando PDF...' : 'Gerar e Compartilhar'}
                </button>
            </div>

            {/* ════════════════════════════════════════════════════════
                TEMPLATE DO RELATÓRIO (capturado como PDF)
            ════════════════════════════════════════════════════════ */}
            <div
                ref={printRef}
                style={{
                    background: '#ffffff',
                    color: '#1a1a1a',
                    fontFamily: "'Segoe UI', Arial, sans-serif",
                    padding: '0',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid #d0d4d9',
                    borderRadius: 16,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                }}
            >
                {/* ── Marca d'água ── */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/S-construtora-cinza-linhas.png"
                        alt=""
                        style={{ width: '50%', opacity: 0.05, userSelect: 'none' }}
                    />
                </div>

                {/* ── Cabeçalho — paleta cinza SAGA ── */}
                <div style={{
                    background: 'linear-gradient(135deg, #3a3f46, #4D5359)',
                    padding: '18px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    {/* Logo versão cinza-branco */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-preferencial-branco.png" alt="SAGA" style={{ height: 36, width: 'auto' }} />
                    {/* Título */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 2 }}>Relatório Diário de Obra</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '2px' }}>RDO</div>
                    </div>
                </div>

                {/* ── Faixa de info rápida ── */}
                <div style={{
                    background: '#f5f6f7',
                    borderBottom: '2px solid #4D5359',
                    padding: '10px 28px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 20,
                    position: 'relative',
                    zIndex: 1,
                }}>
                    <QuickInfo label="Data" value={rdo.data ? fmt(rdo.data) : '—'} />
                    <QuickInfo label="Obra" value={obra?.nome || '—'} />
                    {obra?.cidade && <QuickInfo label="Local" value={`${obra.cidade}${obra.endereco ? ` — ${obra.endereco}` : ''}`} />}
                    <QuickInfo label="Equipe própria" value={`${equipe.length || rdo.equipe_presente || 0} pessoas`} />
                    {rdo.empreiteiros_quantidade && rdo.empreiteiros_quantidade > 0 &&
                        <QuickInfo label="Empreiteiros" value={`${rdo.empreiteiros_quantidade} pessoas`} />}
                </div>

                {/* ── Corpo ── */}
                <div style={{ padding: '20px 28px', position: 'relative', zIndex: 1 }}>

                    {/* Clima */}
                    {(climaManha || climaTarde) && (
                        <Section title="🌤️ Condições Climáticas">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { label: '🌅 Manhã', clima: climaManha, pratic: praticManha },
                                    { label: '🌆 Tarde', clima: climaTarde, pratic: praticTarde },
                                ].map(({ label, clima, pratic }) => {
                                    const p = PRATICAVEL_LABEL[pratic] || PRATICAVEL_LABEL['praticavel']
                                    return (
                                        <div key={label} style={{ padding: '10px 14px', borderRadius: 8, background: '#f9f9f9', border: '1px solid #e0e3e7' }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#4D5359', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>
                                                {CLIMA_EMOJI[clima] || '🌡️'} {clima || 'Não informado'}
                                            </div>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: `${p.color}15`, border: `1px solid ${p.color}55` }}>
                                                <span style={{ fontSize: 11 }}>{p.emoji}</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.label}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Section>
                    )}

                    {/* Empreiteiros */}
                    {rdo.empreiteiros_json && rdo.empreiteiros_json.length > 0 && (
                        <Section title="🏗️ Equipes de Empreiteiros">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: '#f2f3f4' }}>
                                        <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #d0d4d9', color: '#4D5359', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Empresa</th>
                                        <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #d0d4d9', color: '#4D5359', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Serviço</th>
                                        <th style={{ padding: '7px 10px', textAlign: 'center', borderBottom: '1px solid #d0d4d9', color: '#4D5359', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pessoas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rdo.empreiteiros_json.map((e, i) => (
                                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                            <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', fontWeight: 600, color: '#1a1a1a' }}>{e.empresa}</td>
                                            <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee' }}>
                                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#eaebec', color: '#4D5359', fontWeight: 700 }}>{e.servico}</span>
                                            </td>
                                            <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 700, color: '#4D5359' }}>{e.quantidade}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Section>
                    )}

                    {/* Equipe */}
                    {equipe.length > 0 && (
                        <Section title="👷 Equipe Presente">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: '#f2f3f4' }}>
                                        <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #d0d4d9', color: '#4D5359', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                                        <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #d0d4d9', color: '#4D5359', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome</th>
                                        <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #d0d4d9', color: '#4D5359', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Função</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equipe.map((m, i) => (
                                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                            <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', color: '#888', fontSize: 11 }}>{i + 1}</td>
                                            <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee', fontWeight: 600, color: '#1a1a1a' }}>{m.nome}</td>
                                            <td style={{ padding: '7px 10px', borderBottom: '1px solid #eee' }}>
                                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#eaebec', color: '#4D5359', fontWeight: 700 }}>{m.funcao}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {rdo.equipe_presente != null && equipe.length === 0 && (
                                <p style={{ fontSize: 12, color: '#555' }}>{rdo.equipe_presente} pessoas presentes</p>
                            )}
                        </Section>
                    )}

                    {/* Atividades */}
                    {rdo.descricao_atividades && (
                        <Section title="📋 Atividades Realizadas">
                            <p style={{ fontSize: 13, color: '#333', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>{rdo.descricao_atividades}</p>
                        </Section>
                    )}

                    {/* Ocorrências */}
                    {rdo.ocorrencias && (
                        <Section title="⚠️ Ocorrências / Observações" accent="#c0392b">
                            <p style={{ fontSize: 13, color: '#333', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>{rdo.ocorrencias}</p>
                        </Section>
                    )}

                    {/* Fotos */}
                    {fotos.length > 0 && (
                        <Section title={`📷 Registros Fotográficos (${fotos.length})`}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {fotos.map((url, i) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={i} src={url} alt={`Foto ${i + 1}`}
                                        style={{ width: 130, height: 100, borderRadius: 8, objectFit: 'cover', border: '1px solid #d0d4d9' }}
                                        crossOrigin="anonymous"
                                    />
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Assinaturas */}
                    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
                        {['Engenheiro Responsável', 'Encarregado / Supervisor'].map(label => (
                            <div key={label}>
                                <div style={{ borderTop: '1.5px solid #4D5359', paddingTop: 8, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Rodapé ── */}
                <div style={{ background: '#f2f3f4', borderTop: '1px solid #d0d4d9', padding: '8px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SAGA Construtora — Relatório Diário de Obra</span>
                    <span style={{ fontSize: 9, color: '#6b7280' }}>
                        Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Preview info */}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                👆 Pré-visualização do PDF · Clique em &quot;Gerar e Compartilhar&quot; para exportar
            </p>
        </div>
    )
}

// ── Componentes auxiliares ──────────────────────────────────────────────────
function QuickInfo({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, color: '#4D5359', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{value}</div>
        </div>
    )
}

function Section({ title, accent = '#4D5359', children }: { title: string; accent?: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: accent, flexShrink: 0 }} />
                <div style={{ fontSize: 11, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{title}</div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#ffffff', border: `1px solid ${accent === '#4D5359' ? '#d0d4d9' : accent + '33'}`, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {children}
            </div>
        </div>
    )
}

