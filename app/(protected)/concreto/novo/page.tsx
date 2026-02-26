'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, HardHat, Loader2, Camera, X } from 'lucide-react'
import Link from 'next/link'

export default function NovaConcretagemPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [obras, setObras] = useState<any[]>([])
    const [fotos, setFotos] = useState<File[]>([])
    const router = useRouter()
    const searchParams = useSearchParams()
    const obraPreSelecionada = searchParams.get('obra') || ''
    const supabase = createClient()

    useEffect(() => {
        supabase.from('obras').select('id, nome').eq('status', 'ativa').then(({ data }) => setObras(data || []))
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const form = e.currentTarget
        const formData = new FormData(form)
        const obraId = formData.get('obra_id') as string

        const fotosUrls: string[] = []
        for (const foto of fotos) {
            const path = `${obraId}/concreto/${Date.now()}-${foto.name}`
            const { data } = await supabase.storage.from('saga-engenharia').upload(path, foto)
            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
                fotosUrls.push(publicUrl)
            }
        }

        const { error: dbError } = await supabase.from('concretagens').insert({
            obra_id: obraId,
            data: formData.get('data'),
            fornecedor: formData.get('fornecedor') || null,
            fck: formData.get('fck') ? Number(formData.get('fck')) : null,
            volume: formData.get('volume') ? Number(formData.get('volume')) : null,
            elemento: formData.get('elemento') || null,
            custo_real: formData.get('custo_real') ? Number(formData.get('custo_real')) : null,
            fotos_url: fotosUrls,
        })

        if (dbError) {
            setError('Erro ao salvar concretagem.')
            setLoading(false)
            return
        }

        router.push('/concreto')
        router.refresh()
    }

    return (
        <div className="px-4 py-4 animate-fade-up">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/concreto" className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
                </Link>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Nova Concretagem</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="card space-y-4">
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>DADOS DA CONCRETAGEM</h2>
                    <div>
                        <label className="label">Obra *</label>
                        <select name="obra_id" className="input" required defaultValue={obraPreSelecionada}>
                            <option value="">Selecione a obra</option>
                            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Data *</label>
                            <input name="data" type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} required />
                        </div>
                        <div>
                            <label className="label">FCK (MPa) *</label>
                            <input name="fck" type="number" min="0" className="input" placeholder="Ex: 25" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Volume (m³) *</label>
                            <input name="volume" type="number" step="0.1" min="0" className="input" placeholder="Ex: 18.5" required />
                        </div>
                        <div>
                            <label className="label">Custo real (R$)</label>
                            <input name="custo_real" type="number" step="0.01" min="0" className="input" placeholder="0,00" />
                        </div>
                    </div>
                    <div>
                        <label className="label">Elemento estrutural</label>
                        <input name="elemento" type="text" className="input" placeholder="Ex: Laje do 3º Pavimento" />
                    </div>
                    <div>
                        <label className="label">Fornecedor</label>
                        <input name="fornecedor" type="text" className="input" placeholder="Ex: Concrebras" />
                    </div>
                </div>

                <div className="card">
                    <label className="label">Fotos</label>
                    <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl border-2 border-dashed py-6 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        <Camera size={22} />
                        <span className="text-sm">Adicionar fotos</span>
                        <input type="file" accept="image/*" multiple className="hidden"
                            onChange={e => setFotos(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 10))} />
                    </label>
                    {fotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {fotos.map((f, i) => (
                                <div key={i} className="relative">
                                    <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                    <button type="button" onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#E05252' }}>
                                        <X size={10} color="white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && <p className="text-sm px-2" style={{ color: '#E05252' }}>{error}</p>}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : <><HardHat size={18} /> Salvar Concretagem</>}
                </button>
            </form>
        </div>
    )
}
