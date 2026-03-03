'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, FileDown, Loader2, CheckCircle, XCircle } from 'lucide-react'
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
    relatorio_url?: string
    relatorio_nome?: string
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

// SAGA brand gray
const SAGA_DARK = '#3a3f46'
const SAGA_GRAY = '#4D5359'
const SAGA_LIGHT = '#f2f3f4'
const SAGA_BORDER = '#d0d4d9'

export default function RelatorioRastreabilidadePage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const printRef = useRef<HTMLDivElement>(null)
    const [ag, setAg] = useState<Agendamento | null>(null)
    const [rastrs, setRastrs] = useState<Rastreabilidade[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        Promise.all([
            supabase.from('concretagens_agendadas').select('*, obras(nome)').eq('id', params.id).single(),
            supabase.from('rastreabilidade_concreto')
                .select('id, identificacao_pecas, area_pavto, cor_hex, quantidade_m3, fck_projeto, usinado, nota_transporte, placa_caminhao, horario_chegada, horario_inicio, horario_final, horario_moldagem_cp, slump, rompimento_3, rompimento_7, rompimento_28a, rompimento_28b, conforme, responsavel, relatorio_url, relatorio_nome')
                .eq('agendamento_id', params.id)
                .order('created_at', { ascending: true }),
        ]).then(([{ data: a }, { data: r }]) => {
            setAg(a as any)
            setRastrs(r || [])
            setLoading(false)
        })
    }, [params.id])

    async function gerarPDF() {
        if (!printRef.current || !ag) return
        setGenerating(true)
        try {
            const html2pdf = (await import('html2pdf.js')).default
            const { PDFDocument } = await import('pdf-lib')

            const obraName = (ag.obras as any)?.nome || 'Obra'
            const fileName = `Rastreabilidade_${obraName.replace(/\s+/g, '_')}_${ag.data_agendada}`

            // Step 1: Gera PDF do relatório do sistema
            const element = printRef.current as HTMLDivElement
            const mainPdfBytes: ArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                html2pdf()
                    .from(element)
                    .set({
                        margin: [8, 8, 8, 8],
                        filename: fileName + '.pdf',
                        image: { type: 'jpeg', quality: 0.95 },
                        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
                    })
                    .outputPdf('arraybuffer')
                    .then((buf: unknown) => resolve(buf as ArrayBuffer))
                    .catch(reject)
            })

            // Step 2: Merge com anexos
            const mergedDoc = await PDFDocument.create()

            // Copia páginas do PDF principal
            const mainDoc = await PDFDocument.load(mainPdfBytes)
            const mainPages = await mergedDoc.copyPages(mainDoc, mainDoc.getPageIndices())
            mainPages.forEach(p => mergedDoc.addPage(p))

            // Adiciona foto do mapa como página
            if (ag.foto_mapa_url) {
                try {
                    const res = await fetch(ag.foto_mapa_url)
                    const imgBytes = await res.arrayBuffer()
                    const contentType = res.headers.get('content-type') || ''
                    let img
                    if (contentType.includes('png') || ag.foto_mapa_url.toLowerCase().includes('.png')) {
                        img = await mergedDoc.embedPng(imgBytes)
                    } else {
                        img = await mergedDoc.embedJpg(imgBytes)
                    }
                    const page = mergedDoc.addPage([595, 842]) // A4 portrait
                    const { width, height } = page.getSize()
                    const scale = Math.min(width / img.width, height / img.height) * 0.9
                    const w = img.width * scale
                    const h = img.height * scale
                    page.drawImage(img, { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h })
                } catch { /* ignora se falhar */ }
            }

            // Adiciona relatório de laboratório de cada rastreabilidade (se for PDF)
            for (const r of rastrs) {
                if (!r.relatorio_url) continue
                const isImg = /\.(jpg|jpeg|png)$/i.test(r.relatorio_url)
                const isPdf = /\.pdf$/i.test(r.relatorio_url) || !isImg
                try {
                    const res = await fetch(r.relatorio_url)
                    const bytes = await res.arrayBuffer()
                    if (isImg) {
                        const img = r.relatorio_url.toLowerCase().includes('.png')
                            ? await mergedDoc.embedPng(bytes)
                            : await mergedDoc.embedJpg(bytes)
                        const page = mergedDoc.addPage([595, 842])
                        const { width, height } = page.getSize()
                        const scale = Math.min(width / img.width, height / img.height) * 0.85
                        const w = img.width * scale
                        const h = img.height * scale
                        page.drawImage(img, { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h })
                    } else if (isPdf) {
                        const labDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
                        const labPages = await mergedDoc.copyPages(labDoc, labDoc.getPageIndices())
                        labPages.forEach(p => mergedDoc.addPage(p))
                    }
                } catch { /* ignora erros de CORS ou arquivo inválido */ }
            }

            // Download
            const finalBytes = await mergedDoc.save()
            const blob = new Blob([finalBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = fileName + '_completo.pdf'
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            alert('Erro ao gerar PDF. Tente novamente.')
        }
        setGenerating(false)
    }

    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
    if (!ag) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Não encontrado.</div>

    const obraName = (ag.obras as any)?.nome || ''
    const totalM3 = rastrs.reduce((s, r) => s + (r.quantidade_m3 || 0), 0)
    const todosConformes = rastrs.filter(r => r.conforme != null)
    const aprovados = todosConformes.filter(r => r.conforme === true).length
    const temAnexos = !!ag.foto_mapa_url || rastrs.some(r => !!r.relatorio_url)

    return (
        <>
            {/* Controles — não aparecem no PDF */}
            <div style={{ display: 'flex', gap: 10, padding: '16px 24px', alignItems: 'center', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)' }}>
                <Link href={`/concreto/agendamento/${params.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)', fontSize: 13 }}>
                    <ArrowLeft size={16} /> Voltar
                </Link>
                <button onClick={gerarPDF} disabled={generating}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${SAGA_DARK}, ${SAGA_GRAY})`, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: generating ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
                    {generating ? <><Loader2 size={15} className="animate-spin" /> Gerando...</> : <><FileDown size={15} /> Baixar PDF Completo</>}
                </button>
                {temAnexos && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        📎 O PDF incluirá {ag.foto_mapa_url ? 'o mapa + ' : ''}{rastrs.filter(r => r.relatorio_url).length > 0 ? `${rastrs.filter(r => r.relatorio_url).length} relatório(s) de laboratório` : ''}
                    </span>
                )}
            </div>

            {/* ════ TEMPLATE DO RELATÓRIO (capturado como PDF) ════ */}
            <div ref={printRef} style={{
                background: '#ffffff', color: '#1a1a1a',
                fontFamily: "'Segoe UI', Arial, sans-serif",
                wordBreak: 'break-word', overflowWrap: 'break-word',
            }}>
                {/* Cabeçalho SAGA cinza */}
                <div style={{ background: `linear-gradient(135deg, ${SAGA_DARK}, ${SAGA_GRAY})`, padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-preferencial-branco.png" alt="SAGA" style={{ height: 32, width: 'auto' }} />
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 2 }}>Relatório de Rastreabilidade</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '1px' }}>CONCRETO</div>
                    </div>
                </div>

                {/* Faixa de info */}
                <div style={{ background: SAGA_LIGHT, borderBottom: `2px solid ${SAGA_GRAY}`, padding: '10px 28px', display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                    <InfoItem label="Obra" value={obraName} />
                    <InfoItem label="Data" value={fmtDate(ag.data_agendada)} />
                    {ag.elemento && <InfoItem label="Elemento" value={ag.elemento} />}
                    <InfoItem label="Total lançado" value={`${totalM3.toFixed(2)} m³`} />
                    <InfoItem label="Caminhões" value={`${rastrs.length}`} />
                    {ag.fck_previsto && <InfoItem label="FCK Previsto" value={`${ag.fck_previsto} MPa`} />}
                    {todosConformes.length > 0 && (
                        <InfoItem label="Conformidade"
                            value={`${aprovados}/${todosConformes.length} ${aprovados === todosConformes.length ? '✅' : '⚠️'}`} />
                    )}
                </div>

                {/* Corpo */}
                <div style={{ padding: '16px 28px' }}>

                    {/* Foto do mapa */}
                    {ag.foto_mapa_url && (
                        <Section title="📍 Mapa de Rastreabilidade" accent={SAGA_GRAY}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ag.foto_mapa_url} alt="Mapa de rastreabilidade"
                                style={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 8, background: '#fff', display: 'block' }}
                                crossOrigin="anonymous"
                            />
                        </Section>
                    )}

                    {/* Legenda de cores */}
                    {rastrs.length > 0 && (
                        <Section title="🎨 Legenda de Cores" accent={SAGA_GRAY}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {rastrs.map((r, i) => (
                                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: `${r.cor_hex || '#D4A843'}18`, border: `1px solid ${r.cor_hex || '#D4A843'}44` }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.cor_hex || '#D4A843', flexShrink: 0 }} />
                                        <span style={{ fontSize: 10, fontWeight: 700, color: r.cor_hex || '#D4A843' }}>#{i + 1}</span>
                                        <span style={{ fontSize: 11, color: '#333' }}>{r.identificacao_pecas}</span>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Tabela principal */}
                    <Section title="📋 Dados por Caminhão" accent={SAGA_GRAY}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                <thead>
                                    <tr style={{ background: SAGA_LIGHT }}>
                                        {['#', 'Elemento / Peça', 'm³', 'NF', 'Placa', 'Chegada', 'Início', 'Final', 'Slump', '3d', '7d', '28d(1)', '28d(2)', 'Status'].map(h => (
                                            <th key={h} style={{ padding: '7px 8px', textAlign: h === '#' || ['m³', 'Chegada', 'Início', 'Final', 'Slump', '3d', '7d', '28d(1)', '28d(2)', 'Status'].includes(h) ? 'center' : 'left', color: SAGA_GRAY, fontWeight: 700, fontSize: 9, borderBottom: `1px solid ${SAGA_BORDER}`, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rastrs.map((r, i) => (
                                        <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : SAGA_LIGHT, borderBottom: `1px solid ${SAGA_BORDER}` }}>
                                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: r.cor_hex || '#D4A843' }} />
                                                    <span style={{ fontWeight: 700, color: SAGA_GRAY, fontSize: 10 }}>#{i + 1}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '7px 8px', fontWeight: 600, color: '#1a1a1a' }}>{r.identificacao_pecas}</td>
                                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>{fmtNum(r.quantidade_m3)}</td>
                                            <td style={{ padding: '7px 8px', fontSize: 10, color: '#555' }}>{r.nota_transporte || '—'}</td>
                                            <td style={{ padding: '7px 8px', fontSize: 10, color: '#555' }}>{r.placa_caminhao || '—'}</td>
                                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>{fmtTime(r.horario_chegada)}</td>
                                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>{fmtTime(r.horario_inicio)}</td>
                                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>{fmtTime(r.horario_final)}</td>
                                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>{r.slump != null ? `${r.slump}cm` : '—'}</td>
                                            {[r.rompimento_3, r.rompimento_7, r.rompimento_28a, r.rompimento_28b].map((v, vi) => {
                                                const is28 = vi >= 2
                                                const ok = v != null && r.fck_projeto && v >= r.fck_projeto
                                                return <td key={vi} style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 700, color: v == null ? '#bbb' : ok ? '#10B981' : (is28 ? '#EF4444' : '#1a1a1a') }}>{v ?? '—'}</td>
                                            })}
                                            <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                                                {r.conforme === true ? <CheckCircle size={13} style={{ color: '#10B981' }} />
                                                    : r.conforme === false ? <XCircle size={13} style={{ color: '#EF4444' }} />
                                                        : <span style={{ fontSize: 10, color: '#bbb' }}>⏳</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Linha de totais */}
                                    <tr style={{ background: '#f0f0f0', borderTop: `2px solid ${SAGA_GRAY}` }}>
                                        <td colSpan={2} style={{ padding: '7px 8px', fontWeight: 800, color: SAGA_GRAY, fontSize: 11 }}>TOTAL</td>
                                        <td style={{ padding: '7px 8px', textAlign: 'center', fontWeight: 800, color: SAGA_GRAY }}>{totalM3.toFixed(2)}</td>
                                        <td colSpan={11} />
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    {/* Responsáveis */}
                    {rastrs.some(r => r.responsavel) && (
                        <Section title="👤 Responsáveis" accent={SAGA_GRAY}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {Array.from(new Set(rastrs.filter(r => r.responsavel).map(r => r.responsavel!))).map(nome => (
                                    <span key={nome} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: SAGA_LIGHT, border: `1px solid ${SAGA_BORDER}`, color: '#333', fontWeight: 600 }}>
                                        {nome}
                                    </span>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Assinaturas */}
                    <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>
                        {['Engenheiro Responsável', 'Encarregado / Supervisor', 'Fiscal / Responsável Técnico'].map(label => (
                            <div key={label}>
                                <div style={{ borderTop: `1.5px solid ${SAGA_GRAY}`, paddingTop: 8, textAlign: 'center' }}>
                                    <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rodapé */}
                    <div style={{ marginTop: 20, paddingTop: 8, borderTop: `1px solid ${SAGA_BORDER}`, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280' }}>
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>SAGA Construtora — Relatório de Rastreabilidade de Concreto</span>
                        <span>Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>
        </>
    )
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 8, color: SAGA_GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', wordBreak: 'break-word' }}>{value}</div>
        </div>
    )
}

function Section({ title, accent = SAGA_GRAY, children }: { title: string; accent?: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 3, height: 13, borderRadius: 2, background: accent, flexShrink: 0 }} />
                <div style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{title}</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: '#ffffff', border: `1px solid ${SAGA_BORDER}`, wordBreak: 'break-word' }}>
                {children}
            </div>
        </div>
    )
}
