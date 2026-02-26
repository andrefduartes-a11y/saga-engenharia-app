'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Plus, Trash2, CheckCircle } from 'lucide-react'

interface Registro {
    id: string
    data: string
    equipamentos: string[]
    horas_trabalhadas?: number
    viagens?: number
    volume_movimentado?: number
    observacoes?: string
}

interface Etapa {
    id: string
    nome_etapa: string
    data_inicio?: string
    responsavel?: string
    status: string
    registros_diarios_terra: Registro[]
}

export default function TerrapalagemDetalhePage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { obra } = useObra()
    const supabase = createClient()
    const [etapa, setEtapa] = useState<Etapa | null>(null)
    const [loading, setLoading] = useState(true)
    const [addReg, setAddReg] = useState(false)
    const [form, setForm] = useState({
        data: new Date().toISOString().split('T')[0],
        equipamentos: '',
        horas_trabalhadas: '',
        viagens: '',
        volume_movimentado: '',
        observacoes: '',
    })
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        supabase.from('terraplanagem_etapas')
            .select('*, registros_diarios_terra(*)')
            .eq('id', params.id)
            .single()
            .then(({ data }) => { setEtapa(data); setLoading(false) })
    }, [params.id])

    async function addRegistro() {
        if (!etapa) return
        setSalvando(true)
        const { data } = await supabase.from('registros_diarios_terra').insert({
            etapa_id: etapa.id,
            data: form.data,
            equipamentos: form.equipamentos ? form.equipamentos.split(',').map(s => s.trim()) : [],
            horas_trabalhadas: form.horas_trabalhadas ? Number(form.horas_trabalhadas) : null,
            viagens: form.viagens ? Number(form.viagens) : null,
            volume_movimentado: form.volume_movimentado ? Number(form.volume_movimentado) : null,
            observacoes: form.observacoes || null,
        }).select().single()
        if (data) {
            setEtapa(p => p ? { ...p, registros_diarios_terra: [...p.registros_diarios_terra, data] } : p)
            setAddReg(false)
            setForm({ data: new Date().toISOString().split('T')[0], equipamentos: '', horas_trabalhadas: '', viagens: '', volume_movimentado: '', observacoes: '' })
        }
        setSalvando(false)
    }

    async function finalizarEtapa() {
        if (!etapa) return
        await supabase.from('terraplanagem_etapas').update({ status: 'finalizada' }).eq('id', etapa.id)
        setEtapa(p => p ? { ...p, status: 'finalizada' } : p)
    }

    if (loading) return <div className="px-4 py-4"><div className="card animate-pulse" style={{ height: 200 }} /></div>
    if (!etapa) return <div className="px-4 py-4"><p style={{ color: 'var(--text-muted)' }}>Etapa não encontrada.</p></div>

    const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
    const totalVol = etapa.registros_diarios_terra.reduce((s, r) => s + (r.volume_movimentado || 0), 0)
    const totalHoras = etapa.registros_diarios_terra.reduce((s, r) => s + (r.horas_trabalhadas || 0), 0)
    const totalViagens = etapa.registros_diarios_terra.reduce((s, r) => s + (r.viagens || 0), 0)

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; color: #1a1a1a !important; }
                    .card { background: white !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; }
                }
            `}</style>

            <div className="px-4 py-4 space-y-4 animate-fade-up">
                {/* Header */}
                <div className="no-print flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <ArrowLeft size={18} /> Voltar
                    </button>
                    <div className="flex gap-2">
                        {etapa.status !== 'finalizada' && (
                            <button onClick={finalizarEtapa} className="btn-secondary py-2 px-3 text-sm min-h-[36px] flex items-center gap-1">
                                <CheckCircle size={14} /> Finalizar
                            </button>
                        )}
                        <button onClick={() => window.print()} className="btn-secondary py-2 px-3 text-sm min-h-[36px] flex items-center gap-2">
                            <Printer size={14} /> PDF
                        </button>
                    </div>
                </div>

                {/* Header do relatório */}
                <div style={{ borderBottom: '2px solid #D4A843', paddingBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        SAGA Construtora — Relatório de Terraplanagem
                    </div>
                    {obra && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Obra: {obra.nome}</div>}
                </div>

                {/* Info da Etapa */}
                <div className="card">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{etapa.nome_etapa}</h1>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                            background: etapa.status === 'finalizada' ? 'rgba(16,185,129,0.15)' : 'rgba(212,168,67,0.15)',
                            color: etapa.status === 'finalizada' ? '#10B981' : '#D4A843',
                        }}>
                            {etapa.status === 'finalizada' ? 'Finalizada' : 'Em andamento'}
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <p className="text-xl font-bold" style={{ color: '#D4A843' }}>{totalVol.toFixed(1)}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>m³ movimentados</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold" style={{ color: 'var(--green-primary)' }}>{totalHoras.toFixed(1)}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>horas totais</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalViagens}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>viagens</p>
                        </div>
                    </div>
                </div>

                {/* Registros diários */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="section-title">Registros Diários</h2>
                        <button onClick={() => setAddReg(true)} className="no-print text-xs flex items-center gap-1"
                            style={{ color: 'var(--green-primary)' }}>
                            <Plus size={14} /> Adicionar
                        </button>
                    </div>

                    {addReg && (
                        <div className="card no-print space-y-3 mb-3">
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Novo Registro</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="form-label">Data</label>
                                    <input className="input" type="date" value={form.data}
                                        onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="form-label">Horas Trabalhadas</label>
                                    <input className="input" type="number" step="0.5" placeholder="Ex: 8"
                                        value={form.horas_trabalhadas}
                                        onChange={e => setForm(p => ({ ...p, horas_trabalhadas: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="form-label">Viagens</label>
                                    <input className="input" type="number" placeholder="Qt"
                                        value={form.viagens}
                                        onChange={e => setForm(p => ({ ...p, viagens: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="form-label">Volume (m³)</label>
                                    <input className="input" type="number" step="0.1" placeholder="Ex: 120"
                                        value={form.volume_movimentado}
                                        onChange={e => setForm(p => ({ ...p, volume_movimentado: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Equipamentos (separados por vírgula)</label>
                                <input className="input" placeholder="Ex: Escavadeira CAT 336, Caçamba 1"
                                    value={form.equipamentos}
                                    onChange={e => setForm(p => ({ ...p, equipamentos: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Observações</label>
                                <textarea className="input" rows={2} value={form.observacoes}
                                    onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setAddReg(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                                <button onClick={addRegistro} disabled={salvando} className="btn-primary flex-1 text-sm">
                                    {salvando ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {etapa.registros_diarios_terra.length === 0 ? (
                        <div className="card text-center py-6">
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum registro ainda</p>
                        </div>
                    ) : (
                        <div className="card overflow-hidden" style={{ padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: 'rgba(212,168,67,0.1)' }}>
                                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>Data</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>Horas</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>Viagens</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>m³</th>
                                        <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>Equip.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...etapa.registros_diarios_terra]
                                        .sort((a, b) => a.data > b.data ? -1 : 1)
                                        .map(r => (
                                            <tr key={r.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                                <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>{fmt(r.data)}</td>
                                                <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-primary)' }}>{r.horas_trabalhadas ?? '—'}</td>
                                                <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-primary)' }}>{r.viagens ?? '—'}</td>
                                                <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#D4A843' }}>{r.volume_movimentado ?? '—'}</td>
                                                <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 11 }}>{r.equipamentos?.join(', ') || '—'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Gerado pelo SAGA Engenharia em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
            </div>
        </>
    )
}
