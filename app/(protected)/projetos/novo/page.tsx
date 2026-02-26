'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import Link from 'next/link'

const DISCIPLINAS = ['Arquitetura', 'Estrutural', 'Elétrica', 'Hidráulica', 'Fundações', 'Topografia', 'Outro']

export default function NovoProjeto() {
    const [obras, setObras] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        supabase.from('obras').select('id, nome').eq('status', 'ativa').then(({ data }) => setObras(data || []))
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!file) {
            setError('Selecione um arquivo de projeto')
            return
        }
        setLoading(true)
        setError('')
        const form = e.currentTarget
        const obra_id = (form.elements.namedItem('obra_id') as HTMLSelectElement).value
        const nome = (form.elements.namedItem('nome') as HTMLInputElement).value
        const disciplina = (form.elements.namedItem('disciplina') as HTMLSelectElement).value
        const revisao = (form.elements.namedItem('revisao') as HTMLInputElement).value

        const { data: { user } } = await supabase.auth.getUser()

        // Upload
        const path = `${obra_id}/projetos/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('saga-engenharia').upload(path, file)

        if (uploadError) {
            setError('Erro no upload do arquivo.')
            setLoading(false)
            return
        }

        const { data: { publicUrl } } = supabase.storage.from('saga-engenharia').getPublicUrl(path)

        const { error: insertError } = await supabase.from('projetos').insert({
            obra_id,
            nome,
            disciplina,
            revisao,
            url_arquivo: publicUrl,
            created_by: user?.id,
        })

        if (insertError) {
            setError('Erro ao salvar no banco de dados.')
            setLoading(false)
            return
        }

        router.push('/projetos')
        router.refresh()
    }

    return (
        <div className="px-4 py-4 space-y-5 animate-fade-up">
            <div className="flex items-center gap-3">
                <Link href="/projetos" className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Novo Projeto</h1>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-4">
                {error && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(217, 82, 82, 0.1)', border: '1px solid rgba(217, 82, 82, 0.2)', color: '#D95252' }}>{error}</div>}

                <div>
                    <label className="label">Obra</label>
                    <select name="obra_id" className="input" required>
                        <option value="">Selecione a obra...</option>
                        {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                </div>

                <div>
                    <label className="label">Nome do Desenho / Prancha</label>
                    <input name="nome" type="text" className="input" placeholder="Ex: Planta Baixa Térreo" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="label">Disciplina</label>
                        <select name="disciplina" className="input" required>
                            {DISCIPLINAS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Revisão</label>
                        <input name="revisao" type="text" className="input" placeholder="Ex: R01" defaultValue="R00" required />
                    </div>
                </div>

                <div>
                    <label className="label">Arquivo (PDF, DWG, etc)</label>
                    <div className="mt-1 flex flex-col items-center justify-center w-full h-32 rounded-xl transition-colors" style={{ border: '2px dashed var(--border-color)', background: 'var(--bg-input)' }}>
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                            <span className="text-sm px-4 text-center truncate" style={{ color: 'var(--text-muted)' }}>{file ? file.name : 'Clique para selecionar o arquivo'}</span>
                            <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} required accept=".pdf,.dwg,.dxf,.jpg,.png" />
                        </label>
                    </div>
                </div>

                <button type="submit" className="btn-primary mt-4" disabled={loading}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Salvar Projeto'}
                </button>
            </form>
        </div>
    )
}
