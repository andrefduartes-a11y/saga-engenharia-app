import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/obras — lista todas as obras (autenticado)
export async function GET() {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data: obras, error } = await supabase
        .from('obras')
        .select('id, nome, endereco, cidade, status')
        .order('nome', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(obras ?? [])
}
