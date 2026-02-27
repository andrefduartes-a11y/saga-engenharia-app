'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, PlayCircle, ChevronRight, ChevronDown, BookOpen } from 'lucide-react'

interface Aula { id: string; titulo: string; ordem: number; video_url?: string }
interface Modulo { id: string; titulo: string; descricao?: string; ordem: number; aulas?: Aula[] }

export default function EADPage() {
    const supabase = createClient()
    const [modulos, setModulos] = useState<Modulo[]>([])
    const [loading, setLoading] = useState(true)
    const [aberto, setAberto] = useState<string | null>(null)

    useEffect(() => {
        supabase.from('ead_modules')
            .select('*, ead_lessons(*)')
            .order('ordem')
            .then(({ data }) => {
                setModulos((data || []).map(m => ({ ...m, aulas: m.ead_lessons?.sort((a: Aula, b: Aula) => a.ordem - b.ordem) })))
                setLoading(false)
            })
    }, [])

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(52,152,219,0.15)' }}>
                    <GraduationCap size={20} style={{ color: '#3498DB' }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>EAD</h1>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Treinamentos e capacitações</p>
                </div>
            </div>

            {/* ── Boas Vindas Video ─────────────────────────────────────────── */}
            <div style={{
                borderRadius: 16, overflow: 'hidden',
                background: 'rgba(52,152,219,0.06)',
                border: '1px solid rgba(52,152,219,0.2)',
            }}>
                {/* Header */}
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(52,152,219,0.12)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,152,219,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <PlayCircle size={20} style={{ color: '#3498DB' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>🎓 Boas Vindas</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vídeo introdutório — assista antes de começar</div>
                    </div>
                </div>
                {/* Embedded player — 16:9 aspect ratio */}
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, background: '#000' }}>
                    <iframe
                        src="https://drive.google.com/file/d/1hN_SINLmITRgaERCJs49ZUgP_3POSofQ/preview"
                        title="Boas Vindas — SAGA Engenharia"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        style={{
                            position: 'absolute', top: 0, left: 0,
                            width: '100%', height: '100%',
                            border: 'none',
                        }}
                    />
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">{[1, 2].map(i => <div key={i} className="card animate-pulse" style={{ height: 80 }} />)}</div>
            ) : modulos.length === 0 ? (
                <div className="card text-center py-8">
                    <GraduationCap size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum módulo disponível ainda</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Os treinamentos serão adicionados aqui</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {modulos.map(m => (
                        <div key={m.id} className="card overflow-hidden" style={{ padding: 0 }}>
                            <button onClick={() => setAberto(aberto === m.id ? null : m.id)}
                                className="w-full flex items-center gap-3 text-left" style={{ padding: '14px 16px' }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(52,152,219,0.15)' }}>
                                    <BookOpen size={18} style={{ color: '#3498DB' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{m.titulo}</p>
                                    {m.descricao && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.descricao}</p>}
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {m.aulas?.length || 0} aulas
                                    </p>
                                </div>
                                {aberto === m.id ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                            </button>

                            {aberto === m.id && m.aulas && m.aulas.length > 0 && (
                                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                    {m.aulas.map(aula => (
                                        <a key={aula.id}
                                            href={aula.video_url || '#'}
                                            target={aula.video_url ? '_blank' : undefined}
                                            rel="noopener"
                                            className="flex items-center gap-3 transition-colors"
                                            style={{ padding: '10px 16px 10px 24px', borderBottom: '1px solid var(--border-subtle)' }}
                                        >
                                            <PlayCircle size={18} style={{ color: aula.video_url ? '#3498DB' : 'var(--text-muted)', flexShrink: 0 }} />
                                            <span className="text-sm" style={{ color: aula.video_url ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                {aula.titulo}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
