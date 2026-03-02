'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ClipboardList, Loader2, Camera, X, Users, ChevronDown, Save, HardHat, Plus, Settings } from 'lucide-react'
import Link from 'next/link'

const FUNCOES = ['Engenheiro', 'Supervisor', 'Encarregado', 'Pedreiro', 'Carpinteiro', 'Armador', 'Meio-Oficial', 'Ajudante']

interface MembroEquipe { nome: string; funcao: string }
interface EmpEntry { empresa: string; servico: string; quantidade: number }

export default function EditarRdoPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const supabase = createClient()

    const [pageLoading, setPageLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [obraId, setObraId] = useState('')
    const [obraNome, setObraNome] = useState('')

    const [form, setForm] = useState({
        data: '',
        clima_manha: '',
        clima_tarde: '',
        praticabilidade_manha: 'praticavel' as 'praticavel' | 'impraticavel',
        praticabilidade_tarde: 'praticavel' as 'praticavel' | 'impraticavel',
        descricao_atividades: '',
        ocorrencias: '',
    })
    const [equipe, setEquipe] = useState<MembroEquipe[]>([])
    const [fotosExistentes, setFotosExistentes] = useState<string[]>([])
    const [fotosNovas, setFotosNovas] = useState<File[]>([])
    const [fotosRemovidas, setFotosRemovidas] = useState<string[]>([])
    // Empreiteiros
    const [empreiteirosPre, setEmpreiteirosPre] = useState<{ id: string; empresa: string; servico: string }[]>([])
    const [empQtd, setEmpQtd] = useState<Record<string, number>>({})
    const [empreiteirosExtra, setEmpreiteirosExtra] = useState<EmpEntry[]>([])

    // Carrega o RDO existente
    useEffect(() => {
        if (!id) return
        supabase
            .from('rdos')
            .select('*, obras(nome)')
            .eq('id', id)
            .single()
            .then(({ data, error: err }) => {
                if (err || !data) { setError('RDO não encontrado'); setPageLoading(false); return }
                setObraId(data.obra_id || '')
                setObraNome((data.obras as any)?.nome || '')
                let climaManha = '', climaTarde = ''
                let praticabilidadeManha: 'praticavel' | 'impraticavel' = 'praticavel'
                let praticabilidadeTarde: 'praticavel' | 'impraticavel' = 'praticavel'
                if (data.clima) {
                    try {
                        const parsed = JSON.parse(data.clima)
                        climaManha = parsed.manha || ''
                        climaTarde = parsed.tarde || ''
                        praticabilidadeManha = parsed.praticabilidade_manha || parsed.praticabilidade || 'praticavel'
                        praticabilidadeTarde = parsed.praticabilidade_tarde || parsed.praticabilidade || 'praticavel'
                    } catch {
                        climaManha = data.clima || ''
                    }
                }
                setForm({
                    data: data.data || '',
                    clima_manha: climaManha,
                    clima_tarde: climaTarde,
                    praticabilidade_manha: praticabilidadeManha,
                    praticabilidade_tarde: praticabilidadeTarde,
                    descricao_atividades: data.descricao_atividades || '',
                    ocorrencias: data.ocorrencias || '',
                })
                setEquipe(data.equipe_json || [])
                setFotosExistentes(data.fotos_url || [])
                // Load existing empreiteiros_json as extras
                if (data.empreiteiros_json && Array.isArray(data.empreiteiros_json)) {
                    setEmpreiteirosExtra(data.empreiteiros_json)
                }
                setPageLoading(false)
                // Load pre-registered empreiteiros for this obra
                supabase.from('empreiteiros_obra').select('id, empresa, servico').eq('obra_id', data.obra_id).order('empresa')
                    .then(({ data: preData }) => setEmpreiteirosPre(preData || []))
            })
    }, [id])

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

    function addMembro() { setEquipe(p => [...p, { nome: '', funcao: 'Pedreiro' }]) }
    function updateMembro(i: number, k: keyof MembroEquipe, v: string) {
        setEquipe(p => p.map((m, idx) => idx === i ? { ...m, [k]: v } : m))
    }
    function removeMembro(i: number) { setEquipe(p => p.filter((_, idx) => idx !== i)) }
    function removeFotoExistente(url: string) {
        setFotosRemovidas(p => [...p, url])
        setFotosExistentes(p => p.filter(u => u !== url))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true); setError('')

        // Upload de novas fotos
        const novasUrls: string[] = []
        for (const foto of fotosNovas) {
            const path = `${obraId}/rdos/${Date.now()}-${foto.name}`
            const { data } = await supabase.storage.from('saga-engenharia').upload(path, foto, { cacheControl: '3600' })
            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
                novasUrls.push(publicUrl)
            }
        }

        const equipeValida = equipe.filter(m => m.nome.trim())
        const fotosFinais = [...fotosExistentes, ...novasUrls]

        const climaJson = JSON.stringify({
            manha: form.clima_manha || null,
            tarde: form.clima_tarde || null,
            praticabilidade_manha: form.praticabilidade_manha,
            praticabilidade_tarde: form.praticabilidade_tarde,
        })

        // Monta empreiteiros_json
        const empreiteirosJson = [
            ...empreiteirosPre
                .filter(e => (empQtd[e.id] || 0) > 0)
                .map(e => ({ empresa: e.empresa, servico: e.servico, quantidade: empQtd[e.id] })),
            ...empreiteirosExtra.filter(e => e.empresa.trim() && e.quantidade > 0),
        ]
        const totalEmpreiteiros = empreiteirosJson.reduce((s, e) => s + e.quantidade, 0)

        const { error: dbErr } = await supabase.from('rdos').update({
            data: form.data,
            clima: climaJson,
            descricao_atividades: form.descricao_atividades || null,
            ocorrencias: form.ocorrencias || null,
            equipe_json: equipeValida,
            equipe_presente: equipeValida.length,
            empreiteiros_quantidade: totalEmpreiteiros || null,
            empreiteiros_json: empreiteirosJson.length > 0 ? empreiteirosJson : null,
            fotos_url: fotosFinais,
        }).eq('id', id)

        if (dbErr) { setError(`Erro: ${dbErr.message}`); setSaving(false); return }
        router.push(`/rdo/${id}`)
    }

    if (pageLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <Loader2 size={22} className="animate-spin" style={{ color: '#52A87B' }} />
            </div>
        )
    }

    if (error && !form.data) {
        return (
            <div style={{ padding: 24 }}>
                <p style={{ color: '#EF4444', fontSize: 14 }}>{error}</p>
                <Link href="/rdo" style={{ color: '#52A87B', fontSize: 13 }}>← Voltar</Link>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', maxWidth: 620 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href={`/rdo/${id}`} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(82,168,123,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ClipboardList size={18} style={{ color: '#52A87B' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Editar RDO</h1>
                    {obraNome && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{obraNome}</p>}
                </div>
            </div>

            {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Informações gerais */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(82,168,123,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Informações Gerais</p>
                    {/* Data — linha própria, largura reduzida */}
                    <div style={{ maxWidth: 200 }}>
                        <label className="form-label">Data *</label>
                        <input className="input" type="date" required value={form.data} onChange={e => set('data', e.target.value)} />
                    </div>

                    {/* Manhã / Tarde — duas colunas, cada uma com clima + praticabilidade */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                        {/* ── MANHÃ ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>🌅 Manhã</p>
                            <div>
                                <label className="form-label">Clima</label>
                                <div style={{ position: 'relative' }}>
                                    <select className="input" value={form.clima_manha} onChange={e => set('clima_manha', e.target.value)} style={{ appearance: 'none', paddingRight: 36 }}>
                                        <option value="">Selecione</option>
                                        <option>Ensolarado</option>
                                        <option>Parcialmente nublado</option>
                                        <option>Nublado</option>
                                        <option>Chuvoso</option>
                                    </select>
                                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Praticabilidade</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                        { value: 'praticavel', label: '✅ Praticável', color: '#10B981' },
                                        { value: 'impraticavel', label: '🚫 Impraticável', color: '#EF4444' },
                                    ].map(opt => (
                                        <button key={opt.value} type="button"
                                            onClick={() => setForm(p => ({ ...p, praticabilidade_manha: opt.value as 'praticavel' | 'impraticavel' }))}
                                            style={{
                                                padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                                                background: form.praticabilidade_manha === opt.value ? `${opt.color}18` : 'rgba(255,255,255,0.03)',
                                                border: `2px solid ${form.praticabilidade_manha === opt.value ? opt.color : 'var(--border-subtle)'}`,
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <span style={{ fontSize: 12, fontWeight: 700, color: form.praticabilidade_manha === opt.value ? opt.color : 'var(--text-primary)' }}>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── TARDE ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>🌆 Tarde</p>
                            <div>
                                <label className="form-label">Clima</label>
                                <div style={{ position: 'relative' }}>
                                    <select className="input" value={form.clima_tarde} onChange={e => set('clima_tarde', e.target.value)} style={{ appearance: 'none', paddingRight: 36 }}>
                                        <option value="">Selecione</option>
                                        <option>Ensolarado</option>
                                        <option>Parcialmente nublado</option>
                                        <option>Nublado</option>
                                        <option>Chuvoso</option>
                                    </select>
                                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Praticabilidade</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {[
                                        { value: 'praticavel', label: '✅ Praticável', color: '#10B981' },
                                        { value: 'impraticavel', label: '🚫 Impraticável', color: '#EF4444' },
                                    ].map(opt => (
                                        <button key={opt.value} type="button"
                                            onClick={() => setForm(p => ({ ...p, praticabilidade_tarde: opt.value as 'praticavel' | 'impraticavel' }))}
                                            style={{
                                                padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                                                background: form.praticabilidade_tarde === opt.value ? `${opt.color}18` : 'rgba(255,255,255,0.03)',
                                                border: `2px solid ${form.praticabilidade_tarde === opt.value ? opt.color : 'var(--border-subtle)'}`,
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <span style={{ fontSize: 12, fontWeight: 700, color: form.praticabilidade_tarde === opt.value ? opt.color : 'var(--text-primary)' }}>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Equipe */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(82,168,123,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={14} style={{ color: '#52A87B' }} />
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                Equipe ({equipe.filter(m => m.nome.trim()).length} pessoas)
                            </p>
                        </div>
                        <button type="button" onClick={addMembro} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(82,168,123,0.1)', border: '1px solid rgba(82,168,123,0.25)', color: '#52A87B', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            + Adicionar
                        </button>
                    </div>
                    {equipe.length === 0 && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>Nenhum membro — clique em "+ Adicionar"</p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {equipe.map((m, i) => (
                            <div key={i} style={{ display: 'flex', gap: 6 }}>
                                <input className="input" placeholder="Nome" value={m.nome} onChange={e => updateMembro(i, 'nome', e.target.value)} style={{ flex: 2 }} />
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <select className="input" value={m.funcao} onChange={e => updateMembro(i, 'funcao', e.target.value)} style={{ appearance: 'none', paddingRight: 28 }}>
                                        {FUNCOES.map(f => <option key={f}>{f}</option>)}
                                    </select>
                                    <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                </div>
                                <button type="button" onClick={() => removeMembro(i)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Empreiteiros */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <HardHat size={15} style={{ color: '#52A87B' }} />
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Empreiteiros</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Link href="/rdo/empreiteiros" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'rgba(82,168,123,0.1)', border: '1px solid rgba(82,168,123,0.25)', textDecoration: 'none', color: '#52A87B', fontSize: 11, fontWeight: 600 }}>
                                <Settings size={11} /> Gerenciar
                            </Link>
                            <button type="button" onClick={() => setEmpreiteirosExtra(p => [...p, { empresa: '', servico: 'Geral', quantidade: 1 }])}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(82,168,123,0.1)', border: '1px solid rgba(82,168,123,0.25)', color: '#52A87B', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                <Plus size={11} /> Ad-hoc
                            </button>
                        </div>
                    </div>

                    {empreiteirosPre.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Nenhum empreiteiro pré-cadastrado</p>
                            <Link href="/rdo/empreiteiros" style={{ fontSize: 12, color: '#52A87B', textDecoration: 'none', fontWeight: 600 }}>→ Cadastrar empreiteiros</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {empreiteirosPre.map(e => (
                                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: (empQtd[e.id] || 0) > 0 ? 'rgba(82,168,123,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${(empQtd[e.id] || 0) > 0 ? 'rgba(82,168,123,0.3)' : 'var(--border-subtle)'}`, transition: 'all 0.15s' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{e.empresa}</span>
                                        <span style={{ fontSize: 10, marginLeft: 8, padding: '1px 6px', borderRadius: 99, background: 'rgba(82,168,123,0.1)', color: '#52A87B', fontWeight: 600 }}>{e.servico}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Qtd:</span>
                                        <input type="number" min="0" max="999" value={empQtd[e.id] ?? ''} placeholder="0"
                                            onChange={ev => setEmpQtd(p => ({ ...p, [e.id]: parseInt(ev.target.value) || 0 }))}
                                            style={{ width: 60, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: 13, textAlign: 'center' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {empreiteirosExtra.length > 0 && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Adicionais</p>
                            {empreiteirosExtra.map((e, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6 }}>
                                    <input className="input" placeholder="Empresa" value={e.empresa} onChange={ev => setEmpreiteirosExtra(p => p.map((x, idx) => idx === i ? { ...x, empresa: ev.target.value } : x))} style={{ flex: 2 }} />
                                    <input type="number" min="0" placeholder="Qtd" value={e.quantidade || ''} onChange={ev => setEmpreiteirosExtra(p => p.map((x, idx) => idx === i ? { ...x, quantidade: parseInt(ev.target.value) || 0 } : x))} style={{ width: 70, padding: '0 8px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: 13 }} />
                                    <button type="button" onClick={() => setEmpreiteirosExtra(p => p.filter((_, idx) => idx !== i))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Atividades */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Atividades e Ocorrências</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label className="form-label">Descrição das atividades</label>
                            <textarea className="input" rows={4} style={{ resize: 'vertical', minHeight: 90 }} value={form.descricao_atividades} onChange={e => set('descricao_atividades', e.target.value)} placeholder="Descreva as atividades realizadas..." />
                        </div>
                        <div>
                            <label className="form-label">Ocorrências / Observações</label>
                            <textarea className="input" rows={3} style={{ resize: 'vertical', minHeight: 70 }} value={form.ocorrencias} onChange={e => set('ocorrencias', e.target.value)} placeholder="Alguma ocorrência relevante?" />
                        </div>
                    </div>
                </div>

                {/* Fotos existentes */}
                {fotosExistentes.length > 0 && (
                    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Fotos Existentes</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {fotosExistentes.map((url, i) => (
                                <div key={i} style={{ position: 'relative' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(82,168,123,0.2)' }} />
                                    <button type="button" onClick={() => removeFotoExistente(url)} style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={10} color="white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Adicionar novas fotos */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Adicionar Fotos</p>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', borderRadius: 12, border: '2px dashed rgba(82,168,123,0.25)', padding: '16px', color: '#52A87B', background: 'rgba(82,168,123,0.04)' }}>
                        <Camera size={18} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Selecionar fotos</span>
                        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
                            const files = Array.from(e.target.files || []).slice(0, 10)
                            setFotosNovas(p => [...p, ...files].slice(0, 10))
                        }} />
                    </label>
                    {fotosNovas.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                            {fotosNovas.map((f, i) => (
                                <div key={i} style={{ position: 'relative' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={URL.createObjectURL(f)} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }} />
                                    <button type="button" onClick={() => setFotosNovas(p => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={10} color="white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" disabled={saving} style={{ padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #52A87B, #3d8460)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(82,168,123,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar Alterações</>}
                </button>
            </form>
        </div>
    )
}
