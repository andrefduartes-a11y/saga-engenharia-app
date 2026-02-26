import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClipboardList, Plus, ChevronRight, Users, Cloud } from 'lucide-react'

export default async function RdoListPage() {
    const supabase = createClient()
    const { data: rdos } = await supabase
        .from('rdos')
        .select('id, data, clima, equipe_presente, obra_id, obras(nome)')
        .order('data', { ascending: false })
        .limit(50)

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>RDOs</h1>
                <Link href="/rdo/novo" className="btn-primary py-2 px-4 text-sm min-h-[40px]">
                    <Plus size={16} /> Novo RDO
                </Link>
            </div>

            {!rdos || rdos.length === 0 ? (
                <div className="card text-center py-12">
                    <ClipboardList size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhum RDO lançado</p>
                    <Link href="/rdo/novo" className="btn-primary mt-5 inline-flex">
                        <Plus size={16} /> Novo RDO
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {rdos.map((rdo) => (
                        <Link key={rdo.id} href={`/rdo/${rdo.id}`} className="card-hover">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(127, 166, 83, 0.15)' }}>
                                        <ClipboardList size={22} style={{ color: 'var(--green-primary)' }} />
                                    </div>
                                    <div>
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {new Date(rdo.data + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(rdo.obras as any)?.nome}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            {rdo.clima && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Cloud size={10} />{rdo.clima}</span>}
                                            {rdo.equipe_presente && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Users size={10} />{rdo.equipe_presente} pessoas</span>}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
