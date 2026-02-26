'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HelpCircle, Search, ChevronDown, ChevronUp } from 'lucide-react'

interface FAQ {
    id: string
    categoria: string
    pergunta: string
    resposta: string
}

export default function FAQPage() {
    const supabase = createClient()
    const [itens, setItens] = useState<FAQ[]>([])
    const [busca, setBusca] = useState('')
    const [aberto, setAberto] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.from('faq').select('*').order('categoria').order('pergunta')
            .then(({ data }) => { setItens(data || []); setLoading(false) })
    }, [])

    const filtrados = busca
        ? itens.filter(f => f.pergunta.toLowerCase().includes(busca.toLowerCase()) || f.resposta.toLowerCase().includes(busca.toLowerCase()))
        : itens

    const byCategoria = filtrados.reduce((acc, f) => {
        if (!acc[f.categoria]) acc[f.categoria] = []
        acc[f.categoria].push(f)
        return acc
    }, {} as Record<string, FAQ[]>)

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(127,140,141,0.15)' }}>
                    <HelpCircle size={20} style={{ color: '#7F8C8D' }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>FAQ / DRH</h1>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Dúvidas Frequentes</p>
                </div>
            </div>

            {/* Busca */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input className="input pl-9" placeholder="Buscar dúvida..."
                    value={busca} onChange={e => setBusca(e.target.value)} />
            </div>

            {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card animate-pulse" style={{ height: 60 }} />)}</div>
            ) : Object.keys(byCategoria).length === 0 ? (
                <div className="card text-center py-10">
                    <HelpCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>{busca ? 'Nenhum resultado encontrado' : 'Nenhuma FAQ cadastrada'}</p>
                </div>
            ) : (
                Object.entries(byCategoria).map(([cat, faqs]) => (
                    <div key={cat}>
                        <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {cat}
                        </p>
                        <div className="space-y-1">
                            {faqs.map(f => (
                                <div key={f.id} className="card overflow-hidden" style={{ padding: 0 }}>
                                    <button
                                        onClick={() => setAberto(aberto === f.id ? null : f.id)}
                                        className="w-full flex items-center justify-between gap-3 text-left"
                                        style={{ padding: '12px 14px' }}>
                                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{f.pergunta}</span>
                                        {aberto === f.id
                                            ? <ChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                            : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                                    </button>
                                    {aberto === f.id && (
                                        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border-subtle)' }}>
                                            <p className="text-sm pt-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {f.resposta}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
