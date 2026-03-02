'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const LISTA_EQUIPAMENTOS = [
    'Escavadeira Hidráulica',
    'Retroescavadeira',
    'Pá Carregadeira',
    'Rolo Compactador',
    'Bobcat',
    'Caminhão Pipa',
    'Caminhão Munck',
    'Betoneira',
    'Gerador',
    'Outro'
]

export default function NovoApontamentoEquipamento() {
    const [obras, setObras] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [outroEquipamento, setOutroEquipamento] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        supabase.from('obras').select('id, nome').eq('status', 'ativa').then(({ data }) => setObras(data || []))
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const form = e.currentTarget

        const obra_id = (form.elements.namedItem('obra_id') as HTMLSelectElement).value
        const dataApontamento = (form.elements.namedItem('data') as HTMLInputElement).value
        const horas_trabalhadas = Number((form.elements.namedItem('horas_trabalhadas') as HTMLInputElement).value)
        const atividade_realizada = (form.elements.namedItem('atividade_realizada') as HTMLInputElement).value
        const observacao = (form.elements.namedItem('observacao') as HTMLTextAreaElement).value

        let equipamento = (form.elements.namedItem('equipamento') as HTMLSelectElement).value
        if (equipamento === 'Outro') {
            equipamento = (form.elements.namedItem('equipamento_outro') as HTMLInputElement).value
        }

        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase.from('apontamento_equipamentos').insert({
            obra_id,
            data: dataApontamento,
            equipamento,
            horas_trabalhadas,
            atividade_realizada,
            observacao,
            created_by: user?.id,
        })

        if (insertError) {
            setError(`Erro ao salvar: ${insertError.message}`)
            setLoading(false)
            return
        }

        router.push('/equipamentos')
        router.refresh()
    }

    return (
        <div className="px-4 py-4 space-y-5 animate-fade-up">
            <div className="flex items-center gap-3">
                <Link href="/equipamentos" className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Lançar Horas</h1>
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
                        <label className="label">Data</label>
                        <input name="data" type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                    <div>
                        <label className="label">Horas Trabalhadas</label>
                        <input name="horas_trabalhadas" type="number" step="0.5" min="0" className="input" placeholder="Ex: 8.5" required />
                    </div>
                </div>

                <div>
                    <label className="label">Equipamento</label>
                    <select name="equipamento" className="input" onChange={e => setOutroEquipamento(e.target.value === 'Outro')} required>
                        <option value="">Selecione a máquina...</option>
                        {LISTA_EQUIPAMENTOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                {outroEquipamento && (
                    <div className="animate-fade-up">
                        <label className="label">Qual equipamento?</label>
                        <input name="equipamento_outro" type="text" className="input" placeholder="Digite o nome..." required />
                    </div>
                )}

                <div>
                    <label className="label">Atividade Realizada</label>
                    <input name="atividade_realizada" type="text" className="input" placeholder="Ex: Escavação de valas" required />
                </div>

                <div>
                    <label className="label">Observações</label>
                    <textarea name="observacao" className="input min-h-[80px]" placeholder="Ex: Parado 2h por manutenção..."></textarea>
                </div>

                <button type="submit" className="btn-primary mt-4" disabled={loading}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Salvar Apontamento'}
                </button>
            </form>
        </div>
    )
}
