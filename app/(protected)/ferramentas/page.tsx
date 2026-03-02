'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import {
    Wrench, Plus, CheckCircle, RotateCcw, X, Building2,
    ChevronDown, Printer, AlertTriangle, Edit2, Search, Loader2
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
type FerramentaStatus = 'disponivel' | 'em_uso' | 'em_manutencao'

interface Ferramenta {
    id: string
    nome: string
    numero_id: string
    tipo?: string
    status: FerramentaStatus
    obra_id?: string
    responsavel?: string
    observacoes?: string
    obras?: { nome: string } | { nome: string }[]
}

interface ObraSimples { id: string; nome: string }
interface Locacao {
    id: string
    ferramenta_id: string
    obra_id?: string
    responsavel: string
    data_saida: string
    data_retorno?: string
    status_retorno?: string
    observacoes?: string
    obras?: { nome: string } | { nome: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
const today = () => new Date().toISOString().split('T')[0]

const STATUS_CONFIG: Record<FerramentaStatus, { label: string; color: string; bg: string }> = {
    disponivel: { label: 'Disponível', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    em_uso: { label: 'Em Uso', color: '#3498DB', bg: 'rgba(52,152,219,0.12)' },
    em_manutencao: { label: 'Em Manutenção', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
}

const obraName = (o?: { nome: string } | { nome: string }[]) =>
    o ? (Array.isArray(o) ? o[0]?.nome : o.nome) : undefined

// ─── Modal Locar ──────────────────────────────────────────────────────────────
function ModalLocar({
    ferramenta, obras, onClose, onSave
}: {
    ferramenta: Ferramenta
    obras: ObraSimples[]
    onClose: () => void
    onSave: (loc: Locacao, ferrUpdated: Partial<Ferramenta>) => void
}) {
    const supabase = createClient()
    const [form, setForm] = useState({ obra_id: '', responsavel: '', data_saida: today(), observacoes: '' })
    const [salvando, setSalvando] = useState(false)
    const [err, setErr] = useState('')
    const printRef = useRef<HTMLDivElement>(null)

    async function handleSalvar() {
        if (!form.obra_id) { setErr('Selecione a obra.'); return }
        if (!form.responsavel.trim()) { setErr('Informe o responsável.'); return }
        setSalvando(true); setErr('')

        const { data: { user } } = await supabase.auth.getUser()
        const { data: perfil } = await supabase.from('perfis').select('nome').eq('id', user?.id ?? '').single()
        const criado_por_nome = perfil?.nome || user?.email?.split('@')[0] || 'Usuário'

        const { data: loc, error } = await supabase.from('locacoes_ferramentas').insert({
            ferramenta_id: ferramenta.id,
            obra_id: form.obra_id,
            responsavel: form.responsavel.trim(),
            data_saida: form.data_saida,
            observacoes: form.observacoes || null,
            criado_por_id: user?.id ?? null,
            criado_por_nome,
        }).select('*, obras(nome)').single()

        if (error) { setErr('Erro ao salvar: ' + error.message); setSalvando(false); return }

        // Atualizar status da ferramenta
        await supabase.from('ferramentas_internas').update({
            status: 'em_uso',
            obra_id: form.obra_id,
            responsavel: form.responsavel.trim(),
        }).eq('id', ferramenta.id)

        onSave(loc as Locacao, { status: 'em_uso', obra_id: form.obra_id, responsavel: form.responsavel.trim() })

        // Abrir PDF após salvar
        setTimeout(() => window.print(), 400)
    }

    const obraLocacao = obras.find(o => o.id === form.obra_id)

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 'min(520px, 96vw)', background: 'var(--bg-card)',
                border: '1px solid rgba(52,152,219,0.3)', borderRadius: 18,
                zIndex: 201, padding: '24px', maxHeight: '92vh', overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                            📤 Locar Ferramenta
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {ferramenta.nome} · #{ferramenta.numero_id}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Obra */}
                    <div>
                        <label className="form-label"><Building2 size={10} style={{ display: 'inline', marginRight: 4 }} />Obra *</label>
                        <div style={{ position: 'relative' }}>
                            <select className="input" value={form.obra_id} onChange={e => setForm(p => ({ ...p, obra_id: e.target.value }))} style={{ appearance: 'none', paddingRight: 36 }}>
                                <option value="">Selecione...</option>
                                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                            </select>
                            <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    {/* Responsável */}
                    <div>
                        <label className="form-label">Responsável *</label>
                        <input className="input" placeholder="Nome de quem retira" value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} />
                    </div>

                    {/* Data saída */}
                    <div>
                        <label className="form-label">Data de Saída *</label>
                        <input className="input" type="date" value={form.data_saida} onChange={e => setForm(p => ({ ...p, data_saida: e.target.value }))} />
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="form-label">Observações</label>
                        <textarea className="input" rows={2} placeholder="Opcional..." value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
                    </div>

                    {err && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 12 }}>
                            {err}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button onClick={handleSalvar} disabled={salvando} style={{ flex: 2, padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg, #3498DB, #2980b9)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {salvando ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><Printer size={14} /> Confirmar e Gerar PDF</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Romaneio para impressão ── */}
            <div className="print-only" style={{ display: 'none' }}>
                <RomaneioParaImprimir ferramenta={ferramenta} obraNome={obraLocacao?.nome} responsavel={form.responsavel} dataSaida={form.data_saida} observacoes={form.observacoes} />
            </div>
        </>
    )
}

// ─── Componente Romaneio PDF ───────────────────────────────────────────────────
function RomaneioParaImprimir({ ferramenta, obraNome, responsavel, dataSaida, observacoes }: {
    ferramenta: Ferramenta
    obraNome?: string
    responsavel: string
    dataSaida: string
    observacoes?: string
}) {
    return (
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a1a', padding: '40px', maxWidth: 700, margin: '0 auto' }}>
            {/* Cabeçalho */}
            <div style={{ borderBottom: '3px solid #D4A843', paddingBottom: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', color: '#1a1a1a' }}>SAGA</div>
                    <div style={{ fontSize: 11, color: '#666', letterSpacing: '0.2em' }}>ENGENHARIA</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>ROMANEIO DE LOCAÇÃO</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Equipamentos e Ferramentas</div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
                        Data de emissão: {fmt(today())}
                    </div>
                </div>
            </div>

            {/* Dados da ferramenta */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                        <th colSpan={4} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '2px solid #D4A843' }}>
                            DADOS DO EQUIPAMENTO
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: '#666', fontWeight: 600, width: '25%' }}>Equipamento</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{ferramenta.nome}</td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: '#666', fontWeight: 600, width: '20%' }}>N° de ID</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#1a1a1a', fontFamily: 'monospace' }}>#{ferramenta.numero_id}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: '#666', fontWeight: 600 }}>Obra / Destino</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }} colSpan={3}>{obraNome || '—'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: '#666', fontWeight: 600 }}>Responsável</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{responsavel}</td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: '#666', fontWeight: 600 }}>Data de Saída</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{fmt(dataSaida)}</td>
                    </tr>
                    {observacoes && (
                        <tr>
                            <td style={{ padding: '10px 12px', fontSize: 11, color: '#666', fontWeight: 600 }}>Observações</td>
                            <td colSpan={3} style={{ padding: '10px 12px', fontSize: 12, color: '#1a1a1a' }}>{observacoes}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Assinaturas */}
            <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                <div>
                    <div style={{ borderTop: '1px solid #999', paddingTop: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#666' }}>{responsavel}</div>
                        <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Responsável pela Retirada</div>
                    </div>
                </div>
                <div>
                    <div style={{ borderTop: '1px solid #999', paddingTop: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#666' }}>SAGA Engenharia</div>
                        <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Responsável pela Entrega</div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 40, paddingTop: 16, borderTop: '1px solid #e5e7eb', fontSize: 10, color: '#999', textAlign: 'center' }}>
                Documento gerado pelo sistema SAGA Engenharia em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
        </div>
    )
}

// ─── Modal Baixa ──────────────────────────────────────────────────────────────
function ModalBaixa({
    ferramenta, onClose, onSave
}: {
    ferramenta: Ferramenta
    onClose: () => void
    onSave: (statusRetorno: FerramentaStatus) => void
}) {
    const supabase = createClient()
    const [statusRetorno, setStatusRetorno] = useState<'disponivel' | 'em_manutencao'>('disponivel')
    const [dataRetorno, setDataRetorno] = useState(today())
    const [observacoes, setObservacoes] = useState('')
    const [salvando, setSalvando] = useState(false)

    async function handleSalvar() {
        setSalvando(true)

        // Buscar locação ativa
        const { data: locacoes } = await supabase.from('locacoes_ferramentas')
            .select('id')
            .eq('ferramenta_id', ferramenta.id)
            .is('data_retorno', null)
            .order('created_at', { ascending: false })
            .limit(1)

        if (locacoes && locacoes.length > 0) {
            await supabase.from('locacoes_ferramentas').update({
                data_retorno: dataRetorno,
                status_retorno: statusRetorno,
                observacoes: observacoes || null,
            }).eq('id', locacoes[0].id)
        }

        await supabase.from('ferramentas_internas').update({
            status: statusRetorno,
            obra_id: null,
            responsavel: null,
        }).eq('id', ferramenta.id)

        onSave(statusRetorno)
    }

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 'min(440px, 96vw)', background: 'var(--bg-card)',
                border: '1px solid rgba(16,185,129,0.3)', borderRadius: 18,
                zIndex: 201, padding: '24px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>📥 Dar Baixa</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{ferramenta.nome} · #{ferramenta.numero_id}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Status de retorno */}
                    <div>
                        <label className="form-label">Status de Retorno *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                            {[
                                { value: 'disponivel', label: '✅ Disponível', desc: 'Pronto para uso', color: '#10B981' },
                                { value: 'em_manutencao', label: '🔧 Manutenção', desc: 'Requer reparo', color: '#F59E0B' },
                            ].map(opt => (
                                <button key={opt.value} type="button" onClick={() => setStatusRetorno(opt.value as any)}
                                    style={{
                                        padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                        background: statusRetorno === opt.value ? `${opt.color}15` : 'rgba(255,255,255,0.03)',
                                        border: `2px solid ${statusRetorno === opt.value ? opt.color : 'var(--border-subtle)'}`,
                                        transition: 'all 0.15s',
                                    }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: statusRetorno === opt.value ? opt.color : 'var(--text-primary)' }}>{opt.label}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data retorno */}
                    <div>
                        <label className="form-label">Data de Retorno</label>
                        <input className="input" type="date" value={dataRetorno} onChange={e => setDataRetorno(e.target.value)} />
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="form-label">Observações</label>
                        <textarea className="input" rows={2} placeholder="Condição da ferramenta, observações..." value={observacoes} onChange={e => setObservacoes(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button onClick={handleSalvar} disabled={salvando} style={{ flex: 2, padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            {salvando ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><CheckCircle size={14} /> Confirmar Retorno</>}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FerramentasPage() {
    const { obra: obraCtx, role } = useObra()
    const isDirector = role === 'diretor' || role === 'admin'
    const supabase = createClient()

    const [ferramentas, setFerramentas] = useState<Ferramenta[]>([])
    const [obras, setObras] = useState<ObraSimples[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')
    const [modalLocarId, setModalLocarId] = useState<string | null>(null)
    const [modalBaixaId, setModalBaixaId] = useState<string | null>(null)
    const [filtroStatus, setFiltroStatus] = useState<string>('todos')

    useEffect(() => {
        async function load() {
            setLoading(true)
            const [ferrRes, obrasRes] = await Promise.all([
                supabase.from('ferramentas_internas').select('*, obras(nome)').order('nome'),
                supabase.from('obras').select('id, nome').order('nome'),
            ])
            setFerramentas(ferrRes.data || [])
            setObras(obrasRes.data || [])
            setLoading(false)
        }
        load()
    }, [])

    const ferramentaLocar = ferramentas.find(f => f.id === modalLocarId)
    const ferramentaBaixa = ferramentas.find(f => f.id === modalBaixaId)

    const ferramentasFiltradas = ferramentas.filter(f => {
        const matchBusca = !busca || f.nome.toLowerCase().includes(busca.toLowerCase()) || f.numero_id.toLowerCase().includes(busca.toLowerCase())
        const matchStatus = filtroStatus === 'todos' || f.status === filtroStatus
        return matchBusca && matchStatus
    })

    function handleSaveLocacao(loc: Locacao, ferrUpdated: Partial<Ferramenta>) {
        setFerramentas(prev => prev.map(f => f.id === loc.ferramenta_id ? { ...f, ...ferrUpdated } : f))
        setModalLocarId(null)
    }

    function handleSaveBaixa(statusRetorno: FerramentaStatus) {
        setFerramentas(prev => prev.map(f => f.id === modalBaixaId ? { ...f, status: statusRetorno, obra_id: undefined, responsavel: undefined } : f))
        setModalBaixaId(null)
    }

    const counts = {
        disponivel: ferramentas.filter(f => f.status === 'disponivel').length,
        em_uso: ferramentas.filter(f => f.status === 'em_uso').length,
        em_manutencao: ferramentas.filter(f => f.status === 'em_manutencao').length,
    }

    return (
        <>
            {/* Print styles */}
            <style>{`
                @media print {
                    body > *:not(.print-only) { display: none !important; }
                    .print-only { display: block !important; }
                }
                .print-only { display: none; }
            `}</style>

            <div style={{ padding: '20px', maxWidth: 900 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(127,166,83,0.15)', border: '1px solid rgba(127,166,83,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wrench size={20} style={{ color: '#7FA653' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Raleway', sans-serif" }}>Equipamentos Internos</h1>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Controle de ferramentas e locação</p>
                        </div>
                    </div>
                    <Link href="/ferramentas/nova" style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #7FA653, #6a8f44)',
                        border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                        textDecoration: 'none', boxShadow: '0 4px 14px rgba(127,166,83,0.35)',
                    }}>
                        <Plus size={15} /> Nova Ferramenta
                    </Link>
                </div>

                {/* KPI Pills */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                        { key: 'todos', label: 'Todas', count: ferramentas.length, color: 'var(--text-muted)' },
                        { key: 'disponivel', label: 'Disponíveis', count: counts.disponivel, color: '#10B981' },
                        { key: 'em_uso', label: 'Em Uso', count: counts.em_uso, color: '#3498DB' },
                        { key: 'em_manutencao', label: 'Manutenção', count: counts.em_manutencao, color: '#F59E0B' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFiltroStatus(f.key)} style={{
                            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: filtroStatus === f.key ? `${f.color}20` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${filtroStatus === f.key ? f.color : 'var(--border-subtle)'}`,
                            color: filtroStatus === f.key ? f.color : 'var(--text-muted)',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                            {f.label} · {f.count}
                        </button>
                    ))}
                </div>

                {/* Busca */}
                <div style={{ position: 'relative', marginBottom: 16 }}>
                    <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input className="input" placeholder="Buscar por nome ou N° de ID..." value={busca} onChange={e => setBusca(e.target.value)} style={{ paddingLeft: 38 }} />
                </div>

                {/* Lista */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[1, 2, 3].map(i => <div key={i} style={{ height: 72, borderRadius: 14, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />)}
                    </div>
                ) : ferramentasFiltradas.length === 0 ? (
                    <div style={{ padding: '60px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(127,166,83,0.2)', textAlign: 'center' }}>
                        <Wrench size={48} style={{ margin: '0 auto 14px', display: 'block', color: '#7FA653', opacity: 0.4 }} />
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                            {ferramentas.length === 0 ? 'Nenhuma ferramenta cadastrada' : 'Nenhuma ferramenta encontrada'}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                            {ferramentas.length === 0 ? 'Cadastre seus equipamentos clicando em "Nova Ferramenta"' : 'Tente ajustar os filtros'}
                        </p>
                        {ferramentas.length === 0 && (
                            <Link href="/ferramentas/nova" style={{ padding: '8px 20px', borderRadius: 8, background: 'rgba(127,166,83,0.12)', border: '1px solid rgba(127,166,83,0.3)', color: '#7FA653', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
                                + Nova Ferramenta
                            </Link>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {ferramentasFiltradas.map(f => {
                            const st = STATUS_CONFIG[f.status] || STATUS_CONFIG.disponivel
                            return (
                                <div key={f.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                    {/* Ícone */}
                                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: st.bg, border: `1px solid ${st.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Wrench size={20} style={{ color: st.color }} />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{f.nome}</span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>
                                                #{f.numero_id}
                                            </span>
                                            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.color}33` }}>
                                                {st.label}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {obraName(f.obras) && <span>🏗️ {obraName(f.obras)}</span>}
                                            {f.responsavel && <span>👤 {f.responsavel}</span>}
                                            {f.tipo && <span>📦 {f.tipo}</span>}
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                        {f.status === 'disponivel' && (
                                            <button onClick={() => setModalLocarId(f.id)} style={{
                                                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498DB',
                                                display: 'flex', alignItems: 'center', gap: 5,
                                            }}>
                                                <Printer size={13} /> Locar
                                            </button>
                                        )}
                                        {f.status === 'em_uso' && (
                                            <button onClick={() => setModalBaixaId(f.id)} style={{
                                                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981',
                                                display: 'flex', alignItems: 'center', gap: 5,
                                            }}>
                                                <RotateCcw size={13} /> Dar Baixa
                                            </button>
                                        )}
                                        {f.status === 'em_manutencao' && (
                                            <span style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <AlertTriangle size={12} /> Em reparo
                                            </span>
                                        )}
                                        <Link href={`/ferramentas/${f.id}/editar`} style={{
                                            padding: '7px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
                                            display: 'flex', alignItems: 'center',
                                        }}>
                                            <Edit2 size={13} />
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            {modalLocarId && ferramentaLocar && (
                <ModalLocar ferramenta={ferramentaLocar} obras={obras} onClose={() => setModalLocarId(null)} onSave={handleSaveLocacao} />
            )}
            {modalBaixaId && ferramentaBaixa && (
                <ModalBaixa ferramenta={ferramentaBaixa} onClose={() => setModalBaixaId(null)} onSave={handleSaveBaixa} />
            )}
        </>
    )
}
