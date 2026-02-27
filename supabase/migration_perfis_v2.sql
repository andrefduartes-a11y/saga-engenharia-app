-- ============================================================
-- Migration: Perfis Table with Roles, Permissions & Obra Access
-- Run questo SQL no painel do Supabase (SQL Editor)
-- ============================================================

-- 1. Cria tabela perfis se não existir
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nome TEXT,
    role TEXT NOT NULL DEFAULT 'engenheiro',
    active BOOLEAN NOT NULL DEFAULT true,
    permissions JSONB DEFAULT '{}',
    obras_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adiciona colunas se a tabela já existia sem elas
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'engenheiro';
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS obras_ids TEXT[] DEFAULT '{}';

-- 3. Habilita RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- Qualquer usuário autenticado pode ler seu próprio perfil
DROP POLICY IF EXISTS "perfil_proprio" ON public.perfis;
CREATE POLICY "perfil_proprio" ON public.perfis
    FOR SELECT USING (auth.uid() = id);

-- Admin pode ler todos os perfis
DROP POLICY IF EXISTS "admin_read_all" ON public.perfis;
CREATE POLICY "admin_read_all" ON public.perfis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfis p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_perfis_updated_at ON public.perfis;
CREATE TRIGGER set_perfis_updated_at
    BEFORE UPDATE ON public.perfis
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Cria seu usuário admin (substitua pelo seu email)
-- UPDATE public.perfis SET role = 'admin' WHERE email = 'seu@email.com';
