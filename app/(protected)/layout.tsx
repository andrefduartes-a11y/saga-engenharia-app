export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'

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
        <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <TopBar user={user} />
            <main className="flex-1 pb-24 pt-2">
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
