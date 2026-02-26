'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, Download } from 'lucide-react'
import Link from 'next/link'

export default function ITsPage() {
    const [its, setITs] = useState<any[]>([])
    const supabase = createClient()

    async function load() {
        const { data } = await supabase.from('instrucoes_trabalho').select('*').order('created_at', { ascending: false })
        setITs(data || [])
    }

    useEffect(() => {
        load()
    }, [])

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Instruções de Trabalho</h1>
                <Link href="/instrucoes-trabalho/nova" className="btn-primary py-2 px-4 text-sm min-h-[40px] w-auto">
                    <Plus size={16} /> Nova IT
                </Link>
            </div>

            {its.length === 0 ? (
                <div className="card text-center py-12">
                    <BookOpen size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma IT cadastrada</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Adicione guias, normas e procedimentos genéricos</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {its.map(it => (
                        <div key={it.id} className="card flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201, 144, 42, 0.15)' }}>
                                    <BookOpen size={20} style={{ color: 'var(--yellow-warn)' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{it.titulo}</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{it.descricao}</p>
                                </div>
                                {it.url_arquivo && (
                                    <a href={it.url_arquivo} target="_blank" rel="noopener" className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(74, 158, 204, 0.15)', color: '#4A9ECC' }}>
                                        <Download size={18} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
