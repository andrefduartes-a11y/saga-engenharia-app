'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useObra } from '@/lib/obra-context'
import { ArrowLeft } from 'lucide-react'

const ELEMENTOS = [
    'Sapata', 'Bloco', 'Pilar', 'Viga', 'Laje', 'Escada', 'Muro de Contenção',
    'Radier', 'Fundação', 'Parede Estrutural', 'Reservatório', 'Piso'
]

const CORES = [
    '#7FA653', '#4A90D9', '#E85D75', '#D4A843', '#9B59B6',
    '#E67E22', '#1ABC9C', '#E74C3C', '#3498DB', '#525F6B'
]

export default function ConcretoNovoPage() {
    const router = useRouter()
    const { obra } = useObra()
    const supabase = createClient()
    const [form, setForm] = useState({
        data_concretagem: new Date().toISOString().split('T')[0],
        fck: 25,
        volume_m3: '',
        elementos_concretados: [] as string[],
        fornecedor: '',
        caminhao: '',
        nota_fiscal: '',
        responsavel: '',
        cor_hex: '#7FA653',
    })
    const [salvando, setSalvando] = useState(false)

    const toggleElemento = (el: string) => {
        setForm(p => ({
            ...p,
            elementos_concretados: p.elementos_concretados.includes(el)
                ? p.elementos_concretados.filter(e => e !== el)
                : [...p.elementos_concretados, el]
        }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!obra) return alert('Selecione uma obra primeiro')
        setSalvando(true)
        const { error } = await supabase.from('concretagens').insert({
            obra_id: obra.id,
            data_concretagem: form.data_concretagem,
            fck: Number(form.fck),
            volume_m3: Number(form.volume_m3),
            elementos_concretados: form.elementos_concretados,
            fornecedor: form.fornecedor || null,
            caminhao: form.caminhao || null,
            nota_fiscal: form.nota_fiscal || null,
            responsavel: form.responsavel || null,
            cor_hex: form.cor_hex,
        })
        if (!error) router.push('/concreto')
        else { alert('Erro ao salvar'); setSalvando(false) }
    }

    return (
        <div className="px-4 py-4 space-y-5 animate-fade-up">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Nova Concretagem</h1>
            </div>

            {!obra && (
                <div className="card text-center py-6">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selecione uma obra primeiro</p>
                </div>
            )}

            {obra && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="card space-y-4">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>DADOS PRINCIPAIS</p>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="form-label">Data</label>
                                <input className="input" type="date" required
                                    value={form.data_concretagem}
                                    onChange={e => setForm(p => ({ ...p, data_concretagem: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">FCK (MPa)</label>
                                <input className="input" type="number" required min={1}
                                    value={form.fck}
                                    onChange={e => setForm(p => ({ ...p, fck: Number(e.target.value) }))} />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Volume (m³)</label>
                            <input className="input" type="number" step="0.1" required placeholder="Ex: 12.5"
                                value={form.volume_m3}
                                onChange={e => setForm(p => ({ ...p, volume_m3: e.target.value }))} />
                        </div>
                    </div>

                    {/* Elementos */}
                    <div className="card space-y-3">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>ELEMENTOS CONCRETADOS</p>
                        <div className="flex flex-wrap gap-2">
                            {ELEMENTOS.map(el => (
                                <button key={el} type="button"
                                    onClick={() => toggleElemento(el)}
                                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                                    style={{
                                        background: form.elementos_concretados.includes(el) ? 'var(--green-primary)' : 'var(--bg-card)',
                                        color: form.elementos_concretados.includes(el) ? '#fff' : 'var(--text-secondary)',
                                        border: `1px solid ${form.elementos_concretados.includes(el) ? 'var(--green-primary)' : 'var(--border-subtle)'}`,
                                    }}>
                                    {el}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cor de identificação */}
                    <div className="card space-y-3">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>COR DE IDENTIFICAÇÃO</p>
                        <div className="flex flex-wrap gap-3">
                            {CORES.map(cor => (
                                <button key={cor} type="button"
                                    onClick={() => setForm(p => ({ ...p, cor_hex: cor }))}
                                    className="w-8 h-8 rounded-full transition-all"
                                    style={{
                                        background: cor,
                                        boxShadow: form.cor_hex === cor ? `0 0 0 3px white, 0 0 0 5px ${cor}` : 'none'
                                    }} />
                            ))}
                        </div>
                    </div>

                    {/* Dados adicionais */}
                    <div className="card space-y-3">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>INFORMAÇÕES ADICIONAIS</p>
                        <div>
                            <label className="form-label">Fornecedor / Concreteira</label>
                            <input className="input" placeholder="Nome da concreteira"
                                value={form.fornecedor}
                                onChange={e => setForm(p => ({ ...p, fornecedor: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="form-label">Betoneira / Caminhão</label>
                                <input className="input" placeholder="Placa ou nº"
                                    value={form.caminhao}
                                    onChange={e => setForm(p => ({ ...p, caminhao: e.target.value }))} />
                            </div>
                            <div>
                                <label className="form-label">Nota Fiscal</label>
                                <input className="input" placeholder="Nº da NF"
                                    value={form.nota_fiscal}
                                    onChange={e => setForm(p => ({ ...p, nota_fiscal: e.target.value }))} />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Responsável Técnico</label>
                            <input className="input" placeholder="Eng. responsável"
                                value={form.responsavel}
                                onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} />
                        </div>
                    </div>

                    <button type="submit" disabled={salvando} className="btn-primary w-full">
                        {salvando ? 'Salvando...' : 'Registrar Concretagem'}
                    </button>
                </form>
            )}
        </div>
    )
}
