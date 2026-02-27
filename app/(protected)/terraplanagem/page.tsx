'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import { Mountain, Plus, ChevronRight, X, Calendar, User } from 'lucide-react'
import Link from 'next/link'

interface Etapa {
    id: string
    nome_etapa: string
    data_inicio?: string
    responsavel?: string
    status: string
}

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')

export default function TerrapalagemPage() {
    const { obra } = useObra()
    const supabase = createClient()
    const [etapas, setEtapas] = useState<Etapa[]>([])
    const [loading, setLoading] = useState(true)
    const [novaEtapa, setNovaEtapa] = useState(false)
    const [form, setForm] = useState({ nome_etapa: '', data_inicio: '', responsavel: '' })
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        if (!obra) { setLoading(false); return }
        supabase.from('terraplanagem_etapas')
            .select('*')
            .eq('obra_id', obra.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => { setEtapas(data || []); setLoading(false) })
    }, [obra])

    async function criarEtapa() {
        if (!obra || !form.nome_etapa) return
        setSalvando(true)
        const { data } = await supabase.from('terraplanagem_etapas').insert({
            obra_id: obra.id,
            nome_etapa: form.nome_etapa,
            data_inicio: form.data_inicio || null,
            responsavel: form.responsavel || null,
        }).select().single()
        if (data) {
            setEtapas(p => [data, ...p])
            setNovaEtapa(false)
            setForm({ nome_etapa: '', data_inicio: '', responsavel: '' })
        }
        setSalvando(false)
    }

    return (
        <div style={{ padding: '20px', maxWidth: 860 }}>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mountain size={20} style={{ color: '#D4A843' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>Terraplanagem</h1>
                        {obra && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{obra.nome}</p>}
                    </div>
                </div>
                <button
                    onClick={() => setNovaEtapa(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #D4A843, #c49130)',
                        border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(212,168,67,0.35)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                >
                    <Plus size={15} /> Nova Etapa
                </button>
            </div>

            {/* ── New Etapa form ── */}
            {novaEtapa && (
                <div style={{
                    marginBottom: 20, borderRadius: 16,
                    background: 'linear-gradient(145deg, rgba(212,168,67,0.06), rgba(212,168,67,0.03))',
                    border: '1px solid rgba(212,168,67,0.25)',
                    overflow: 'hidden',
                }}>
                    {/* Form header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(212,168,67,0.15)', background: 'rgba(212,168,67,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Mountain size={15} style={{ color: '#D4A843' }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#D4A843' }}>Nova Etapa de Terraplanagem</span>
                        </div>
                        <button onClick={() => setNovaEtapa(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
                            <X size={16} />
                        </button>
                    </div>

                    {/* Form body */}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Nome */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'block' }}>
                                Nome da Etapa *
                            </label>
                            <input
                                value={form.nome_etapa}
                                onChange={e => setForm(p => ({ ...p, nome_etapa: e.target.value }))}
                                placeholder="Ex: Corte e aterro eixo A, Compactação do sub-leito..."
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    padding: '11px 14px', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(212,168,67,0.25)',
                                    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                                    transition: 'border-color 0.15s',
                                }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(212,168,67,0.6)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(212,168,67,0.25)')}
                            />
                        </div>

                        {/* Data + Responsável */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Calendar size={10} /> Data de Início
                                </label>
                                <input
                                    type="date"
                                    value={form.data_inicio}
                                    onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        padding: '11px 14px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                        transition: 'border-color 0.15s',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,168,67,0.4)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <User size={10} /> Responsável
                                </label>
                                <input
                                    value={form.responsavel}
                                    onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))}
                                    placeholder="Nome do encarregado"
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        padding: '11px 14px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                        transition: 'border-color 0.15s',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(212,168,67,0.4)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                            <button
                                onClick={() => setNovaEtapa(false)}
                                style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={criarEtapa}
                                disabled={salvando || !form.nome_etapa}
                                style={{
                                    flex: 2, padding: '10px', borderRadius: 10,
                                    background: !form.nome_etapa ? 'rgba(212,168,67,0.3)' : 'linear-gradient(135deg, #D4A843, #c49130)',
                                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                                    cursor: !form.nome_etapa ? 'not-allowed' : 'pointer',
                                    boxShadow: form.nome_etapa ? '0 4px 12px rgba(212,168,67,0.3)' : 'none',
                                    opacity: salvando ? 0.7 : 1,
                                }}
                            >
                                {salvando ? '⏳ Criando...' : '✓ Criar Etapa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            {!obra ? (
                <div style={{ padding: '48px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Mountain size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                    <p style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma obra selecionada</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Você será redirecionado automaticamente</p>
                </div>
            ) : loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 76, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />)}
                </div>
            ) : etapas.length === 0 ? (
                <div style={{ padding: '60px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(212,168,67,0.2)', textAlign: 'center' }}>
                    <Mountain size={48} style={{ margin: '0 auto 14px', display: 'block', color: '#D4A843', opacity: 0.4 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Nenhuma etapa registrada</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Comece adicionando a primeira etapa de terraplanagem</p>
                    <button onClick={() => setNovaEtapa(true)} style={{ padding: '8px 20px', borderRadius: 8, background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        + Nova Etapa
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {etapas.map(e => {
                        const finalizada = e.status === 'finalizada'
                        return (
                            <Link
                                key={e.id}
                                href={`/terraplanagem/${e.id}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 18px', borderRadius: 14,
                                        background: 'rgba(255,255,255,0.025)',
                                        border: `1px solid ${finalizada ? 'rgba(16,185,129,0.2)' : 'rgba(212,168,67,0.15)'}`,
                                        transition: 'all 0.15s', cursor: 'pointer',
                                    }}
                                    onMouseEnter={e2 => {
                                        e2.currentTarget.style.background = finalizada ? 'rgba(16,185,129,0.05)' : 'rgba(212,168,67,0.06)'
                                        e2.currentTarget.style.borderColor = finalizada ? 'rgba(16,185,129,0.35)' : 'rgba(212,168,67,0.35)'
                                        e2.currentTarget.style.transform = 'translateY(-1px)'
                                    }}
                                    onMouseLeave={e2 => {
                                        e2.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                                        e2.currentTarget.style.borderColor = finalizada ? 'rgba(16,185,129,0.2)' : 'rgba(212,168,67,0.15)'
                                        e2.currentTarget.style.transform = 'none'
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: finalizada ? 'rgba(16,185,129,0.12)' : 'rgba(212,168,67,0.12)', border: `1px solid ${finalizada ? 'rgba(16,185,129,0.2)' : 'rgba(212,168,67,0.2)'}` }}>
                                        <Mountain size={20} style={{ color: finalizada ? '#10B981' : '#D4A843' }} />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {e.nome_etapa}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                                            {e.data_inicio && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Calendar size={10} /> {fmt(e.data_inicio)}
                                                </span>
                                            )}
                                            {e.responsavel && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <User size={10} /> {e.responsavel}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status badge */}
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                                        background: finalizada ? 'rgba(16,185,129,0.12)' : 'rgba(212,168,67,0.12)',
                                        color: finalizada ? '#10B981' : '#D4A843',
                                        border: `1px solid ${finalizada ? 'rgba(16,185,129,0.25)' : 'rgba(212,168,67,0.25)'}`
                                    }}>
                                        {finalizada ? '✅ Finalizada' : '🔨 Em andamento'}
                                    </span>

                                    <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
