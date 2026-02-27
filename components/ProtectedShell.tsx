'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'

// Mapeamento de paths para títulos de página
const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/obras': 'Obras',
    '/concreto': 'Concretagem',
    '/terraplanagem': 'Terraplanagem',
    '/equipamentos': 'Equipamentos',
    '/caminhoes': 'Caminhões',
    '/rdo': 'RDO',
    '/inspecoes': 'FVS — Fichas de Verificação',
    '/instrucoes-trabalho': 'Instruções de Trabalho',
    '/projetos': 'Projetos',
    '/documentos': 'Documentos',
    '/suprimentos': 'Suprimentos',
    '/assistente': 'Assistente IA',
    '/ead': 'EAD',
    '/faq': 'FAQ / DRH',
    '/perfil': 'Perfil',
    '/selecionar-obra': 'Selecionar Obra',
    '/tracos': 'Banco de Traços',
    '/apoio-tecnico': 'Apoio Técnico',
}

function getTitle(pathname: string): string {
    // Exact match
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
    // Prefix match (for dynamic routes)
    const base = '/' + pathname.split('/')[1]
    return PAGE_TITLES[base] || 'Saga Engenharia'
}

export default function ProtectedShell({
    user,
    children,
}: {
    user: { email?: string } | null
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <AppShell
            title={getTitle(pathname)}
            activeNav={'/' + pathname.split('/')[1]}
            user={user}
            onLogout={handleLogout}
        >
            {children}
        </AppShell>
    )
}
