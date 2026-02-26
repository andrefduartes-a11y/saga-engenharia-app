'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function NovaFVS() {
    const [obras, setObras] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [verificacoes, setVerificacoes] = useState([{ item: '', conforme: true }])
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        supabase.from('obras').select('id, nome').eq('status', 'ativa').then(({ data }) => setObras(data || []))
    }, [])

    function addCheck() {
        setVerificacoes([...verificacoes, { item: '', conforme: true }])
    }

    function removeCheck(index: number) {
        setVerificacoes(verificacoes.filter((_, i) => i !== index))
    }

    function updateCheck(index: number, field: string, value: any) {
        const newChecks = [...verificacoes]
        newChecks[index] = { ...newChecks[index], [field]: value }
        setVerificacoes(newChecks)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const form = e.currentTarget
        const obra_id = (form.elements.namedItem('obra_id') as HTMLSelectElement).value
        const dataFvs = (form.elements.namedItem('data') as HTMLInputElement).value
        const servico_inspecionado = (form.elements.namedItem('servico_inspecionado') as HTMLInputElement).value
        const local_trecho = (form.elements.namedItem('local_trecho') as HTMLInputElement).value
        const status = (form.elements.namedItem('status') as HTMLSelectElement).value
        const observacoes = (form.elements.namedItem('observacoes') as HTMLTextAreaElement).value

        const { data: { user } } = await supabase.auth.getUser()

        // Filtrar vazios
        const finalChecks = verificacoes.filter(v => v.item.trim() !== '')

        const { error: insertError } = await supabase.from('fvs').insert({
            obra_id,
            data: dataFvs,
            servico_inspecionado,
            local_trecho,
            verificacoes: finalChecks,
            status,
            observacoes,
            created_by: user?.id,
        })

        if (insertError) {
            setError(`Erro ao salvar: ${insertError.message}`)
            setLoading(false)
            return
        }

        router.push('/inspecoes')
        router.refresh()
    }

    return (
        <div className="px-4 py-4 space-y-5 animate-fade-up">
            <div className="flex items-center gap-3">
                <Link href="/inspecoes" className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Nova FVS</h1>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-4">
                {error && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(217, 82, 82, 0.1)', border: '1px solid rgba(217, 82, 82, 0.2)', color: '#D95252' }}>{error}</div>}

                <div>
                    <label className="label">Obra</label>
                    <select name="obra_id" className="input" required>
                        <option value="">Selecione a obra...</option>
                        {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Data da Inspeção</label>
                        <input name="data" type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                    <div>
                        <label className="label">Status Final</label>
                        <select name="status" className="input" required>
                            <option value="em_andamento">Em Andamento</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="reprovado">Reprovado</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label">Serviço Inspecionado</label>
                    <input name="servico_inspecionado" type="text" className="input" placeholder="Ex: Concretagem de Laje" required />
                </div>

                <div>
                    <label className="label">Local / Trecho</label>
                    <input name="local_trecho" type="text" className="input" placeholder="Ex: Bloco A - 2º Pavimento" required />
                </div>

                <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                        <label className="label !mb-0">Itens de Verificação (Checklist)</label>
                        <button type="button" onClick={addCheck} className="text-xs flex items-center gap-1" style={{ color: 'var(--info)' }}>
                            <Plus size={14} /> Adicionar
                        </button>
                    </div>
                    <div className="space-y-2">
                        {verificacoes.map((check, index) => (
                            <div key={index} className="flex items-stretch gap-2">
                                <input
                                    type="text"
                                    className="input flex-1 !min-h-[40px] !text-sm"
                                    placeholder="O que foi verificado?"
                                    value={check.item}
                                    onChange={e => updateCheck(index, 'item', e.target.value)}
                                />
                                <button
                                    type="button"
                                    className={`px-3 flex items-center justify-center rounded-lg text-xs font-semibold ${check.conforme ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                                    onClick={() => updateCheck(index, 'conforme', !check.conforme)}
                                >
                                    {check.conforme ? 'OK' : 'NOK'}
                                </button>
                                {verificacoes.length > 1 && (
                                    <button type="button" onClick={() => removeCheck(index)} className="px-2 flex items-center justify-center" style={{ color: 'var(--red-error)' }}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="label">Observações</label>
                    <textarea name="observacoes" className="input min-h-[80px]" placeholder="Anotações adicionais..."></textarea>
                </div>

                <button type="submit" className="btn-primary mt-4" disabled={loading}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Salvar FVS'}
                </button>
            </form>
        </div>
    )
}
