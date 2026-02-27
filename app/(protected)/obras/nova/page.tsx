'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NovaObraPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const form = e.currentTarget
        const data = Object.fromEntries(new FormData(form))

        const { error } = await supabase.from('obras').insert({
            nome: data.nome,
            spe_id: data.spe_id || null,
            status: data.status,
            cidade: data.cidade || null,
            endereco: data.endereco || null,
            responsavel_tecnico: data.responsavel_tecnico || null,
            data_inicio: data.data_inicio || null,
            data_previsao_fim: data.data_previsao_fim || null,
        })

        if (error) {
            setError('Erro ao salvar obra. Tente novamente.')
            setLoading(false)
            return
        }

        router.push('/obras')
        router.refresh()
    }

    return (
        <div className="px-4 py-4 animate-fade-up">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/obras" className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
                </Link>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Nova Obra</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="card space-y-4">
                    <div>
                        <label className="label">Nome da Obra *</label>
                        <input name="nome" type="text" className="input" placeholder="Ex: Residencial Bela Vista" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Cidade *</label>
                            <input name="cidade" type="text" className="input" placeholder="Ex: Belo Horizonte" required />
                        </div>
                        <div>
                            <label className="label">Bairro / Endereço</label>
                            <input name="endereco" type="text" className="input" placeholder="Ex: Savassi" />
                        </div>
                    </div>
                    <div>
                        <label className="label">Responsável Técnico</label>
                        <input name="responsavel_tecnico" type="text" className="input" placeholder="Ex: João Silva - CREA 12345" />
                    </div>
                    <div>
                        <label className="label">SPE / ID</label>
                        <input name="spe_id" type="text" className="input" placeholder="Ex: SPE-001" />
                    </div>
                    <div>
                        <label className="label">Status</label>
                        <select name="status" className="input">
                            <option value="ativa">Ativa</option>
                            <option value="pausada">Pausada</option>
                            <option value="concluida">Concluída</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Data de início</label>
                            <input name="data_inicio" type="date" className="input" />
                        </div>
                        <div>
                            <label className="label">Previsão de fim</label>
                            <input name="data_previsao_fim" type="date" className="input" />
                        </div>
                    </div>
                </div>

                {error && (
                    <p className="text-sm px-2" style={{ color: '#E05252' }}>{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : <><Building2 size={18} /> Salvar Obra</>}
                </button>
            </form>
        </div>
    )
}
