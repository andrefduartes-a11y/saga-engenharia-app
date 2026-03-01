'use client'

import { useState, useRef, useEffect } from 'react'
import { useObra } from '@/lib/obra-context'
import { createClient } from '@/lib/supabase/client'
import {
    Mic, MicOff, Copy, Check, ShoppingCart,
    Trash2, Wand2, ChevronDown, Clock, Loader2, Building2
} from 'lucide-react'

// formato legível de hora
const fmt = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function SuprimentosPage() {
    const { obra, role, setObra, clearObra } = useObra()
    const supabase = createClient()
    const isDiretor = role === 'diretor' || role === 'admin'

    // obras disponíveis para o seletor do Diretor
    const [obrasDisponiveis, setObrasDisponiveis] = useState<{ id: string; nome: string }[]>([])
    const [obrasSelecionando, setObrasSelecionando] = useState(false)

    // gravação
    const [gravando, setGravando] = useState(false)
    const [transcrevendo, setTranscrevendo] = useState(false)
    const [formatando, setFormatando] = useState(false)
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const chunks = useRef<Blob[]>([])

    // texto
    const [transcrito, setTranscrito] = useState('')      // texto bruto transcrito
    const [pedidoFormatado, setPedidoFormatado] = useState('') // texto formatado pelo GPT

    // UI
    const [copiado, setCopiado] = useState(false)
    const [historico, setHistorico] = useState<{ id: string; texto_formatado: string; created_at: string }[]>([])
    const [carregandoHist, setCarregandoHist] = useState(false)

    // usuário
    const [nomeUsuario, setNomeUsuario] = useState('')
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            const email = data.user?.email || ''
            setNomeUsuario(email.split('@')[0])
        })
    }, [])

    // carrega obras para seletor do Diretor
    useEffect(() => {
        if (!isDiretor || obra) return
        setObrasSelecionando(true)
        supabase.from('obras')
            .select('id, nome')
            .eq('status', 'ativa')
            .order('nome')
            .then(({ data }) => { setObrasDisponiveis(data || []); setObrasSelecionando(false) })
    }, [isDiretor, obra?.id])

    // histórico
    useEffect(() => {
        if (!obra) return
        setCarregandoHist(true)
        supabase.from('solicitacoes_suprimentos')
            .select('id, texto_formatado, created_at')
            .eq('obra_id', obra.id)
            .order('created_at', { ascending: false })
            .limit(10)
            .then(({ data }) => { setHistorico(data || []); setCarregandoHist(false) })
    }, [obra?.id])

    // ── Gravação ────────────────────────────────────────────────────────────
    async function startGravacao() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Tenta webm, cai para mp4 se não suportar (iOS Safari)
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            const recorder = new MediaRecorder(stream, { mimeType })
            chunks.current = []
            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop())
                const ext = mimeType === 'audio/webm' ? 'webm' : 'mp4'
                const blob = new Blob(chunks.current, { type: mimeType })
                await transcrever(blob, ext)
            }
            recorder.start()
            mediaRecorder.current = recorder
            setGravando(true)
        } catch {
            alert('Permissão de microfone negada.')
        }
    }

    function stopGravacao() {
        mediaRecorder.current?.stop()
        setGravando(false)
    }

    // ── Transcrição (Whisper) ────────────────────────────────────────────────
    async function transcrever(blob: Blob, ext: string) {
        setTranscrevendo(true)
        try {
            const fd = new FormData()
            fd.append('audio', blob, `audio.${ext}`)
            const res = await fetch('/api/suprimentos/transcricao', { method: 'POST', body: fd })
            const json = await res.json()
            if (json.texto) {
                const novo = transcrito ? transcrito + '\n' + json.texto : json.texto
                setTranscrito(novo)
                setPedidoFormatado('') // limpa o formatado anterior
            } else {
                alert('Erro na transcrição: ' + (json.erro || 'desconhecido'))
            }
        } catch {
            alert('Erro de conexão ao transcrever.')
        } finally {
            setTranscrevendo(false)
        }
    }

    // ── Formatação (GPT) ─────────────────────────────────────────────────────
    async function formatarPedido() {
        if (!transcrito.trim()) return
        setFormatando(true)
        try {
            const res = await fetch('/api/suprimentos/formatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texto: transcrito,
                    obra: obra?.nome,
                    data: new Date().toLocaleDateString('pt-BR'),
                    solicitante: nomeUsuario,
                }),
            })
            const json = await res.json()
            if (json.pedido) {
                setPedidoFormatado(json.pedido)
            } else {
                alert('Erro ao formatar: ' + (json.erro || 'desconhecido'))
            }
        } catch {
            alert('Erro de conexão ao formatar.')
        } finally {
            setFormatando(false)
        }
    }

    // ── Copiar para WhatsApp ─────────────────────────────────────────────────
    async function copiarWhatsApp() {
        const texto = pedidoFormatado || transcrito
        if (!texto) return
        await navigator.clipboard.writeText(texto)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2500)
    }

    // ── Salvar ───────────────────────────────────────────────────────────────
    async function salvar() {
        if (!obra || !transcrito.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase.from('solicitacoes_suprimentos').insert({
            obra_id: obra.id,
            usuario: user?.id,
            texto_original: transcrito,
            texto_formatado: pedidoFormatado || transcrito,
        }).select().single()
        if (data) {
            setHistorico(p => [{ id: data.id, texto_formatado: data.texto_formatado, created_at: data.created_at }, ...p])
            setTranscrito('')
            setPedidoFormatado('')
        }
    }

    // ── Apagar do histórico ──────────────────────────────────────────────────
    async function apagarHistorico(id: string) {
        await supabase.from('solicitacoes_suprimentos').delete().eq('id', id)
        setHistorico(p => p.filter(x => x.id !== id))
    }

    const textoFinal = pedidoFormatado || transcrito

    return (
        <div style={{ padding: '20px', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(230,126,34,0.15)', border: '1px solid rgba(230,126,34,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart size={20} style={{ color: '#E67E22' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Suprimentos</h1>
                    {obra && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{obra.nome}</p>}
                </div>
                {isDiretor && obra && (
                    <button
                        onClick={() => clearObra()}
                        style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'transparent', cursor: 'pointer' }}
                    >
                        Trocar obra
                    </button>
                )}
            </div>

            {!obra ? (
                <div style={{ borderRadius: 16, border: '1px solid rgba(230,126,34,0.2)', background: 'rgba(230,126,34,0.04)', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(230,126,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={26} style={{ color: '#E67E22' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Selecione a obra</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Escolha a obra para vincular o pedido de suprimentos</p>
                    </div>
                    {obrasSelecionando ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando obras...
                        </div>
                    ) : (
                        <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {obrasDisponiveis.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma obra ativa encontrada.</p>
                            ) : (
                                obrasDisponiveis.map(o => (
                                    <button
                                        key={o.id}
                                        onClick={() => setObra(o as any)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(230,126,34,0.25)',
                                            color: 'var(--text-primary)', fontSize: 14, fontWeight: 600,
                                            textAlign: 'left', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(230,126,34,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(230,126,34,0.5)' }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(230,126,34,0.25)' }}
                                    >
                                        <Building2 size={16} style={{ color: '#E67E22', flexShrink: 0 }} />
                                        {o.nome}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* ── GRAVADOR ── */}
                    <div style={{ borderRadius: 18, border: '1px solid rgba(230,126,34,0.2)', background: 'rgba(230,126,34,0.04)', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

                        {/* Botão grande de microfone */}
                        <button
                            onClick={gravando ? stopGravacao : startGravacao}
                            disabled={transcrevendo || formatando}
                            style={{
                                width: 88, height: 88, borderRadius: '50%',
                                border: `3px solid ${gravando ? '#EF4444' : '#E67E22'}`,
                                background: gravando ? 'rgba(239,68,68,0.15)' : 'rgba(230,126,34,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: transcrevendo ? 'wait' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: gravando ? '0 0 0 8px rgba(239,68,68,0.1), 0 0 0 16px rgba(239,68,68,0.05)' : '0 4px 20px rgba(230,126,34,0.2)',
                                animation: gravando ? 'pulse 1.5s infinite' : 'none',
                            }}
                        >
                            {transcrevendo
                                ? <Loader2 size={36} style={{ color: '#E67E22', animation: 'spin 1s linear infinite' }} />
                                : gravando
                                    ? <MicOff size={36} style={{ color: '#EF4444' }} />
                                    : <Mic size={36} style={{ color: '#E67E22' }} />
                            }
                        </button>

                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
                            {transcrevendo
                                ? '⏳ Transcrevendo com Whisper...'
                                : gravando
                                    ? '🔴 Gravando... toque para parar'
                                    : transcrito
                                        ? '✅ Gravação concluída — adicione mais ou formate'
                                        : '🎙️ Toque e fale o pedido de materiais'
                            }
                        </p>
                    </div>

                    {/* ── TEXTO TRANSCRITO ── */}
                    {transcrito && (
                        <div style={{ borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                            <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>📝 Transcrição bruta</span>
                                <button onClick={() => { setTranscrito(''); setPedidoFormatado('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                            <textarea
                                value={transcrito}
                                onChange={e => { setTranscrito(e.target.value); setPedidoFormatado('') }}
                                rows={4}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6, outline: 'none', resize: 'vertical' }}
                                placeholder="Texto transcrito aparece aqui. Pode editar antes de formatar."
                            />
                        </div>
                    )}

                    {/* ── BOTÃO FORMATAR ── */}
                    {transcrito && !pedidoFormatado && (
                        <button
                            onClick={formatarPedido}
                            disabled={formatando}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '14px', borderRadius: 12,
                                background: formatando ? 'rgba(230,126,34,0.4)' : 'linear-gradient(135deg, #E67E22, #d35400)',
                                border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                                cursor: formatando ? 'wait' : 'pointer',
                                boxShadow: '0 4px 16px rgba(230,126,34,0.3)',
                            }}
                        >
                            {formatando
                                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Formatando com IA...</>
                                : <><Wand2 size={15} /> Formatar Pedido com IA</>
                            }
                        </button>
                    )}

                    {/* ── PEDIDO FORMATADO ── */}
                    {pedidoFormatado && (
                        <div style={{ borderRadius: 14, border: '1px solid rgba(230,126,34,0.3)', overflow: 'hidden' }}>
                            <div style={{ padding: '10px 14px', background: 'rgba(230,126,34,0.06)', borderBottom: '1px solid rgba(230,126,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#E67E22', textTransform: 'uppercase', letterSpacing: '0.8px' }}>✨ Pedido formatado</span>
                                <button onClick={() => setPedidoFormatado('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, fontSize: 11 }}>
                                    Reformatar
                                </button>
                            </div>
                            <textarea
                                value={pedidoFormatado}
                                onChange={e => setPedidoFormatado(e.target.value)}
                                rows={10}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '14px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.75, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }}
                            />
                        </div>
                    )}

                    {/* ── AÇÕES ── */}
                    {textoFinal && (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={copiarWhatsApp}
                                style={{
                                    flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                    padding: '13px', borderRadius: 12,
                                    background: copiado ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${copiado ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
                                    color: copiado ? '#10B981' : 'var(--text-primary)',
                                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {copiado ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar pro WhatsApp</>}
                            </button>
                            <button
                                onClick={salvar}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                    padding: '13px', borderRadius: 12,
                                    background: 'linear-gradient(135deg, #E67E22, #d35400)',
                                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(230,126,34,0.3)',
                                }}
                            >
                                Salvar
                            </button>
                        </div>
                    )}

                    {/* ── HISTÓRICO ── */}
                    {(carregandoHist || historico.length > 0) && (
                        <div style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Histórico</span>
                            </div>
                            {carregandoHist
                                ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
                                : historico.map(h => (
                                    <details key={h.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        <summary style={{ padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, listStyle: 'none', color: 'var(--text-secondary)', fontSize: 12 }}>
                                            <ChevronDown size={13} />
                                            <span style={{ flex: 1 }}>{fmt(h.created_at)}</span>
                                            <button
                                                onClick={e => { e.preventDefault(); apagarHistorico(h.id) }}
                                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 2 }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </summary>
                                        <div style={{ padding: '10px 16px 14px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.015)' }}>
                                            {h.texto_formatado}
                                        </div>
                                    </details>
                                ))
                            }
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
