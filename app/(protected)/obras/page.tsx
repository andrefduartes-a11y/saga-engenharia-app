import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Plus, ChevronRight, Calendar, Clock } from 'lucide-react'

export default async function ObrasPage() {
    const supabase = createClient()
    const { data: obras } = await supabase
        .from('obras')
        .select('*')
        .order('created_at', { ascending: false })

    const statusColor: Record<string, string> = {
        ativa: 'badge-green',
        pausada: 'badge-warning',
        concluida: 'badge-info',
    }

    return (
        <div className="px-4 py-4 space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Obras</h1>
                <Link href="/obras/nova" className="btn-primary py-2 px-4 text-sm min-h-[40px] w-auto">
                    <Plus size={16} />
                    Nova Obra
                </Link>
            </div>

            {!obras || obras.length === 0 ? (
                <div className="card text-center py-12">
                    <Building2 size={48} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nenhuma obra cadastrada</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Adicione a primeira obra para começar</p>
                    <Link href="/obras/nova" className="btn-primary mt-5 inline-flex">
                        <Plus size={16} /> Cadastrar Obra
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {obras.map((obra) => (
                        <Link key={obra.id} href={`/obras/${obra.id}`} className="card-hover">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(127, 166, 83, 0.15)' }}>
                                        <Building2 size={22} style={{ color: 'var(--green-primary)' }} />
                                    </div>
                                    <div>
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{obra.nome}</p>
                                        {obra.spe_id && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>SPE: {obra.spe_id}</p>}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={statusColor[obra.status] || 'badge'}>{obra.status}</span>
                                            {obra.data_inicio && (
                                                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                    <Calendar size={10} />
                                                    {new Date(obra.data_inicio + 'T12:00').toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
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
