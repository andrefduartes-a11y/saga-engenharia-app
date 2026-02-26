'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import Link from 'next/link'

export default function NovaIT() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const form = e.currentTarget
        const titulo = (form.elements.namedItem('titulo') as HTMLInputElement).value
        const descricao = (form.elements.namedItem('descricao') as HTMLTextAreaElement).value

        let publicUrl = null

        if (file) {
            const path = `its/${Date.now()}-${file.name}`
            const { error: uploadError } = await supabase.storage.from('saga-engenharia').upload(path, file)

            if (uploadError) {
                setError('Erro no upload do arquivo.')
                setLoading(false)
                return
            }
            const { data } = supabase.storage.from('saga-engenharia').getPublicUrl(path)
            publicUrl = data.publicUrl
        }

        const { error: insertError } = await supabase.from('instrucoes_trabalho').insert({
            titulo,
            descricao,
            url_arquivo: publicUrl
        })

        if (insertError) {
            setError('Erro ao salvar no banco de dados.')
            setLoading(false)
            return
        }

        router.push('/instrucoes-trabalho')
        router.refresh()
    }

    return (
        <div className="px-4 py-4 space-y-5 animate-fade-up">
            <div className="flex items-center gap-3">
                <Link href="/instrucoes-trabalho" className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-white/10" style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Nova IT</h1>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-4">
                {error && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(217, 82, 82, 0.1)', border: '1px solid rgba(217, 82, 82, 0.2)', color: '#D95252' }}>{error}</div>}

                <div>
                    <label className="label">Título da Instrução</label>
                    <input name="titulo" type="text" className="input" placeholder="Ex: IT01 - Execução de Alvenaria" required />
                </div>

                <div>
                    <label className="label">Descrição / Resumo</label>
                    <textarea name="descricao" className="input min-h-[80px]" placeholder="Breve resumo desta instrução..."></textarea>
                </div>

                <div>
                    <label className="label">Arquivo Anexo (PDF, DOCX) - Opcional</label>
                    <div className="mt-1 flex flex-col items-center justify-center w-full h-32 rounded-xl transition-colors" style={{ border: '2px dashed var(--border-color)', background: 'var(--bg-input)' }}>
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                            <span className="text-sm px-4 text-center truncate" style={{ color: 'var(--text-muted)' }}>{file ? file.name : 'Clique para selecionar o arquivo (Opcional)'}</span>
                            <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx" />
                        </label>
                    </div>
                </div>

                <button type="submit" className="btn-primary mt-4" disabled={loading}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Salvar IT'}
                </button>
            </form>
        </div>
    )
}
