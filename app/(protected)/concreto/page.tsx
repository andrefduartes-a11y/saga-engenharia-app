import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { HardHat, Plus, ChevronRight, Droplets } from 'lucide-react'

export default async function ConcretoListPage() {
    const supabase = createClient()
    const { data: concretagens } = await supabase
        .from('concretagens')
        .select('id, data, fck, volume, elemento, fornecedor, obra_id, obras(nome)')
        .order('data', { ascending: false })
        .limit(50)

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Concretagens</h1>
                <Link href="/concreto/novo" className="btn-primary py-2 px-4 text-sm min-h-[40px]">
                    <Plus size={16} /> Nova
                </Link>
            </div>

            {!concretagens || concretagens.length === 0 ? (
                <div className="card text-center py-12">
                    <HardHat size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma concretagem registrada</p>
                    <Link href="/concreto/novo" className="btn-primary mt-5 inline-flex"><Plus size={16} /> Nova Concretagem</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {concretagens.map((c) => (
                        <div key={c.id} className="card">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(74, 158, 204, 0.15)' }}>
                                        <Droplets size={22} style={{ color: '#4A9ECC' }} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>FCK {c.fck} MPa — {c.volume} m³</p>
                                        {c.elemento && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.elemento}</p>}
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(c.obras as any)?.nome}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="badge-info">{new Date(c.data + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                    {c.fornecedor && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{c.fornecedor}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
