import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/faq
export async function GET() {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data, error } = await supabase
        .from('faq')
        .select('*')
        .order('categoria')
        .order('pergunta')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
}

// POST /api/faq — insere FAQ (admin/diretor)
export async function POST(req: Request) {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await req.json()
    const { data, error } = await supabase.from('faq').insert(body).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
