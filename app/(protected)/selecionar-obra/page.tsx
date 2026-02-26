'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useObra } from '@/lib/obra-context'
import { Building2, MapPin, ChevronRight, Plus } from 'lucide-react'

interface Obra {
    id: string
    nome: string
    endereco?: string
    responsavel_tecnico?: string
    status: string
}

export default function SelecionarObraPage() {
    const router = useRouter()
    const supabase = createClient()
    const { setObra } = useObra()
    const [obras, setObras] = useState<Obra[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase
            .from('obras')
            .select('id, nome, endereco, responsavel_tecnico, status')
            .order('nome')
            .then(({ data }) => {
                setObras(data || [])
                setLoading(false)
            })
    }, [])

    function handleSelect(obra: Obra) {
        setObra(obra)
        router.push('/dashboard')
    }

    return (
        <div className="px-4 py-6 space-y-5 animate-fade-up">
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Selecionar Obra
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Escolha a obra em que vai trabalhar hoje
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card animate-pulse" style={{ height: 80 }} />
                    ))}
                </div>
            ) : obras.length === 0 ? (
                <div className="card text-center py-10">
                    <Building2 size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Nenhuma obra cadastrada
                    </p>
                    <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
                        Cadastre a primeira obra para começar
                    </p>
                    <a href="/obras" className="btn-primary inline-flex items-center gap-2">
                        <Plus size={16} /> Cadastrar obra
                    </a>
                </div>
            ) : (
                <div className="space-y-2">
                    {obras.map(obra => (
                        <button
                            key={obra.id}
                            onClick={() => handleSelect(obra)}
                            className="card-hover w-full text-left flex items-center gap-4"
                            style={{ padding: '14px 16px' }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(127,166,83,0.15)' }}
                            >
                                <Building2 size={24} style={{ color: 'var(--green-primary)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                    {obra.nome}
                                </p>
                                {obra.endereco && (
                                    <p className="text-xs flex items-center gap-1 mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                        <MapPin size={11} /> {obra.endereco}
                                    </p>
                                )}
                                {obra.responsavel_tecnico && (
                                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                        RT: {obra.responsavel_tecnico}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{
                                        background: obra.status === 'ativa' ? 'rgba(127,166,83,0.15)' : 'rgba(107,114,128,0.15)',
                                        color: obra.status === 'ativa' ? 'var(--green-primary)' : 'var(--text-muted)',
                                    }}
                                >
                                    {obra.status}
                                </span>
                                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
