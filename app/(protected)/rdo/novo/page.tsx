'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ClipboardList, Loader2, Camera, X, Plus, UserPlus, Users, HardHat } from 'lucide-react'
import Link from 'next/link'

interface MembroEquipe {
    nome: string
    funcao: string
}

export default function NovoRdoPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [obras, setObras] = useState<any[]>([])
    const [fotos, setFotos] = useState<File[]>([])
    const [equipe, setEquipe] = useState<MembroEquipe[]>([{ nome: '', funcao: '' }])
    const router = useRouter()
    const searchParams = useSearchParams()
    const obraPreSelecionada = searchParams.get('obra') || ''
    const supabase = createClient()

    useEffect(() => {
        supabase.from('obras').select('id, nome').eq('status', 'ativa').then(({ data }) => setObras(data || []))
    }, [])

    function adicionarMembro() {
        setEquipe(prev => [...prev, { nome: '', funcao: '' }])
    }

    function removerMembro(idx: number) {
        setEquipe(prev => prev.filter((_, i) => i !== idx))
    }

    function atualizarMembro(idx: number, campo: keyof MembroEquipe, valor: string) {
        setEquipe(prev => prev.map((m, i) => i === idx ? { ...m, [campo]: valor } : m))
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const form = e.currentTarget
        const formData = new FormData(form)

        // Upload fotos
        const fotosUrls: string[] = []
        const obraId = formData.get('obra_id') as string

        for (const foto of fotos) {
            const path = `${obraId}/rdos/${Date.now()}-${foto.name}`
            const { data } = await supabase.storage.from('saga-engenharia').upload(path, foto, { cacheControl: '3600' })
            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
                fotosUrls.push(publicUrl)
            }
        }

        const { data: { user } } = await supabase.auth.getUser()

        // Filtra membros com nome preenchido
        const equipeValida = equipe.filter(m => m.nome.trim() !== '')

        const { error: dbError } = await supabase.from('rdos').insert({
            obra_id: obraId,
            data: formData.get('data'),
            clima: formData.get('clima') || null,
            equipe_presente: equipeValida.length,
            equipe_membros: equipeValida,
            empreiteiros_presente: formData.get('empreiteiros') ? Number(formData.get('empreiteiros')) : null,
            descricao_atividades: formData.get('descricao_atividades') || null,
            ocorrencias: formData.get('ocorrencias') || null,
            fotos_url: fotosUrls,
            created_by: user?.id,
        })

        if (dbError) {
            setError('Erro ao salvar RDO. Tente novamente.')
            setLoading(false)
            return
        }

        router.push('/rdo')
        router.refresh()
    }

    return (
        <div className="px-4 py-4 animate-fade-up">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/rdo" className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
                </Link>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Novo RDO</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Informações gerais */}
                <div className="card space-y-4">
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>INFORMAÇÕES GERAIS</h2>

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
                            <label className="label">Clima</label>
                            <select name="clima" className="input">
                                <option value="">Selecione</option>
                                <option value="Ensolarado">Ensolarado</option>
                                <option value="Nublado">Nublado</option>
                                <option value="Chuvoso">Chuvoso</option>
                                <option value="Parcialmente nublado">Parcial. nublado</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Equipe própria */}
                <div className="card space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={18} style={{ color: 'var(--green-primary)' }} />
                            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>EQUIPE PRÓPRIA</h2>
                        </div>
                        <button
                            type="button"
                            onClick={adicionarMembro}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                            style={{ background: 'rgba(127, 166, 83, 0.15)', color: 'var(--green-primary)' }}
                        >
                            <Plus size={14} /> Adicionar
                        </button>
                    </div>

                    {equipe.length === 0 && (
                        <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>Nenhum membro adicionado</p>
                    )}

                    <div className="space-y-3">
                        {equipe.map((membro, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        className="input text-sm"
                                        placeholder="Nome"
                                        value={membro.nome}
                                        onChange={e => atualizarMembro(idx, 'nome', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="input text-sm"
                                        placeholder="Função (ex: Pedreiro)"
                                        value={membro.funcao}
                                        onChange={e => atualizarMembro(idx, 'funcao', e.target.value)}
                                    />
                                </div>
                                {equipe.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removerMembro(idx)}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                                        style={{ background: 'rgba(224, 82, 82, 0.1)', color: '#E05252' }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {equipe.length > 0 && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {equipe.filter(m => m.nome.trim()).length} membro(s) registrado(s)
                        </p>
                    )}
                </div>

                {/* Empreiteiros */}
                <div className="card space-y-4">
                    <div className="flex items-center gap-2">
                        <HardHat size={18} style={{ color: 'var(--green-primary)' }} />
                        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>EMPREITEIROS</h2>
                    </div>
                    <div>
                        <label className="label">Quantidade de empreiteiros presentes</label>
                        <input name="empreiteiros" type="number" min="0" className="input" placeholder="0" />
                    </div>
                </div>

                {/* Atividades */}
                <div className="card space-y-4">
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>ATIVIDADES E OCORRÊNCIAS</h2>
                    <div>
                        <label className="label">Descrição das atividades</label>
                        <textarea name="descricao_atividades" className="input min-h-[100px] resize-none" placeholder="Descreva as atividades realizadas..." rows={4} />
                    </div>
                    <div>
                        <label className="label">Ocorrências / Observações</label>
                        <textarea name="ocorrencias" className="input min-h-[80px] resize-none" placeholder="Alguma ocorrência relevante?" rows={3} />
                    </div>
                </div>

                {/* Fotos */}
                <div className="card">
                    <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>FOTOS</h2>
                    <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl border-2 border-dashed py-6 transition-colors" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                        <Camera size={22} />
                        <span className="text-sm">Adicionar fotos</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={e => {
                                const files = Array.from(e.target.files || []).slice(0, 10)
                                setFotos(prev => [...prev, ...files].slice(0, 10))
                            }}
                        />
                    </label>
                    {fotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {fotos.map((f, i) => (
                                <div key={i} className="relative">
                                    <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                    <button type="button" onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ background: '#E05252' }}>
                                        <X size={10} color="white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && <p className="text-sm px-2" style={{ color: '#E05252' }}>{error}</p>}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : <><ClipboardList size={18} /> Salvar RDO</>}
                </button>
            </form>
        </div>
    )
}
