import Link from 'next/link'
import { ShieldOff, ArrowLeft } from 'lucide-react'

export default function AcessoNegadoPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex flex-col items-center text-center animate-fade-up">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(224, 82, 82, 0.15)', border: '1px solid rgba(224, 82, 82, 0.3)' }}>
                    <ShieldOff size={36} style={{ color: '#E05252' }} />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Acesso Negado</h1>
                <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--text-muted)' }}>
                    Você não tem permissão para acessar esta área. Entre em contato com o administrador.
                </p>
                <Link href="/dashboard" className="btn-secondary">
                    <ArrowLeft size={18} />
                    Voltar ao Dashboard
                </Link>
            </div>
        </div>
    )
}
