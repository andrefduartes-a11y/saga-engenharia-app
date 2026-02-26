'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const LISTA_CAMINHOES = [
    'Caminhão Toco',
    'Caminhão Truck',
    'Caminhão Traçado',
    'Carreta',
    'Caminhão Basculante',
    'Betoneira',
    'Bi-Trem',
    'Prancha',
    'Outro'
]

export default function NovoRomaneio() {
    const [obras, setObras] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [outroCaminhao, setOutroCaminhao] = useState(false)
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
        const dataViagem = (form.elements.namedItem('data') as HTMLInputElement).value
        const qtd_viagens = Number((form.elements.namedItem('qtd_viagens') as HTMLInputElement).value)
        const placa = (form.elements.namedItem('placa') as HTMLInputElement).value || null
        const material_transportado = (form.elements.namedItem('material_transportado') as HTMLInputElement).value
        const origem = (form.elements.namedItem('origem') as HTMLInputElement).value
        const destino = (form.elements.namedItem('destino') as HTMLInputElement).value

        let tipo_caminhao = (form.elements.namedItem('tipo_caminhao') as HTMLSelectElement).value
        if (tipo_caminhao === 'Outro') {
            tipo_caminhao = (form.elements.namedItem('caminhao_outro') as HTMLInputElement).value
        }

        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase.from('viagens_caminhao').insert({
            obra_id,
            data: dataViagem,
            tipo_caminhao,
            placa,
            qtd_viagens,
            material_transportado,
            origem,
            destino,
            created_by: user?.id,
        })

        if (insertError) {
            setError(`Erro ao salvar: ${insertError.message}`)
            setLoading(false)
            return
        }

        router.push('/caminhoes')
        router.refresh()
    }

    return (
        <div className="px-4 py-4 space-y-5 animate-fade-up">
            <div className="flex items-center gap-3">
                <Link href="/caminhoes" className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Registrar Viagens</h1>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-4">
                {error && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(217, 82, 82, 0.1)', border: '1px solid rgba(217, 82, 82, 0.2)', color: '#D95252' }}>{error}</div>}

                <div>
                    <label className="label">Obra Destino/Origem</label>
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
                        <label className="label">Qtd. Viagens</label>
                        <input name="qtd_viagens" type="number" min="1" className="input" placeholder="Ex: 5" required />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Tipo de Caminhão</label>
                        <select name="tipo_caminhao" className="input" onChange={e => setOutroCaminhao(e.target.value === 'Outro')} required>
                            <option value="">Selecione...</option>
                            {LISTA_CAMINHOES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Placa (Opcional)</label>
                        <input name="placa" type="text" className="input uppercase" placeholder="ABC-1234" />
                    </div>
                </div>

                {outroCaminhao && (
                    <div className="animate-fade-up">
                        <label className="label">Qual caminhão/carreta?</label>
                        <input name="caminhao_outro" type="text" className="input" placeholder="Digite o tipo..." required />
                    </div>
                )}

                <div>
                    <label className="label">Material Transportado</label>
                    <input name="material_transportado" type="text" className="input" placeholder="Ex: Terra, Areia, Brita, Entulho..." required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">De onde? (Origem)</label>
                        <input name="origem" type="text" className="input" placeholder="Ex: Jazida" required />
                    </div>
                    <div>
                        <label className="label">Para onde? (Destino)</label>
                        <input name="destino" type="text" className="input" placeholder="Ex: Obra Loteamento" required />
                    </div>
                </div>

                <button type="submit" className="btn-primary mt-4" disabled={loading}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Registrar Romaneio'}
                </button>
            </form>
        </div>
    )
}
