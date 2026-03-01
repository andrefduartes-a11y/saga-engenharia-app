'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useObra } from '@/lib/obra-context'
import { ArrowLeft, ChevronDown, Upload, Loader2, ClipboardList, Palette } from 'lucide-react'
import Link from 'next/link'

const CORES = ['#4A90D9', '#7FA653', '#E85D75', '#D4A843', '#9B59B6', '#E67E22', '#1ABC9C', '#E74C3C', '#3498DB', '#525F6B']

export default function NovaRastreabilidadePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()
    const fileRef = useRef<HTMLInputElement>(null)
    const colorInputRef = useRef<HTMLInputElement>(null)

    // Query params vindos do agendamento
    const agendamento_id = searchParams.get('agendamento_id') || null
    const paramObraId = searchParams.get('obra_id') || null
    const paramData = searchParams.get('data') || null
    const fromAgendamento = !!agendamento_id

    const [allObras, setAllObras] = useState<{ id: string; nome: string }[]>([])
    const [selectedObraId, setSelectedObraId] = useState(paramObraId || '')
    const [obranome, setObranom] = useState('')
    const obra = isDirector
        ? (allObras.find(o => o.id === selectedObraId) || null)
        : obraCtx
    const obraId = fromAgendamento ? paramObraId : obra?.id

    const today = new Date().toISOString().split('T')[0]
    const [form, setForm] = useState({
        identificacao_pecas: '',
        area_pavto: '',
        data: paramData || today,
        quantidade_m3: '',
        fck_projeto: '',
        usinado: true,
        nota_transporte: '',
        placa_caminhao: '',
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
        if (fromAgendamento && paramObraId) {
            supabase.from('obras').select('nome').eq('id', paramObraId).single()
                .then(({ data }) => { if (data) setObranom(data.nome) })
        } else if (!fromAgendamento && isDirector) {
            supabase.from('obras').select('id, nome').order('nome')
                .then(({ data }) => setAllObras(data || []))
        }
    }, [isDirector, fromAgendamento, paramObraId])

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
    const n = (v: string) => v !== '' ? parseFloat(v) : null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!obraId) { setError('Selecione uma obra.'); return }
        if (!form.identificacao_pecas.trim()) { setError('Informe a identificação das peças concretadas.'); return }
        setSaving(true)
        setError('')

        // Audit trail
        const { data: { user } } = await supabase.auth.getUser()
        const { data: perfil } = await supabase.from('perfis').select('nome').eq('id', user?.id ?? '').single()
        const criado_por_nome = perfil?.nome || user?.email?.split('@')[0] || 'Usuário'

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
            agendamento_id: agendamento_id,
            identificacao_pecas: form.identificacao_pecas,
            area_pavto: form.area_pavto || null,
            data: form.data,
            quantidade_m3: n(form.quantidade_m3),
            fck_projeto: form.fck_projeto ? parseInt(form.fck_projeto) : null,
            usinado: form.usinado,
            nota_transporte: form.nota_transporte || null,
            placa_caminhao: form.placa_caminhao || null,
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
            criado_por_id: user?.id ?? null,
            criado_por_nome,
        })

        if (dbErr) { setError(`Erro: ${dbErr.message}`); setSaving(false); return }

        if (fromAgendamento) {
            router.push(`/concreto/agendamento/${agendamento_id}`)
        } else {
            router.push('/concreto')
        }
    }

    const backHref = fromAgendamento ? `/concreto/agendamento/${agendamento_id}` : '/concreto'
    const inputStyle = { width: '100%', boxSizing: 'border-box' as const }

    return (
        <div style={{ padding: '20px', maxWidth: 700 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href={backHref} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${form.cor_hex}22`, border: `2px solid ${form.cor_hex}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <ClipboardList size={18} style={{ color: form.cor_hex }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Nova Rastreabilidade</h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {fromAgendamento && obranome ? `${obranome} · ${new Date(form.data + 'T12:00').toLocaleDateString('pt-BR')}` : 'Ficha de Rastreabilidade de Concreto'}
                        </p>
                    </div>
                </div>
            </div>

            {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Cor de identificação */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `2px solid ${form.cor_hex}55`, transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: form.cor_hex, boxShadow: `0 0 12px ${form.cor_hex}88`, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: form.cor_hex, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Cor de Identificação no Mapa</p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                        {CORES.map(cor => (
                            <button key={cor} type="button" onClick={() => set('cor_hex', cor)}
                                style={{
                                    width: 32, height: 32, borderRadius: '50%', background: cor,
                                    border: 'none', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                                    boxShadow: form.cor_hex === cor
                                        ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${cor}`
                                        : `0 2px 6px ${cor}44`,
                                    transform: form.cor_hex === cor ? 'scale(1.15)' : 'scale(1)',
                                }} />
                        ))}
                        {/* Color picker customizado — sem bug de quadrado */}
                        <div
                            style={{ width: 32, height: 32, borderRadius: '50%', background: form.cor_hex, cursor: 'pointer', flexShrink: 0, overflow: 'hidden', position: 'relative', border: '2px dashed rgba(255,255,255,0.4)', boxShadow: `0 2px 6px ${form.cor_hex}44` }}
                            onClick={() => colorInputRef.current?.click()}
                            title="Cor personalizada"
                        >
                            <Palette size={14} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'rgba(255,255,255,0.8)', pointerEvents: 'none' }} />
                            <input
                                ref={colorInputRef}
                                type="color"
                                value={form.cor_hex}
                                onChange={e => set('cor_hex', e.target.value)}
                                style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Identificação */}
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,168,67,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Identificação</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Obra — só mostrar se não vier do agendamento */}
                        {!fromAgendamento && isDirector && (
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

                        {/* Data — só mostra se não vier do agendamento */}
                        {!fromAgendamento && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label className="form-label">Data *</label>
                                    <input className="input" type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="form-label">Área / Pavto</label>
                                    <input className="input" style={inputStyle} placeholder="Ex: 2º Pavimento" value={form.area_pavto} onChange={e => set('area_pavto', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {fromAgendamento && (
                            <div>
                                <label className="form-label">Área / Pavto</label>
                                <input className="input" style={inputStyle} placeholder="Ex: 2º Pavimento" value={form.area_pavto} onChange={e => set('area_pavto', e.target.value)} />
                            </div>
                        )}

                        <div>
                            <label className="form-label">Elemento / Peça Concretada *</label>
                            <input className="input" style={inputStyle} placeholder="Ex: Laje 2º Pav — Eixos A-E" value={form.identificacao_pecas} onChange={e => set('identificacao_pecas', e.target.value)} required />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="form-label">Quantidade (m³)</label>
                                <input className="input" style={inputStyle} type="number" step="0.1" placeholder="Ex: 8.5" value={form.quantidade_m3} onChange={e => set('quantidade_m3', e.target.value)} />
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
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#4A90D9', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Caminhão / Fornecimento</p>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label className="form-label">Nº NF / Conhecimento</label>
                                <input className="input" style={inputStyle} placeholder="Ex: NF 004521" value={form.nota_transporte} onChange={e => set('nota_transporte', e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">Placa do Caminhão</label>
                                <input className="input" style={inputStyle} placeholder="Ex: ABC-1234" value={form.placa_caminhao} onChange={e => set('placa_caminhao', e.target.value)} />
                            </div>
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
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Resultado dos Rompimentos (MPa)</p>
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
                    >
                        <Upload size={20} style={{ margin: '0 auto 8px', display: 'block', color: relatorioFile ? '#10B981' : 'var(--text-muted)' }} />
                        {relatorioFile ? (
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>📎 {relatorioFile.name}</p>
                        ) : (
                            <>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Clique para anexar relatório da usina</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>PDF, imagem ou qualquer arquivo</p>
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

                <button type="submit" disabled={saving} style={{ padding: '12px', borderRadius: 12, background: `linear-gradient(135deg, ${form.cor_hex}, ${form.cor_hex}cc)`, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', boxShadow: `0 4px 16px ${form.cor_hex}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : '📋 Salvar Rastreabilidade'}
                </button>
            </form>
        </div>
    )
}
