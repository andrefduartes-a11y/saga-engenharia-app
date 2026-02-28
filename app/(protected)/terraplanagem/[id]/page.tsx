'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Printer, Plus, CheckCircle, Truck, Wrench,
    X, Trash2, Calculator, Clock
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Caminhao { id: string; tipo: string; placa: string }
interface Equipamento { id: string; nome: string; tipo?: string }

interface Viagem {
    id: string; etapa_id: string; data: string
    caminhao_id?: string; tipo_caminhao?: string; placa?: string
    quantidade_viagens: number; valor_por_viagem?: number; observacoes?: string
}
interface HoraEquip {
    id: string; etapa_id: string; data: string
    equipamento_id?: string; nome_equipamento?: string
    hora_inicio: string; hora_fim: string; horas_calculadas?: number
    valor_por_hora?: number; observacoes?: string
}
interface Etapa {
    id: string; nome_etapa: string; data_inicio?: string
    responsavel?: string; status: string
}

const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
const brl = (v?: number) => v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'
function calcHoras(ini: string, fim: string): number {
    const [ih, im] = ini.split(':').map(Number)
    const [fh, fm] = fim.split(':').map(Number)
    return Math.max(0, (fh * 60 + fm - (ih * 60 + im)) / 60)
}

// ── Modal "Adicionar Controle" ─────────────────────────────────────────────────
function AddControlModal({
    etapaId, caminhoes, equipamentos,
    onSave, onClose
}: {
    etapaId: string
    caminhoes: Caminhao[]
    equipamentos: Equipamento[]
    onSave: (viagem?: Viagem, hora?: HoraEquip) => void
    onClose: () => void
}) {
    const supabase = createClient()
    const [aba, setAba] = useState<'caminhao' | 'equipamento'>('caminhao')
    const [salvando, setSalvando] = useState(false)
    const today = new Date().toISOString().split('T')[0]
    const [saveError, setSaveError] = useState('')

    // Caminhão form
    const [vForm, setVForm] = useState({
        data: today, caminhao_id: '', tipo_caminhao: '', placa: '',
        quantidade_viagens: '1', valor_por_viagem: '', observacoes: ''
    })
    // Equipamento form
    const [eForm, setEForm] = useState({
        data: today, equipamento_id: '', nome_equipamento: '',
        hora_inicio: '07:00', hora_fim: '17:00',
        valor_por_hora: '', observacoes: ''
    })

    // When selecting a caminhão, auto-fill tipo+placa
    function onSelectCaminhao(id: string) {
        const c = caminhoes.find(c => c.id === id)
        setVForm(p => ({ ...p, caminhao_id: id, tipo_caminhao: c?.tipo || '', placa: c?.placa || '' }))
    }
    // When selecting an equipamento, auto-fill nome
    function onSelectEquip(id: string) {
        const e = equipamentos.find(e => e.id === id)
        setEForm(p => ({ ...p, equipamento_id: id, nome_equipamento: e?.nome || '' }))
    }

    const horasCalc = calcHoras(eForm.hora_inicio, eForm.hora_fim)
    const subtotalViagem = vForm.quantidade_viagens && vForm.valor_por_viagem
        ? Number(vForm.quantidade_viagens) * Number(vForm.valor_por_viagem) : null
    const subtotalEquip = horasCalc > 0 && eForm.valor_por_hora
        ? horasCalc * Number(eForm.valor_por_hora) : null

    async function salvar() {
        setSalvando(true)
        setSaveError('')
        if (aba === 'caminhao') {
            const { data, error } = await supabase.from('controle_viagens_caminhao').insert({
                etapa_id: etapaId,
                data: vForm.data,
                tipo_caminhao: vForm.tipo_caminhao || null,
                placa: vForm.placa || null,
                quantidade_viagens: Number(vForm.quantidade_viagens),
                valor_por_viagem: vForm.valor_por_viagem ? Number(vForm.valor_por_viagem) : null,
                observacoes: vForm.observacoes || null,
            }).select().single()
            if (error) { setSaveError(`Erro ao salvar: ${error.message}`); setSalvando(false); return }
            if (data) { onSave(data as Viagem, undefined); return }
        } else {
            const hCalc = calcHoras(eForm.hora_inicio, eForm.hora_fim)
            const { data, error } = await supabase.from('controle_horas_equipamento').insert({
                etapa_id: etapaId,
                data: eForm.data,
                nome_equipamento: eForm.nome_equipamento || null,
                hora_inicio: eForm.hora_inicio,
                hora_fim: eForm.hora_fim,
                horas_calculadas: hCalc,
                valor_por_hora: eForm.valor_por_hora ? Number(eForm.valor_por_hora) : null,
                observacoes: eForm.observacoes || null,
            }).select().single()
            if (error) { setSaveError(`Erro ao salvar: ${error.message}`); setSalvando(false); return }
            if (data) { onSave(undefined, data as HoraEquip); return }
        }
        setSalvando(false)
    }

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 'min(520px, 96vw)', background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)', borderRadius: 18,
                zIndex: 201, padding: '20px', maxHeight: '90vh', overflowY: 'auto'
            }}>
                {/* Modal header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>+ Registro de Controle</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 20, padding: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                    {(['caminhao', 'equipamento'] as const).map(tab => (
                        <button key={tab} onClick={() => setAba(tab)} style={{
                            flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: 12, transition: 'all 0.15s',
                            background: aba === tab ? (tab === 'caminhao' ? '#E67E22' : '#3498DB') : 'transparent',
                            color: aba === tab ? '#fff' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}>
                            {tab === 'caminhao' ? <Truck size={14} /> : <Wrench size={14} />}
                            {tab === 'caminhao' ? '🚚 Viagem de Caminhão' : '🚜 Hora de Equipamento'}
                        </button>
                    ))}
                </div>

                {/* Caminhão form */}
                {aba === 'caminhao' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label className="form-label">Data *</label>
                            <input className="input" type="date" value={vForm.data} onChange={e => setVForm(p => ({ ...p, data: e.target.value }))} />
                        </div>

                        {caminhoes.length > 0 ? (
                            <div>
                                <label className="form-label">Caminhão</label>
                                <select className="input" value={vForm.caminhao_id} onChange={e => onSelectCaminhao(e.target.value)}>
                                    <option value="">Selecionar caminhão cadastrado...</option>
                                    {caminhoes.map(c => <option key={c.id} value={c.id}>{c.tipo} — {c.placa}</option>)}
                                    <option value="__manual">+ Informar manualmente</option>
                                </select>
                            </div>
                        ) : null}

                        {(!vForm.caminhao_id || vForm.caminhao_id === '__manual') && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label className="form-label">Tipo de Caminhão</label>
                                    <input className="input" placeholder="Ex: Caçamba, Basculante" value={vForm.tipo_caminhao} onChange={e => setVForm(p => ({ ...p, tipo_caminhao: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="form-label">Placa</label>
                                    <input className="input" placeholder="ABC-1234" value={vForm.placa} onChange={e => setVForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))} />
                                </div>
                            </div>
                        )}

                        {vForm.caminhao_id && vForm.caminhao_id !== '__manual' && (
                            <div style={{ padding: '8px 12px', background: 'rgba(230,126,34,0.08)', borderRadius: 8, border: '1px solid rgba(230,126,34,0.2)', fontSize: 12, color: '#E67E22' }}>
                                🚚 {vForm.tipo_caminhao} — {vForm.placa}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label className="form-label">Qtd de Viagens *</label>
                                <input className="input" type="number" min="1" value={vForm.quantidade_viagens} onChange={e => setVForm(p => ({ ...p, quantidade_viagens: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Valor por Viagem (R$)</label>
                                <input className="input" type="number" step="0.01" placeholder="0,00" value={vForm.valor_por_viagem} onChange={e => setVForm(p => ({ ...p, valor_por_viagem: e.target.value }))} />
                            </div>
                        </div>

                        {subtotalViagem != null && (
                            <div style={{ padding: '8px 14px', background: 'rgba(127,166,83,0.1)', borderRadius: 8, border: '1px solid rgba(127,166,83,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><Calculator size={12} style={{ display: 'inline', marginRight: 4 }} />Subtotal</span>
                                <span style={{ fontSize: 15, fontWeight: 800, color: '#7FA653' }}>{brl(subtotalViagem)}</span>
                            </div>
                        )}

                        <div>
                            <label className="form-label">Observações</label>
                            <textarea className="input" rows={2} placeholder="Opcional..." value={vForm.observacoes} onChange={e => setVForm(p => ({ ...p, observacoes: e.target.value }))} />
                        </div>
                    </div>
                )}

                {/* Equipamento form */}
                {aba === 'equipamento' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label className="form-label">Data *</label>
                            <input className="input" type="date" value={eForm.data} onChange={e => setEForm(p => ({ ...p, data: e.target.value }))} />
                        </div>

                        {equipamentos.length > 0 ? (
                            <div>
                                <label className="form-label">Equipamento</label>
                                <select className="input" value={eForm.equipamento_id} onChange={e => onSelectEquip(e.target.value)}>
                                    <option value="">Selecionar equipamento cadastrado...</option>
                                    {equipamentos.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}{eq.tipo ? ` (${eq.tipo})` : ''}</option>)}
                                    <option value="__manual">+ Informar manualmente</option>
                                </select>
                            </div>
                        ) : null}

                        {(!eForm.equipamento_id || eForm.equipamento_id === '__manual') && (
                            <div>
                                <label className="form-label">Nome do Equipamento</label>
                                <input className="input" placeholder="Ex: Escavadeira CAT 336" value={eForm.nome_equipamento} onChange={e => setEForm(p => ({ ...p, nome_equipamento: e.target.value }))} />
                            </div>
                        )}

                        {eForm.equipamento_id && eForm.equipamento_id !== '__manual' && (
                            <div style={{ padding: '8px 12px', background: 'rgba(52,152,219,0.08)', borderRadius: 8, border: '1px solid rgba(52,152,219,0.2)', fontSize: 12, color: '#3498DB' }}>
                                🚜 {eForm.nome_equipamento}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label className="form-label">Hora Início *</label>
                                <input className="input" type="time" value={eForm.hora_inicio} onChange={e => setEForm(p => ({ ...p, hora_inicio: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Hora Fim *</label>
                                <input className="input" type="time" value={eForm.hora_fim} onChange={e => setEForm(p => ({ ...p, hora_fim: e.target.value }))} />
                            </div>
                        </div>

                        <div style={{ padding: '8px 14px', background: 'rgba(52,152,219,0.08)', borderRadius: 8, border: '1px solid rgba(52,152,219,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Horas calculadas</span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#3498DB' }}>{horasCalc.toFixed(2)}h</span>
                        </div>

                        <div>
                            <label className="form-label">Valor por Hora (R$)</label>
                            <input className="input" type="number" step="0.01" placeholder="0,00" value={eForm.valor_por_hora} onChange={e => setEForm(p => ({ ...p, valor_por_hora: e.target.value }))} />
                        </div>

                        {subtotalEquip != null && (
                            <div style={{ padding: '8px 14px', background: 'rgba(127,166,83,0.1)', borderRadius: 8, border: '1px solid rgba(127,166,83,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><Calculator size={12} style={{ display: 'inline', marginRight: 4 }} />Subtotal</span>
                                <span style={{ fontSize: 15, fontWeight: 800, color: '#7FA653' }}>{brl(subtotalEquip)}</span>
                            </div>
                        )}

                        <div>
                            <label className="form-label">Observações</label>
                            <textarea className="input" rows={2} placeholder="Opcional..." value={eForm.observacoes} onChange={e => setEForm(p => ({ ...p, observacoes: e.target.value }))} />
                        </div>
                    </div>
                )}

                {saveError && (
                    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 12, fontWeight: 600 }}>
                        ⚠️ {saveError}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                    <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                    <button onClick={salvar} disabled={salvando} className="btn-primary" style={{ flex: 1 }}>
                        {salvando ? 'Salvando...' : 'Salvar Registro'}
                    </button>
                </div>
            </div>
        </>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TerrapalagemDetalhePage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { obra } = useObra()
    const supabase = createClient()

    const [etapa, setEtapa] = useState<Etapa | null>(null)
    const [viagens, setViagens] = useState<Viagem[]>([])
    const [horas, setHoras] = useState<HoraEquip[]>([])
    const [caminhoes, setCaminhoes] = useState<Caminhao[]>([])
    const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [confirmFinalizar, setConfirmFinalizar] = useState(false)

    useEffect(() => {
        async function load() {
            const [etapaRes, viagensRes, horasRes, camRes, equRes] = await Promise.all([
                supabase.from('terraplanagem_etapas').select('*').eq('id', params.id).single(),
                supabase.from('controle_viagens_caminhao').select('*').eq('etapa_id', params.id).order('data'),
                supabase.from('controle_horas_equipamento').select('*').eq('etapa_id', params.id).order('data'),
                supabase.from('caminhoes').select('id, tipo, placa').order('tipo'),
                supabase.from('equipamentos').select('id, nome, tipo').order('nome'),
            ])
            setEtapa(etapaRes.data as Etapa)
            setViagens(viagensRes.data || [])
            setHoras(horasRes.data || [])
            setCaminhoes(camRes.data || [])
            setEquipamentos(equRes.data || [])
            setLoading(false)
        }
        load()
    }, [params.id])

    function onSave(v?: Viagem, h?: HoraEquip) {
        if (v) setViagens(p => [...p, v].sort((a, b) => a.data > b.data ? 1 : -1))
        if (h) setHoras(p => [...p, h].sort((a, b) => a.data > b.data ? 1 : -1))
        setShowModal(false)
    }

    async function deletarViagem(id: string) {
        await supabase.from('controle_viagens_caminhao').delete().eq('id', id)
        setViagens(p => p.filter(v => v.id !== id))
    }
    async function deletarHora(id: string) {
        await supabase.from('controle_horas_equipamento').delete().eq('id', id)
        setHoras(p => p.filter(h => h.id !== id))
    }

    async function finalizarEtapa() {
        await supabase.from('terraplanagem_etapas').update({ status: 'finalizada' }).eq('id', params.id)
        setEtapa(p => p ? { ...p, status: 'finalizada' } : p)
        setConfirmFinalizar(false)
    }

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalViagens = useMemo(() => viagens.reduce((s, v) => s + v.quantidade_viagens, 0), [viagens])
    const totalCustoViagens = useMemo(() => viagens.reduce((s, v) => s + ((v.quantidade_viagens || 0) * (v.valor_por_viagem || 0)), 0), [viagens])
    const totalHoras = useMemo(() => horas.reduce((s, h) => s + (h.horas_calculadas || 0), 0), [horas])
    const totalCustoEquip = useMemo(() => horas.reduce((s, h) => s + ((h.horas_calculadas || 0) * (h.valor_por_hora || 0)), 0), [horas])
    const totalGeral = totalCustoViagens + totalCustoEquip

    if (loading) return <div className="px-4 py-4"><div className="card animate-pulse" style={{ height: 200 }} /></div>
    if (!etapa) return <div className="px-4 py-4"><p style={{ color: 'var(--text-muted)' }}>Etapa não encontrada.</p></div>

    const finalizada = etapa.status === 'finalizada'

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: #1a1a1a !important; }
                    .card { background: white !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; }
                    table { font-size: 11px !important; }
                }
            `}</style>

            <div style={{ padding: '16px', maxWidth: 900 }}>
                {/* ── Header ── */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {!finalizada && (
                            <button onClick={() => setConfirmFinalizar(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                <CheckCircle size={14} /> Encerrar Serviço
                            </button>
                        )}
                        <button onClick={() => window.print()}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498DB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            <Printer size={14} /> Exportar PDF
                        </button>
                    </div>
                </div>

                {/* ── Print header ── */}
                <div style={{ borderBottom: '2px solid #D4A843', paddingBottom: 10, marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        SAGA Construtora — Controle de Terraplanagem
                    </div>
                    {obra && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Obra: {obra.nome}</div>}
                </div>

                {/* ── Info card / summary ── */}
                <div style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${finalizada ? 'rgba(16,185,129,0.25)' : 'rgba(212,168,67,0.25)'}`, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{etapa.nome_etapa}</h1>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {etapa.data_inicio && <span>Início: {fmt(etapa.data_inicio)}</span>}
                                {etapa.responsavel && <span> · {etapa.responsavel}</span>}
                            </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: finalizada ? 'rgba(16,185,129,0.15)' : 'rgba(212,168,67,0.15)', color: finalizada ? '#10B981' : '#D4A843' }}>
                            {finalizada ? '✅ Finalizada' : '🔨 Em andamento'}
                        </span>
                    </div>

                    {/* KPI grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                        {[
                            { label: 'Viagens', value: totalViagens.toString(), color: '#E67E22' },
                            { label: 'Horas máquina', value: `${totalHoras.toFixed(1)}h`, color: '#3498DB' },
                            { label: 'Custo caminhões', value: brl(totalCustoViagens), color: '#E67E22' },
                            { label: 'Custo equipamentos', value: brl(totalCustoEquip), color: '#3498DB' },
                            { label: 'Custo total', value: brl(totalGeral), color: '#7FA653' },
                        ].map(kpi => (
                            <div key={kpi.label} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{kpi.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Add button ── */}
                {!finalizada && (
                    <div className="no-print" style={{ marginBottom: 20 }}>
                        <button onClick={() => setShowModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            <Plus size={16} /> Adicionar Registro (Caminhão ou Equipamento)
                        </button>
                    </div>
                )}

                {/* ── CAMINHÕES table ── */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#E67E22', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Truck size={14} /> Viagens de Caminhão ({viagens.length} registros)
                    </div>
                    {viagens.length === 0 ? (
                        <div style={{ padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                            Nenhuma viagem registrada
                        </div>
                    ) : (
                        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: 'rgba(230,126,34,0.08)' }}>
                                        {['Data', 'Caminhão', 'Placa', 'Viagens', 'Valor/Viagem', 'Subtotal', ''].map(h => (
                                            <th key={h} style={{ padding: '9px 12px', textAlign: h === '' ? 'center' : 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {viagens.map(v => {
                                        const sub = v.quantidade_viagens * (v.valor_por_viagem || 0)
                                        return (
                                            <tr key={v.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmt(v.data)}</td>
                                                <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{v.tipo_caminhao || '—'}</td>
                                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{v.placa || '—'}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#E67E22' }}>{v.quantidade_viagens}</td>
                                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{brl(v.valor_por_viagem)}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#7FA653' }}>{v.valor_por_viagem ? brl(sub) : '—'}</td>
                                                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                                    {!finalizada && (
                                                        <button onClick={() => deletarViagem(v.id)} className="no-print"
                                                            style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: 4 }}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: 'rgba(230,126,34,0.06)', borderTop: '2px solid rgba(230,126,34,0.2)' }}>
                                        <td colSpan={3} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 800, color: '#E67E22' }}>{totalViagens}</td>
                                        <td />
                                        <td style={{ padding: '8px 12px', fontWeight: 800, color: '#7FA653' }}>{brl(totalCustoViagens)}</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── EQUIPAMENTOS table ── */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#3498DB', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Wrench size={14} /> Horas de Equipamento ({horas.length} registros)
                    </div>
                    {horas.length === 0 ? (
                        <div style={{ padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                            Nenhuma hora registrada
                        </div>
                    ) : (
                        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: 'rgba(52,152,219,0.08)' }}>
                                        {['Data', 'Equipamento', 'Início', 'Fim', 'Horas', 'Valor/h', 'Subtotal', ''].map(h => (
                                            <th key={h} style={{ padding: '9px 12px', textAlign: h === '' ? 'center' : 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {horas.map(h => {
                                        const sub = (h.horas_calculadas || 0) * (h.valor_por_hora || 0)
                                        return (
                                            <tr key={h.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmt(h.data)}</td>
                                                <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>{h.nome_equipamento || '—'}</td>
                                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{h.hora_inicio}</td>
                                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{h.hora_fim}</td>
                                                <td style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#3498DB' }}>{(h.horas_calculadas || 0).toFixed(2)}h</td>
                                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{brl(h.valor_por_hora)}</td>
                                                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#7FA653' }}>{h.valor_por_hora ? brl(sub) : '—'}</td>
                                                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                                                    {!finalizada && (
                                                        <button onClick={() => deletarHora(h.id)} className="no-print"
                                                            style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: 4 }}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: 'rgba(52,152,219,0.06)', borderTop: '2px solid rgba(52,152,219,0.2)' }}>
                                        <td colSpan={4} style={{ padding: '8px 12px', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 800, color: '#3498DB' }}>{totalHoras.toFixed(2)}h</td>
                                        <td />
                                        <td style={{ padding: '8px 12px', fontWeight: 800, color: '#7FA653' }}>{brl(totalCustoEquip)}</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Custo Total ── */}
                {(totalCustoViagens + totalCustoEquip) > 0 && (
                    <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(127,166,83,0.08)', border: '1px solid rgba(127,166,83,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>💰 CUSTO TOTAL DO SERVIÇO</span>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#7FA653' }}>{brl(totalGeral)}</span>
                    </div>
                )}

                {/* Print footer */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Gerado pelo SAGA Engenharia em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <AddControlModal
                    etapaId={etapa.id}
                    caminhoes={caminhoes}
                    equipamentos={equipamentos}
                    onSave={onSave}
                    onClose={() => setShowModal(false)}
                />
            )}

            {/* Confirm finalizar */}
            {confirmFinalizar && (
                <>
                    <div onClick={() => setConfirmFinalizar(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(380px,94vw)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24, zIndex: 301, textAlign: 'center' }}>
                        <CheckCircle size={40} style={{ color: '#10B981', margin: '0 auto 12px', display: 'block' }} />
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Encerrar Serviço?</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Após encerrar não será possível adicionar novos registros. O relatório ficará disponível para exportação em PDF.</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setConfirmFinalizar(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                            <button onClick={finalizarEtapa} className="btn-primary" style={{ flex: 1, background: '#10B981', borderColor: '#10B981' }}>Confirmar</button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
