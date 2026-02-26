'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Loader2 } from 'lucide-react'

interface Mensagem {
    role: 'user' | 'assistant'
    content: string
}

const SUGESTOES = [
    'Como calcular o consumo de cimento para FCK 25?',
    'Quais são os itens obrigatórios em uma FVS de concretagem?',
    'Como calcular a produtividade de uma escavadeira?',
    'Qual a NBR para controle de concreto?',
]

export default function AssistentePage() {
    const [mensagens, setMensagens] = useState<Mensagem[]>([])
    const [input, setInput] = useState('')
    const [carregando, setCarregando] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [mensagens])

    async function enviar(texto?: string) {
        const texto_final = texto || input.trim()
        if (!texto_final || carregando) return

        const nova: Mensagem = { role: 'user', content: texto_final }
        const historico = [...mensagens, nova]
        setMensagens(historico)
        setInput('')
        setCarregando(true)

        try {
            const res = await fetch('/api/assistente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensagens: historico }),
            })
            const { resposta, erro } = await res.json()
            if (resposta) {
                setMensagens(p => [...p, { role: 'assistant', content: resposta }])
            } else {
                setMensagens(p => [...p, { role: 'assistant', content: `❌ Erro: ${erro}` }])
            }
        } catch {
            setMensagens(p => [...p, { role: 'assistant', content: '❌ Erro de conexão. Tente novamente.' }])
        } finally {
            setCarregando(false)
        }
    }

    return (
        <div className="flex flex-col animate-fade-up" style={{ height: 'calc(100dvh - 120px)' }}>
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(26,188,156,0.15)' }}>
                    <Bot size={20} style={{ color: '#1ABC9C' }} />
                </div>
                <div>
                    <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Assistente SAGA</h1>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Especialista em engenharia civil</p>
                </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
                {mensagens.length === 0 && (
                    <div className="space-y-3 pt-4">
                        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                            Pergunte sobre normas, cálculos e boas práticas de canteiro
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {SUGESTOES.map(s => (
                                <button key={s} onClick={() => enviar(s)}
                                    className="card-hover text-left text-sm px-3 py-2"
                                    style={{ color: 'var(--text-secondary)' }}>
                                    💡 {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {mensagens.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                            style={{ background: m.role === 'user' ? 'var(--green-primary)' : 'rgba(26,188,156,0.2)' }}>
                            {m.role === 'user'
                                ? <User size={14} style={{ color: '#fff' }} />
                                : <Bot size={14} style={{ color: '#1ABC9C' }} />
                            }
                        </div>
                        <div className="max-w-[80%] px-3 py-2 rounded-2xl text-sm"
                            style={{
                                background: m.role === 'user' ? 'var(--green-primary)' : 'var(--bg-card)',
                                color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                                borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6,
                            }}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {carregando && (
                    <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,188,156,0.2)' }}>
                            <Bot size={14} style={{ color: '#1ABC9C' }} />
                        </div>
                        <div className="px-3 py-2 rounded-2xl" style={{ background: 'var(--bg-card)', borderRadius: '4px 16px 16px 16px' }}>
                            <Loader2 size={16} className="animate-spin" style={{ color: '#1ABC9C' }} />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-2 flex gap-2">
                <input
                    className="input flex-1"
                    placeholder="Pergunte sobre engenharia civil..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
                />
                <button onClick={() => enviar()} disabled={!input.trim() || carregando}
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--green-primary)', color: '#fff', opacity: input.trim() ? 1 : 0.4 }}>
                    <Send size={18} />
                </button>
            </div>
        </div>
    )
}
