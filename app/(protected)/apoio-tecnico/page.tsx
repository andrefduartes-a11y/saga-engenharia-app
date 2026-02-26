'use client'

import { useState, useRef } from 'react'
import { MessageSquare, Send, Loader2, RotateCcw, AlertCircle } from 'lucide-react'

export default function ApoioTecnicoPage() {
    const [pergunta, setPergunta] = useState('')
    const [resposta, setResposta] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!pergunta.trim()) return
        setLoading(true)
        setError('')
        setResposta('')

        try {
            const res = await fetch('/api/apoio-tecnico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pergunta }),
            })

            if (!res.ok) throw new Error('Erro na requisição')

            const data = await res.json()
            setResposta(data.resposta)
        } catch (err) {
            setError('Erro ao conectar com o assistente. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    function handleNovaPergunta() {
        setPergunta('')
        setResposta('')
        setError('')
        textareaRef.current?.focus()
    }

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up min-h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Apoio Técnico IA 🤖</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Assistente técnico de obra — ABNT, segurança e execução</p>
            </div>

            {/* Resposta */}
            {resposta && (
                <div className="card flex-1" style={{ borderColor: 'var(--green-primary)', borderLeftWidth: 4 }}>
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={16} style={{ color: 'var(--green-primary)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--green-primary)' }}>Resposta</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{resposta}</p>
                    <button onClick={handleNovaPergunta} className="btn-secondary mt-4 w-full text-sm min-h-[44px]">
                        <RotateCcw size={16} /> Nova pergunta
                    </button>
                </div>
            )}

            {/* Exemplos se não há resposta */}
            {!resposta && !loading && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>EXEMPLOS DE PERGUNTAS</p>
                    {[
                        'Qual o cobrimento mínimo da armadura para laje em ambiente externo?',
                        'Qual a NBR que rege o concreto estrutural?',
                        'Quais os EPIs obrigatórios para trabalho em altura?',
                        'Como calcular o consumo de cimento por m³ de concreto C25?',
                    ].map((ex) => (
                        <button
                            key={ex}
                            onClick={() => setPergunta(ex)}
                            className="w-full text-left card-hover p-3 rounded-xl text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {ex}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="card flex items-center justify-center gap-3 py-10">
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--green-primary)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Consultando assistente...</span>
                </div>
            )}

            {/* Erro */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(224, 82, 82, 0.1)', border: '1px solid rgba(224, 82, 82, 0.3)' }}>
                    <AlertCircle size={16} style={{ color: '#E05252' }} />
                    <p className="text-sm" style={{ color: '#E05252' }}>{error}</p>
                </div>
            )}

            {/* Form */}
            {!resposta && (
                <form onSubmit={handleSubmit} className="mt-auto space-y-3">
                    <div>
                        <label className="label">Sua pergunta técnica</label>
                        <textarea
                            ref={textareaRef}
                            value={pergunta}
                            onChange={e => setPergunta(e.target.value)}
                            className="input resize-none"
                            rows={4}
                            placeholder="Ex: Qual o espaçamento máximo de estribos para viga de concreto armado?"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !pergunta.trim()}
                        className="btn-primary w-full"
                    >
                        {loading ? <><Loader2 size={18} className="animate-spin" /> Consultando...</> : <><Send size={18} /> Enviar pergunta</>}
                    </button>
                </form>
            )}
        </div>
    )
}
