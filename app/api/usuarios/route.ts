import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Admin Supabase client (uses service_role key — bypasses RLS)
function getAdmin() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// GET /api/usuarios — lista todos os usuários (só admin)
export async function GET(_req: NextRequest) {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    // Verificar se é admin
    const admin = getAdmin()
    const { data: perfil } = await admin.from('perfis').select('role').eq('id', user.id).single()
    if (perfil?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

    // Buscar todos os perfis
    const { data: perfis, error } = await admin
        .from('perfis')
        .select('*')
        .order('nome', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(perfis ?? [])
}

// POST /api/usuarios — cria novo usuário
export async function POST(req: NextRequest) {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const admin = getAdmin()
    const { data: perfil } = await admin.from('perfis').select('role').eq('id', user.id).single()
    if (perfil?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

    const { email, nome, password, role } = await req.json()

    if (!email || !nome || !password || !role) {
        return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 })
    }

    const validRoles = ['admin', 'diretor', 'engenheiro', 'visualizador']
    if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Perfil inválido.' }, { status: 400 })
    }

    // Criar usuário no Supabase Auth
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome }
    })

    if (createError) {
        if (createError.message.includes('already')) {
            return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
        }
        return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Criar perfil na tabela perfis
    const { data: novoPerfil, error: perfilError } = await admin.from('perfis').upsert({
        id: newUser.user.id,
        email: email.toLowerCase(),
        nome,
        role,
        active: true,
        permissions: {},
        obras_ids: [],
    }).select().single()

    if (perfilError) {
        return NextResponse.json({ error: perfilError.message }, { status: 500 })
    }

    return NextResponse.json(novoPerfil, { status: 201 })
}

// PATCH /api/usuarios — atualiza usuário (active, role, permissions, obras_ids)
export async function PATCH(req: NextRequest) {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const admin = getAdmin()
    const { data: perfil } = await admin.from('perfis').select('role').eq('id', user.id).single()
    if (perfil?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

    const { id, active, role, permissions, obras_ids } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (active !== undefined) updates.active = active
    if (role !== undefined) updates.role = role
    if (permissions !== undefined) updates.permissions = permissions
    if (obras_ids !== undefined) updates.obras_ids = obras_ids

    const { data, error } = await admin
        .from('perfis')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
}
