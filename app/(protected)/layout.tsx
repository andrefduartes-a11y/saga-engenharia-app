export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ObraProvider } from '@/lib/obra-context'
import ProtectedShell from '@/components/ProtectedShell'

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <ObraProvider>
            <ProtectedShell user={user}>
                {children}
            </ProtectedShell>
        </ObraProvider>
    )
}
