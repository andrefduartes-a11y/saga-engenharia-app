'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, ClipboardList, Cloud, Users, HardHat, FileText,
    Share2, Printer, AlertCircle, Camera, MapPin, Calendar, Loader2
} from 'lucide-react'

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
    obra_id?: string
    created_at?: string
}

const CLIMA_EMOJI: Record<string, string> = {
    'Ensolarado': '☀️',
    'Nublado': '☁️',
    'Chuvoso': '🌧️',
    'Parcialmente nublado': '⛅',
}

export default function RdoDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const supabase = createClient()

    const [rdo, setRdo] = useState<Rdo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [sharing, setSharing] = useState(false)

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

    async function handleShare() {
        setSharing(true)
        // Use Web Share API if available (mobile) — triggers a PDF via print dialog as fallback
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `RDO — ${rdo?.obras?.nome || ''} — ${rdo?.data ? new Date(rdo.data + 'T12:00').toLocaleDateString('pt-BR') : ''}`,
                    text: `Relatório Diário de Obra\n${rdo?.obras?.nome || ''}\n${rdo?.data ? fmt(rdo.data) : ''}\n\nAtividades: ${rdo?.descricao_atividades || '-'}`,
                })
            } catch {
                window.print()
            }
        } else {
            window.print()
        }
        setSharing(false)
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

    return (
        <>
            {/* ── Print styles ── */}
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #rdo-print, #rdo-print * { visibility: visible !important; }
                    #rdo-print { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; background: white !important; color: black !important; }
                    .no-print { display: none !important; }
                    .print-header { display: block !important; }
                    img { max-width: 200px; max-height: 200px; object-fit: cover; }
                }
                @media screen {
                    .print-header { display: none; }
                }
            `}</style>

            <div id="rdo-print" style={{ padding: '20px', maxWidth: 720 }}>

                {/* ── Nav header (sem impressão) ── */}
                <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Link href="/rdo" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                            <ArrowLeft size={18} />
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(82,168,123,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ClipboardList size={18} style={{ color: '#52A87B' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>RDO</div>
                                {obra?.nome && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{obra.nome}</div>}
                            </div>
                        </div>
                    </div>
                    {/* Botão compartilhar */}
                    <button
                        onClick={handleShare}
                        disabled={sharing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                            borderRadius: 10, background: 'linear-gradient(135deg, #52A87B, #3d8460)',
                            border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', boxShadow: '0 4px 14px rgba(82,168,123,0.35)',
                        }}
                    >
                        <Share2 size={15} /> Compartilhar
                    </button>
                </div>

                {/* ── Print header ── */}
                <div className="print-header" style={{ marginBottom: 16, borderBottom: '2px solid #52A87B', paddingBottom: 12 }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>RELATÓRIO DIÁRIO DE OBRA</div>
                    <div style={{ fontSize: 13, color: '#666' }}>SAGA Engenharia</div>
                </div>

                {/* ── Card: Identificação ── */}
                <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(82,168,123,0.06)', border: '1px solid rgba(82,168,123,0.2)', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                        <FileText size={12} /> Identificação
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        <InfoField icon={<Calendar size={12} />} label="Data" value={rdo.data ? fmt(rdo.data) : '—'} />
                        <InfoField icon={<MapPin size={12} />} label="Obra" value={obra?.nome || '—'} />
                        {obra?.cidade && <InfoField icon={<MapPin size={12} />} label="Cidade" value={obra.cidade} />}
                        {rdo.clima && <InfoField icon={<Cloud size={12} />} label="Clima" value={`${CLIMA_EMOJI[rdo.clima] || '🌥️'} ${rdo.clima}`} />}
                        {rdo.equipe_presente != null && (
                            <InfoField icon={<Users size={12} />} label="Equipe presente" value={`${rdo.equipe_presente} pessoa${rdo.equipe_presente !== 1 ? 's' : ''}`} />
                        )}
                    </div>
                </div>

                {/* ── Card: Equipe ── */}
                {((rdo.equipe_json && rdo.equipe_json.length > 0) || (rdo.equipe_presente != null && rdo.equipe_presente > 0)) && (
                    <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)', marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
                            👷 Equipe Presente ({rdo.equipe_presente || rdo.equipe_json?.length || 0} pessoas)
                        </div>
                        {rdo.equipe_json && rdo.equipe_json.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {rdo.equipe_json.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 10, background: 'rgba(82,168,123,0.06)', border: '1px solid rgba(82,168,123,0.15)' }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#52A87B', flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{m.nome}</span>
                                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(82,168,123,0.12)', color: '#52A87B', fontWeight: 600 }}>{m.funcao}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{rdo.equipe_presente} pessoa{rdo.equipe_presente !== 1 ? 's' : ''} presentes</p>
                        )}
                    </div>
                )}

                {/* ── Card: Atividades ── */}
                {rdo.descricao_atividades && (
                    <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)', marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
                            📋 Atividades Realizadas
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                            {rdo.descricao_atividades}
                        </p>
                    </div>
                )}

                {/* ── Card: Ocorrências ── */}
                {rdo.ocorrencias && (
                    <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10 }}>
                            ⚠️ Ocorrências / Observações
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                            {rdo.ocorrencias}
                        </p>
                    </div>
                )}

                {/* ── Card: Fotos ── */}
                {fotos.length > 0 && (
                    <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)', marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 12 }}>
                            📷 Registros Fotográficos ({fotos.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {fotos.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`Foto ${i + 1}`}
                                        style={{ width: 110, height: 110, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(82,168,123,0.2)', cursor: 'pointer' }}
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Rodapé (só na impressão) ── */}
                <div className="print-header" style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid #ccc', fontSize: 10, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                    <span>SAGA Engenharia — Relatório Diário de Obra</span>
                    <span>Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </>
    )
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
        </div>
    )
}
