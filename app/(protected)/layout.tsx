export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'
import { ObraProvider } from '@/lib/obra-context'

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
            <div className="flex flex-col min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
                <div className="watermark-bg" />
                <TopBar user={user} />
                <main className="flex-1 pb-24 pt-2 relative z-10 w-full">
                    {children}
                </main>
                <BottomNav />
            </div>
        </ObraProvider>
    )
}
