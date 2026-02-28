'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Lock, Printer, Upload, Loader2, ClipboardList, ChevronRight, Clock, CheckCircle, XCircle, X } from 'lucide-react'
import Link from 'next/link'

interface Agendamento {
    id: string
    obra_id: string
    data_agendada: string
    elemento?: string
    volume_estimado?: number
    fck_previsto?: number
    observacoes?: string
    status: string
    foto_mapa_url?: string
    obras?: { nome: string }
}

interface Rastreabilidade {
    id: string
    identificacao_pecas: string
    area_pavto?: string
    quantidade_m3?: number
    cor_hex?: string
    conforme?: boolean | null
    rompimento_28a?: number
    rompimento_28b?: number
    placa_caminhao?: string
    nota_transporte?: string
    horario_inicio?: string
}

const fmt = (d: string) => new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

export default function AgendamentoDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const supabase = createClient()
    const fotoRef = useRef<HTMLInputElement>(null)

    const [ag, setAg] = useState<Agendamento | null>(null)
    const [rastrs, setRastrs] = useState<Rastreabilidade[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [fotoFile, setFotoFile] = useState<File | null>(null)
    const [fechando, setFechando] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        Promise.all([
            supabase.from('concretagens_agendadas')
                .select('*, obras(nome)')
                .eq('id', params.id)
                .single(),
            supabase.from('rastreabilidade_concreto')
                .select('id, identificacao_pecas, area_pavto, quantidade_m3, cor_hex, conforme, rompimento_28a, rompimento_28b, placa_caminhao, nota_transporte, horario_inicio')
                .eq('agendamento_id', params.id)
                .order('created_at', { ascending: true }),
        ]).then(([{ data: a }, { data: r }]) => {
            setAg(a as any)
            setRastrs(r || [])
            setLoading(false)
        })
    }, [params.id])

    async function handleFechar() {
        if (!ag) return
        setFechando(true)
        setError('')

        let foto_mapa_url = ag.foto_mapa_url || null
        if (fotoFile) {
            const path = `${ag.obra_id}/mapas/${Date.now()}-${fotoFile.name}`
            const { data: up } = await supabase.storage.from('saga-engenharia').upload(path, fotoFile, { cacheControl: '3600' })
            if (up) {
                const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
                foto_mapa_url = publicUrl
            }
        }

        const { error: dbErr } = await supabase.from('concretagens_agendadas')
            .update({ status: 'realizada', foto_mapa_url })
            .eq('id', ag.id)

        if (dbErr) { setError(dbErr.message); setFechando(false); return }
        setAg(p => p ? { ...p, status: 'realizada', foto_mapa_url: foto_mapa_url || undefined } : p)
        setShowModal(false)
        setFechando(false)
    }

    if (loading) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
    if (!ag) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Agendamento não encontrado.</div>

    const realizada = ag.status === 'realizada'
    const obraId = ag.obra_id
    const data = ag.data_agendada
    const obraName = (ag.obras as any)?.nome || ''

    const totalM3 = rastrs.reduce((s, r) => s + (r.quantidade_m3 || 0), 0)
    const pendRomp = rastrs.some(r => r.rompimento_28a == null && r.rompimento_28b == null)

    return (
        <div style={{ padding: '20px', maxWidth: 720 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Link href="/concreto" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {ag.elemento || 'Concretagem Agendada'}
                    </h1>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {obraName} · {fmt(data)}
                    </p>
                </div>
                {realizada ? (
                    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>
                        ✅ REALIZADA
                    </span>
                ) : (
                    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.3)' }}>
                        📅 AGENDADA
                    </span>
                )}
            </div>

            {/* Dados do agendamento */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: 10, marginBottom: 20 }}>
                {[
                    ['Volume prev.', ag.volume_estimado ? `${ag.volume_estimado} m³` : '—'],
                    ['FCK previsto', ag.fck_previsto ? `${ag.fck_previsto} MPa` : '—'],
                    ['Total lançado', totalM3 > 0 ? `${totalM3.toFixed(1)} m³` : '—'],
                    ['Caminhões', rastrs.length > 0 ? `${rastrs.length}` : '0'],
                ].map(([label, value]) => (
                    <div key={label} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Ações */}
            {!realizada ? (
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <Link
                        href={`/concreto/rastreabilidade/novo?agendamento_id=${ag.id}&obra_id=${obraId}&data=${data}`}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#4A90D9,#3a72b0)', textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(74,144,217,0.3)' }}
                    >
                        <Plus size={15} /> Lançar Rastreabilidade
                    </Link>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, background: realizada ? 'rgba(16,185,129,0.1)' : 'rgba(212,168,67,0.1)', border: `1px solid ${realizada ? 'rgba(16,185,129,0.3)' : 'rgba(212,168,67,0.35)'}`, color: realizada ? '#10B981' : '#D4A843', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                        <Lock size={14} /> Fechar
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <Link
                        href={`/concreto/agendamento/${ag.id}/relatorio`}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#10B981,#0d9466)', textDecoration: 'none', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
                    >
                        <Printer size={15} /> Imprimir Relatório
                    </Link>
                </div>
            )}

            {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>}

            {/* Lista de rastreabilidades */}
            <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <ClipboardList size={13} style={{ color: '#D4A843' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        Rastreabilidades ({rastrs.length} caminhão{rastrs.length !== 1 ? 'ões' : ''})
                    </span>
                    {pendRomp && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>⏳ Rompimentos pendentes</span>}
                </div>

                {rastrs.length === 0 ? (
                    <div style={{ padding: '40px 20px', borderRadius: 14, border: '1px dashed rgba(212,168,67,0.25)', textAlign: 'center' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma rastreabilidade lançada ainda</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {rastrs.map(r => {
                            const pending28 = r.rompimento_28a == null && r.rompimento_28b == null
                            return (
                                <Link key={r.id} href={`/concreto/rastreabilidade/${r.id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${r.cor_hex || '#D4A843'}33`, transition: 'all 0.15s', cursor: 'pointer' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = `${r.cor_hex || '#D4A843'}0A`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.transform = 'none' }}>
                                        {/* Cor */}
                                        <div style={{ width: 14, height: 40, borderRadius: 4, background: r.cor_hex || '#D4A843', flexShrink: 0, boxShadow: `0 0 8px ${r.cor_hex || '#D4A843'}66` }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {r.identificacao_pecas}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                                                {r.quantidade_m3 && <span>{r.quantidade_m3} m³</span>}
                                                {r.placa_caminhao && <span>🚛 {r.placa_caminhao}</span>}
                                                {r.nota_transporte && <span>NF: {r.nota_transporte}</span>}
                                                {r.horario_inicio && <span>⏰ {r.horario_inicio.slice(0, 5)}</span>}
                                            </div>
                                        </div>
                                        <div style={{ flexShrink: 0 }}>
                                            {r.conforme === true ? <CheckCircle size={16} style={{ color: '#10B981' }} />
                                                : r.conforme === false ? <XCircle size={16} style={{ color: '#EF4444' }} />
                                                    : pending28 ? <Clock size={15} style={{ color: '#F59E0B' }} />
                                                        : null}
                                        </div>
                                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Foto do mapa */}
            {realizada && ag.foto_mapa_url && (
                <div style={{ marginTop: 20, padding: '14px', borderRadius: 14, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Foto do Mapa de Rastreabilidade</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ag.foto_mapa_url} alt="Mapa de rastreabilidade" style={{ width: '100%', borderRadius: 10, maxHeight: 400, objectFit: 'contain', background: '#fff' }} />
                </div>
            )}

            {/* Modal fechar concretagem */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 24, maxWidth: 440, width: '100%', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>🔒 Fechar Concretagem</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                            Após fechar, não será possível lançar novas rastreabilidades. Apenas rompimentos e laudos poderão ser adicionados.
                        </p>

                        {/* Upload foto do mapa */}
                        <div
                            onClick={() => fotoRef.current?.click()}
                            style={{ padding: '20px', borderRadius: 12, border: `2px dashed ${fotoFile ? 'rgba(16,185,129,0.4)' : 'rgba(212,168,67,0.3)'}`, textAlign: 'center', cursor: 'pointer', marginBottom: 16, background: fotoFile ? 'rgba(16,185,129,0.04)' : 'rgba(212,168,67,0.04)' }}
                        >
                            <Upload size={22} style={{ margin: '0 auto 8px', display: 'block', color: fotoFile ? '#10B981' : '#D4A843' }} />
                            {fotoFile ? (
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>📸 {fotoFile.name}</p>
                            ) : (
                                <>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#D4A843' }}>Foto do mapa de rastreabilidade</p>
                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Opcional mas recomendado · JPG, PNG</p>
                                </>
                            )}
                        </div>
                        <input ref={fotoRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={e => setFotoFile(e.target.files?.[0] || null)} />

                        {error && <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{error}</p>}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button onClick={handleFechar} disabled={fechando} style={{ flex: 2, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#D4A843,#c49130)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: fechando ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {fechando ? <><Loader2 size={15} className="animate-spin" /> Fechando...</> : '✅ Confirmar Fechamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
