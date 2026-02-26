'use client'

import { useState, useRef } from 'react'
import { useObra } from '@/lib/obra-context'
import { createClient } from '@/lib/supabase/client'
import { Mic, MicOff, Copy, Check, ShoppingCart, Trash2, Send } from 'lucide-react'

export default function SuprimentosPage() {
    const { obra } = useObra()
    const supabase = createClient()
    const [gravando, setGravando] = useState(false)
    const [transcrito, setTranscrito] = useState('')
    const [copiado, setCopiado] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [historico, setHistorico] = useState<{ texto: string; created_at: string }[]>([])
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const chunks = useRef<Blob[]>([])

    async function startGravacao() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        chunks.current = []
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
        recorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop())
            const blob = new Blob(chunks.current, { type: 'audio/webm' })
            await transcrever(blob)
        }
        recorder.start()
        mediaRecorder.current = recorder
        setGravando(true)
    }

    function stopGravacao() {
        mediaRecorder.current?.stop()
        setGravando(false)
    }

    async function transcrever(blob: Blob) {
        setEnviando(true)
        try {
            const formData = new FormData()
            formData.append('audio', blob, 'audio.webm')
            const res = await fetch('/api/suprimentos/transcricao', { method: 'POST', body: formData })
            const { texto } = await res.json()
            if (texto) setTranscrito(prev => prev ? prev + '\n' + texto : texto)
        } catch {
            alert('Erro ao transcrever. Verifique a conexão.')
        } finally {
            setEnviando(false)
        }
    }

    async function salvarSolicitacao() {
        if (!obra || !transcrito.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase.from('solicitacoes_suprimentos').insert({
            obra_id: obra.id,
            usuario: user?.id,
            texto_original: transcrito,
            texto_formatado: transcrito,
        }).select().single()
        if (data) {
            setHistorico(p => [{ texto: transcrito, created_at: data.created_at }, ...p])
            setTranscrito('')
        }
    }

    async function copiarWhatsApp() {
        if (!transcrito || !obra) return
        const texto = `🏗️ *SOLICITAÇÃO DE SUPRIMENTOS*\n*Obra:* ${obra.nome}\n*Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n${transcrito}`
        await navigator.clipboard.writeText(texto)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
    }

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(230,126,34,0.15)' }}>
                    <ShoppingCart size={20} style={{ color: '#E67E22' }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Suprimentos</h1>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Solicitação por voz ou texto</p>
                </div>
            </div>

            {!obra && (
                <div className="card text-center py-8">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selecione uma obra primeiro</p>
                </div>
            )}

            {obra && (
                <>
                    {/* Botão de gravação */}
                    <div className="card flex flex-col items-center gap-4 py-8">
                        <button
                            onClick={gravando ? stopGravacao : startGravacao}
                            disabled={enviando}
                            className="w-20 h-20 rounded-full flex items-center justify-center transition-all"
                            style={{
                                background: gravando ? 'rgba(239,68,68,0.15)' : 'rgba(230,126,34,0.15)',
                                border: `2px solid ${gravando ? '#EF4444' : '#E67E22'}`,
                                animation: gravando ? 'pulse 1.5s infinite' : 'none',
                            }}
                        >
                            {gravando
                                ? <MicOff size={32} style={{ color: '#EF4444' }} />
                                : <Mic size={32} style={{ color: '#E67E22' }} />
                            }
                        </button>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                            {enviando ? '⏳ Transcrevendo...' : gravando ? '🔴 Gravando... toque para parar' : '🎙️ Toque para gravar'}
                        </p>
                    </div>

                    {/* Texto transcrito / editável */}
                    <div className="space-y-2">
                        <label className="form-label">Solicitação</label>
                        <textarea
                            className="input"
                            rows={5}
                            placeholder="O texto transcrito aparecerá aqui. Você pode editar antes de enviar."
                            value={transcrito}
                            onChange={e => setTranscrito(e.target.value)}
                        />
                    </div>

                    {transcrito.trim() && (
                        <div className="flex gap-2">
                            <button onClick={copiarWhatsApp}
                                className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                                {copiado ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar pro WhatsApp</>}
                            </button>
                            <button onClick={salvarSolicitacao}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                                <Send size={16} /> Salvar
                            </button>
                            <button onClick={() => setTranscrito('')}
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
