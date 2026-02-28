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
    descricao_atividades?: string
    ocorrencias?: string
    fotos_url?: string[]
    obras?: { nome: string; cidade?: string; endereco?: string }
    created_at?: string
}

const CLIMA_EMOJI: Record<string, string> = {
    'Ensolarado': '☀️', 'Nublado': '☁️', 'Chuvoso': '🌧️', 'Parcialmente nublado': '⛅',
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
                    border: '1px solid rgba(82,168,123,0.3)',
                    borderRadius: 16,
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
                        style={{ width: '55%', opacity: 0.06, userSelect: 'none' }}
                    />
                </div>

                {/* ── Cabeçalho verde ── */}
                <div style={{ background: 'linear-gradient(135deg, #2d6a4f, #52A87B)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    {/* Logo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-preferencial-branco.png" alt="SAGA" style={{ height: 38, width: 'auto' }} />
                    {/* Título */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '2px', textTransform: 'uppercase' }}>Relatório Diário de Obra</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '1px' }}>RDO</div>
                    </div>
                </div>

                {/* ── Faixa de info rápida ── */}
                <div style={{ background: '#f8fffe', borderBottom: '2px solid #52A87B', padding: '12px 28px', display: 'flex', flexWrap: 'wrap', gap: 24, position: 'relative', zIndex: 1 }}>
                    <QuickInfo label="Data" value={rdo.data ? fmt(rdo.data) : '—'} />
                    <QuickInfo label="Obra" value={obra?.nome || '—'} />
                    {obra?.cidade && <QuickInfo label="Local" value={`${obra.cidade}${obra.endereco ? ` — ${obra.endereco}` : ''}`} />}
                    {rdo.clima && <QuickInfo label="Clima" value={`${CLIMA_EMOJI[rdo.clima] || ''} ${rdo.clima}`} />}
                    <QuickInfo label="Equipe" value={`${equipe.length || rdo.equipe_presente || 0} pessoas`} />
                </div>

                {/* ── Corpo ── */}
                <div style={{ padding: '20px 28px', position: 'relative', zIndex: 1 }}>

                    {/* Equipe */}
                    {equipe.length > 0 && (
                        <Section title="👷 Equipe Presente">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: '#f0faf5' }}>
                                        <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #d1e9da', color: '#2d6a4f', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                                        <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #d1e9da', color: '#2d6a4f', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome</th>
                                        <th style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #d1e9da', color: '#2d6a4f', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Função</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {equipe.map((m, i) => (
                                        <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fffe' }}>
                                            <td style={{ padding: '7px 10px', borderBottom: '1px solid #eef7f2', color: '#888', fontSize: 11 }}>{i + 1}</td>
                                            <td style={{ padding: '7px 10px', borderBottom: '1px solid #eef7f2', fontWeight: 600, color: '#1a1a1a' }}>{m.nome}</td>
                                            <td style={{ padding: '7px 10px', borderBottom: '1px solid #eef7f2' }}>
                                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#e8f5ee', color: '#2d6a4f', fontWeight: 700 }}>{m.funcao}</span>
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
                            <p style={{ fontSize: 13, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{rdo.descricao_atividades}</p>
                        </Section>
                    )}

                    {/* Ocorrências */}
                    {rdo.ocorrencias && (
                        <Section title="⚠️ Ocorrências / Observações" accent="#d9534f">
                            <p style={{ fontSize: 13, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{rdo.ocorrencias}</p>
                        </Section>
                    )}

                    {/* Fotos */}
                    {fotos.length > 0 && (
                        <Section title={`📷 Registros Fotográficos (${fotos.length})`}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {fotos.map((url, i) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={i} src={url} alt={`Foto ${i + 1}`}
                                        style={{ width: 130, height: 100, borderRadius: 8, objectFit: 'cover', border: '1px solid #d1e9da' }}
                                        crossOrigin="anonymous"
                                    />
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Assinaturas */}
                    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        {['Engenheiro Responsável', 'Encarregado / Supervisor'].map(label => (
                            <div key={label}>
                                <div style={{ borderTop: '1.5px solid #52A87B', paddingTop: 8, textAlign: 'center' }}>
                                    <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Rodapé ── */}
                <div style={{ background: '#f0faf5', borderTop: '1px solid #d1e9da', padding: '8px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SAGA Engenharia — Relatório Diário de Obra</span>
                    <span style={{ fontSize: 9, color: '#888' }}>
                        Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Preview info */}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                👆 Pré-visualização do PDF · Clique em "Gerar e Compartilhar" para exportar
            </p>
        </div>
    )
}

// ── Componentes auxiliares ──────────────────────────────────────────────────
function QuickInfo({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 9, color: '#52A87B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{value}</div>
        </div>
    )
}

function Section({ title, accent = '#52A87B', children }: { title: string; accent?: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: accent, flexShrink: 0 }} />
                <div style={{ fontSize: 11, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{title}</div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: '#ffffff', border: `1px solid ${accent}22` }}>
                {children}
            </div>
        </div>
    )
}
