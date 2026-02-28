'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import { ArrowLeft, ClipboardList, Loader2, Camera, X, Plus, Users, HardHat, Settings, ChevronDown } from 'lucide-react'
import Link from 'next/link'

const FUNCOES = ['Engenheiro', 'Supervisor', 'Encarregado', 'Pedreiro', 'Carpinteiro', 'Armador', 'Meio-Oficial', 'Ajudante']

interface MembroEquipe { nome: string; funcao: string }

export default function NovoRdoPage() {
    const router = useRouter()
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [allObras, setAllObras] = useState<{ id: string; nome: string }[]>([])
    const [selectedObraId, setSelectedObraId] = useState(obraCtx?.id || '')
    const obraId = isDirector ? selectedObraId : (obraCtx?.id || '')

    const [equipePre, setEquipePre] = useState<{ id: string; nome: string; funcao: string }[]>([])
    const [selecionados, setSelecionados] = useState<Record<string, boolean>>({})
    const [equipeManual, setEquipeManual] = useState<MembroEquipe[]>([])

    const [form, setForm] = useState({
        data: new Date().toISOString().split('T')[0],
        clima: '',
        descricao_atividades: '',
        ocorrencias: '',
        empreiteiros: '',
    })
    const [fotos, setFotos] = useState<File[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Carrega obras (diretores)
    useEffect(() => {
        if (isDirector) {
            supabase.from('obras').select('id, nome').eq('status', 'ativa').order('nome')
                .then(({ data }) => setAllObras(data || []))
        }
    }, [isDirector])

    // Carrega equipe pré-cadastrada da obra
    useEffect(() => {
        if (!obraId) { setEquipePre([]); return }
        supabase.from('equipe_obra').select('id, nome, funcao').eq('obra_id', obraId).eq('ativo', true).order('nome')
            .then(({ data }) => {
                setEquipePre(data || [])
                // Seleciona todos por padrão
                const initial: Record<string, boolean> = {}
                    ; (data || []).forEach((m: any) => { initial[m.id] = true })
                setSelecionados(initial)
            })
    }, [obraId])

    const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

    function toggleMembro(id: string) {
        setSelecionados(p => ({ ...p, [id]: !p[id] }))
    }

    function adicionarManual() {
        setEquipeManual(p => [...p, { nome: '', funcao: 'Pedreiro' }])
    }

    function updateManual(i: number, k: keyof MembroEquipe, v: string) {
        setEquipeManual(p => p.map((m, idx) => idx === i ? { ...m, [k]: v } : m))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!obraId) { setError('Selecione uma obra.'); return }
        setLoading(true); setError('')

        // Monta equipe final
        const equipeFinal: MembroEquipe[] = [
            ...equipePre.filter(m => selecionados[m.id]).map(m => ({ nome: m.nome, funcao: m.funcao })),
            ...equipeManual.filter(m => m.nome.trim()),
        ]

        // Upload fotos
        const fotosUrls: string[] = []
        for (const foto of fotos) {
            const path = `${obraId}/rdos/${Date.now()}-${foto.name}`
            const { data } = await supabase.storage.from('saga-engenharia').upload(path, foto, { cacheControl: '3600' })
            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
                fotosUrls.push(publicUrl)
            }
        }

        const { data: { user } } = await supabase.auth.getUser()

        const { error: dbErr } = await supabase.from('rdos').insert({
            obra_id: obraId,
            data: form.data,
            clima: form.clima || null,
            equipe_presente: equipeFinal.length,
            equipe_json: equipeFinal,
            empreiteiros_quantidade: form.empreiteiros ? parseInt(form.empreiteiros) : null,
            descricao_atividades: form.descricao_atividades || null,
            ocorrencias: form.ocorrencias || null,
            fotos_url: fotosUrls,
            created_by: user?.id,
        })

        if (dbErr) { setError(`Erro ao salvar RDO: ${dbErr.message}`); setLoading(false); return }
        router.push('/rdo')
    }

    const totalEquipe = equipePre.filter(m => selecionados[m.id]).length + equipeManual.filter(m => m.nome.trim()).length

    return (
        <div style={{ padding: '20px', maxWidth: 620 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Link href="/rdo" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={18} />
                </Link>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(82,168,123,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ClipboardList size={18} style={{ color: '#52A87B' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Novo RDO</h1>
                    {obraCtx && !isDirector && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{obraCtx.nome}</p>}
                </div>
                {/* Link para gerenciar equipe */}
                {obraId && (
                    <Link href="/rdo/equipe" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, background: 'rgba(82,168,123,0.1)', border: '1px solid rgba(82,168,123,0.25)', textDecoration: 'none', color: '#52A87B', fontSize: 11, fontWeight: 600 }}>
                        <Settings size={12} /> Equipe
                    </Link>
                )}
            </div>

            {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 13 }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Obra (diretores) */}
                {isDirector && (
                    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(82,168,123,0.2)' }}>
                        <label className="form-label">Obra *</label>
                        <div style={{ position: 'relative' }}>
                            <select className="input" value={selectedObraId} onChange={e => setSelectedObraId(e.target.value)} style={{ appearance: 'none', paddingRight: 40 }} required>
                                <option value="">Selecione a obra</option>
                                {allObras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                )}

                {/* Informações gerais */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(82,168,123,0.2)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Informações Gerais</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label className="form-label">Data *</label>
                            <input className="input" type="date" required value={form.data} onChange={e => set('data', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Clima</label>
                            <div style={{ position: 'relative' }}>
                                <select className="input" value={form.clima} onChange={e => set('clima', e.target.value)} style={{ appearance: 'none', paddingRight: 36 }}>
                                    <option value="">Selecione</option>
                                    <option>Ensolarado</option>
                                    <option>Parcialmente nublado</option>
                                    <option>Nublado</option>
                                    <option>Chuvoso</option>
                                </select>
                                <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Equipe pré-cadastrada */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(82,168,123,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={15} style={{ color: '#52A87B' }} />
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#52A87B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                Equipe Presente {totalEquipe > 0 && `— ${totalEquipe} pessoas`}
                            </p>
                        </div>
                        <button type="button" onClick={adicionarManual} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(82,168,123,0.1)', border: '1px solid rgba(82,168,123,0.25)', color: '#52A87B', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            <Plus size={11} /> Ad-hoc
                        </button>
                    </div>

                    {/* Lista de membros pré-cadastrados com checkbox */}
                    {!obraId ? (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>Selecione a obra para ver a equipe</p>
                    ) : equipePre.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Nenhuma equipe pré-cadastrada</p>
                            <Link href="/rdo/equipe" style={{ fontSize: 12, color: '#52A87B', textDecoration: 'none', fontWeight: 600 }}>→ Cadastrar equipe</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {equipePre.map(m => {
                                const sel = selecionados[m.id] !== false
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => toggleMembro(m.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: sel ? 'rgba(82,168,123,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${sel ? 'rgba(82,168,123,0.35)' : 'var(--border-subtle)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                                    >
                                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${sel ? '#52A87B' : 'rgba(255,255,255,0.2)'}`, background: sel ? '#52A87B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                            {sel && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: sel ? 700 : 400, color: sel ? 'var(--text-primary)' : 'var(--text-muted)', flex: 1 }}>{m.nome}</span>
                                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(82,168,123,0.1)', color: '#52A87B', fontWeight: 600 }}>{m.funcao}</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Membros ad-hoc (digitados na hora) */}
                    {equipeManual.length > 0 && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Adicionais (não cadastrados)</p>
                            {equipeManual.map((m, i) => (
                                <div key={i} style={{ display: 'flex', gap: 6 }}>
                                    <input className="input" placeholder="Nome" value={m.nome} onChange={e => updateManual(i, 'nome', e.target.value)} style={{ flex: 2 }} />
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <select className="input" value={m.funcao} onChange={e => updateManual(i, 'funcao', e.target.value)} style={{ appearance: 'none', paddingRight: 28 }}>
                                            {FUNCOES.map(f => <option key={f}>{f}</option>)}
                                        </select>
                                        <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                    </div>
                                    <button type="button" onClick={() => setEquipeManual(p => p.filter((_, idx) => idx !== i))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Empreiteiros */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <HardHat size={14} style={{ color: 'var(--text-muted)' }} />
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Empreiteiros</p>
                    </div>
                    <div>
                        <label className="form-label">Quantidade de empreiteiros presentes</label>
                        <input className="input" type="number" min="0" placeholder="0" value={form.empreiteiros} onChange={e => set('empreiteiros', e.target.value)} style={{ maxWidth: 160 }} />
                    </div>
                </div>

                {/* Atividades */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Atividades e Ocorrências</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label className="form-label">Descrição das atividades</label>
                            <textarea className="input" rows={4} placeholder="Descreva as atividades realizadas..." value={form.descricao_atividades} onChange={e => set('descricao_atividades', e.target.value)} style={{ resize: 'vertical', minHeight: 90 }} />
                        </div>
                        <div>
                            <label className="form-label">Ocorrências / Observações</label>
                            <textarea className="input" rows={3} placeholder="Alguma ocorrência relevante?" value={form.ocorrencias} onChange={e => set('ocorrencias', e.target.value)} style={{ resize: 'vertical', minHeight: 70 }} />
                        </div>
                    </div>
                </div>

                {/* Fotos */}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Fotos</p>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', borderRadius: 12, border: '2px dashed rgba(82,168,123,0.25)', padding: '20px', color: '#52A87B', background: 'rgba(82,168,123,0.04)' }}>
                        <Camera size={20} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Adicionar fotos</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                            const files = Array.from(e.target.files || []).slice(0, 10)
                            setFotos(prev => [...prev, ...files].slice(0, 10))
                        }} style={{ display: 'none' }} />
                    </label>
                    {fotos.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                            {fotos.map((f, i) => (
                                <div key={i} style={{ position: 'relative' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={URL.createObjectURL(f)} alt="" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }} />
                                    <button type="button" onClick={() => setFotos(p => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={10} color="white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" disabled={loading} style={{ padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #52A87B, #3d8460)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(82,168,123,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><ClipboardList size={16} /> Salvar RDO</>}
                </button>
            </form>
        </div>
    )
}
