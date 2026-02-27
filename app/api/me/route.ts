import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function GET() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    try {
        const admin = createAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: perfil } = await admin
            .from('perfis')
            .select('nome, role, active, permissions, obras_ids')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            id: user.id,
            email: user.email,
            nome: perfil?.nome || user.email?.split('@')[0] || 'Usuário',
            role: perfil?.role || 'engenheiro',
            active: perfil?.active !== false,
            permissions: perfil?.permissions || {},
            obras_ids: perfil?.obras_ids || [],
        })
    } catch {
        return NextResponse.json({
            id: user.id,
            email: user.email,
            nome: user.email?.split('@')[0] || 'Usuário',
            role: 'engenheiro',
            active: true,
            permissions: {},
        })
    }
}
