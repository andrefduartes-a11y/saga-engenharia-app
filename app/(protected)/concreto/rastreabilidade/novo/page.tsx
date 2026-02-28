'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useObra } from '@/lib/obra-context'
import { ArrowLeft, ChevronDown, Upload, Loader2, ClipboardList } from 'lucide-react'
import Link from 'next/link'

const CORES = ['#4A90D9', '#7FA653', '#E85D75', '#D4A843', '#9B59B6', '#E67E22', '#1ABC9C', '#E74C3C', '#3498DB', '#525F6B']

export default function NovaRastreabilidadePage() {
    const router = useRouter()
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()
    const fileRef = useRef<HTMLInputElement>(null)

    const [allObras, setAllObras] = useState<{ id: string; nome: string }[]>([])
    const [selectedObraId, setSelectedObraId] = useState('')
    const obra = isDirector ? (allObras.find(o => o.id === selectedObraId) || null) : obraCtx
    const obraId = obra?.id

    const today = new Date().toISOString().split('T')[0]
    const [form, setForm] = useState({
        identificacao_pecas: '',
        area_pavto: '',
        data: today,
        quantidade_m3: '',
        fck_projeto: '',
        usinado: true,
        nota_transporte: '',
        horario_chegada: '',
        horario_inicio: '',
        horario_final: '',
        horario_moldagem_cp: '',
        slump: '',
        rompimento_3: '',
        rompimento_7: '',
        rompimento_28a: '',
        rompimento_28b: '',
        conforme: '' as '' | 'true' | 'false',
        responsavel: '',
        observacoes: '',
        cor_hex: '#4A90D9',
    })

    const [relatorioFile, setRelatorioFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isDirector) return
        supabase.from('obras').select('id, nome').order('nome')
            .then(({ data }) => setAllObras(data || []))
    }, [isDirector])

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
    const n = (v: string) => v !== '' ? parseFloat(v) : null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!obraId) { setError('Selecione uma obra.'); return }
        if (!form.identificacao_pecas.trim()) { setError('Informe a identificação das peças concretadas.'); return }
        setSaving(true)
        setError('')

        // Upload relatório da usina se houver
        let relatorio_url: string | null = null
        let relatorio_nome: string | null = null
        if (relatorioFile) {
            const path = `${obraId}/rastreabilidade/${Date.now()}-${relatorioFile.name}`
            const { data: uploaded } = await supabase.storage
                .from('saga-engenharia')
                .upload(path, relatorioFile, { cacheControl: '3600' })
            if (uploaded) {
                const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
                relatorio_url = publicUrl
                relatorio_nome = relatorioFile.name
            }
        }

        const { error: dbErr } = await supabase.from('rastreabilidade_concreto').insert({
            obra_id: obraId,
            identificacao_pecas: form.identificacao_pecas,
            area_pavto: form.area_pavto || null,
            data: form.data,
            quantidade_m3: n(form.quantidade_m3),
            fck_projeto: form.fck_projeto ? parseInt(form.fck_projeto) : null,
            usinado: form.usinado,
            nota_transporte: form.nota_transporte || null,
            horario_chegada: form.horario_chegada || null,
            horario_inicio: form.horario_inicio || null,
            horario_final: form.horario_final || null,
            horario_moldagem_cp: form.horario_moldagem_cp || null,
            slump: n(form.slump),
            rompimento_3: n(form.rompimento_3),
            rompimento_7: n(form.rompimento_7),
            rompimento_28a: n(form.rompimento_28a),
            rompimento_28b: n(form.rompimento_28b),
            conforme: form.conforme === 'true' ? true : form.conforme === 'false' ? false : null,
            responsavel: form.responsavel || null,
            observacoes: form.observacoes || null,
            cor_hex: form.cor_hex,
            relatorio_url,
            relatorio_nome,
        })

        if (dbErr) { setError(`Erro: ${dbErr.message}`); setSaving(false); return }
        router.push('/concreto')
    }

    const inputStyle = { width: '100%', boxSizing: 'border-box' as const }

    return (
        <div style={{ padding: '20px', maxWidth: 700 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href="/concreto" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={18} style={{ color: '#D4A843' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Nova Rastreabilidade</h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ficha de Rastreabilidade de Concreto — SAGA</p>
                    </div>
                </div>
            </div>

            {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Cor de identificação */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `2px solid ${form.cor_hex}44`, transition: 'border-color 0.2s' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: form.cor_hex, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Cor de Identificação</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {CORES.map(cor => (
                            <button key={cor} type="button" onClick={() => set('cor_hex', cor)}
                                style={{ width: 32, height: 32, borderRadius: '50%', background: cor, border: 'none', cursor: 'pointer', transition: 'all 0.15s', boxShadow: form.cor_hex === cor ? `0 0 0 3px white, 0 0 0 5px ${cor}` : `0 2px 6px ${cor}44` }} />
                        ))}
                        <input type="color" value={form.cor_hex} onChange={e => set('cor_hex', e.target.value)}
                            style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border-subtle)', cursor: 'pointer', background: 'none', padding: 1 }}
                            title="Cor personalizada" />
                    </div>
                </div>

                {/* Identificação */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,168,67,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Identificação</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {isDirector && (
                            <div>
                                <label className="form-label">Obra *</label>
                                <div style={{ position: 'relative' }}>
                                    <select className="input" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} style={{ appearance: 'none', paddingRight: 40 }} required>
                                        <option value="">Selecione a obra...</option>
                                        {allObras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="form-label">Identificação da(s) Peça(s) Concretada(s) *</label>
                            <input className="input" style={inputStyle} placeholder="Ex: Pilares P1 a P8 — Bloco A" value={form.identificacao_pecas} onChange={e => set('identificacao_pecas', e.target.value)} required />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="form-label">Área / Pavto</label>
                                <input className="input" style={inputStyle} placeholder="Ex: 2º Pavimento" value={form.area_pavto} onChange={e => set('area_pavto', e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">Data *</label>
                                <input className="input" type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="form-label">Quantidade (m³)</label>
                                <input className="input" style={inputStyle} type="number" step="0.1" placeholder="Ex: 18.5" value={form.quantidade_m3} onChange={e => set('quantidade_m3', e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">FCK de Projeto (MPa)</label>
                                <input className="input" style={inputStyle} type="number" placeholder="Ex: 30" value={form.fck_projeto} onChange={e => set('fck_projeto', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fornecimento */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(74,144,217,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#4A90D9', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Fornecimento</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Usinado?</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {[true, false].map(v => (
                                    <button key={String(v)} type="button" onClick={() => set('usinado', v)}
                                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: form.usinado === v ? (v ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.04)', color: form.usinado === v ? (v ? '#10B981' : '#EF4444') : 'var(--text-muted)', borderColor: form.usinado === v ? (v ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)') : 'var(--border-subtle)' }}>
                                        {v ? 'Sim' : 'Não'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Nº da Nota / Conhecimento de Transporte</label>
                            <input className="input" style={inputStyle} placeholder="Ex: NF 004521" value={form.nota_transporte} onChange={e => set('nota_transporte', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Responsável pelo Preenchimento</label>
                            <input className="input" style={inputStyle} placeholder="Nome do técnico" value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Horários */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(26,188,156,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1ABC9C', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Horários</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            ['horario_chegada', 'Chegada do Caminhão à Obra'],
                            ['horario_inicio', 'Início do Lançamento'],
                            ['horario_final', 'Final do Lançamento'],
                            ['horario_moldagem_cp', 'Moldagem do Corpo de Prova'],
                        ].map(([k, label]) => (
                            <div key={k}>
                                <label className="form-label">{label}</label>
                                <input className="input" type="time" value={(form as any)[k]} onChange={e => set(k, e.target.value)} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ensaio */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(155,89,182,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9B59B6', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Ensaio de Consistência</p>
                    <div>
                        <label className="form-label">Slump (cm)</label>
                        <input className="input" type="number" step="0.5" placeholder="Ex: 10" value={form.slump} onChange={e => set('slump', e.target.value)} />
                    </div>
                </div>

                {/* Rompimentos */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Resultado dos Ensaios de Rompimento (MPa)</p>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pode preencher depois</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                        {[['rompimento_3', '3 dias'], ['rompimento_7', '7 dias'], ['rompimento_28a', '28 dias (1)'], ['rompimento_28b', '28 dias (2)']].map(([k, label]) => (
                            <div key={k}>
                                <label className="form-label">{label}</label>
                                <input className="input" type="number" step="0.1" placeholder="—" value={(form as any)[k]} onChange={e => set(k, e.target.value)} />
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <label className="form-label">Conforme?</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[['true', '✅ Sim'], ['false', '❌ Não'], ['', 'Não avaliado']].map(([v, label]) => (
                                <button key={v} type="button" onClick={() => set('conforme', v)}
                                    style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', background: form.conforme === v ? (v === 'true' ? 'rgba(16,185,129,0.15)' : v === 'false' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)', color: form.conforme === v ? (v === 'true' ? '#10B981' : v === 'false' ? '#EF4444' : 'var(--text-primary)') : 'var(--text-muted)', borderColor: form.conforme === v ? (v === 'true' ? 'rgba(16,185,129,0.4)' : v === 'false' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)') : 'var(--border-subtle)' }}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Relatório da usina */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Relatório da Usina</p>
                    <div
                        onClick={() => fileRef.current?.click()}
                        style={{ padding: '20px', borderRadius: 12, border: `2px dashed ${relatorioFile ? 'rgba(16,185,129,0.4)' : 'var(--border-subtle)'}`, textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s', background: relatorioFile ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,168,67,0.4)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = relatorioFile ? 'rgba(16,185,129,0.4)' : 'var(--border-subtle)')}
                    >
                        <Upload size={20} style={{ margin: '0 auto 8px', display: 'block', color: relatorioFile ? '#10B981' : 'var(--text-muted)' }} />
                        {relatorioFile ? (
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>📎 {relatorioFile.name}</p>
                        ) : (
                            <>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Clique para anexar relatório</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>PDF, imagem ou qualquer arquivo da usina</p>
                            </>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls" style={{ display: 'none' }} onChange={e => setRelatorioFile(e.target.files?.[0] || null)} />
                </div>

                {/* Observações */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <label className="form-label">Observações</label>
                    <textarea className="input" rows={3} placeholder="Anotações adicionais..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
                </div>

                <button type="submit" disabled={saving} style={{ padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #D4A843, #c49130)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(212,168,67,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : '📋 Salvar Rastreabilidade'}
                </button>
            </form>
        </div>
    )
}
