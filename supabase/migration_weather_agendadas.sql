-- =====================================================
-- SAGA Engenharia — Migration: Weather + Concretagens Agendadas
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna 'cidade' à tabela obras (para geocodificação do clima)
ALTER TABLE obras ADD COLUMN IF NOT EXISTS cidade text;

-- 2. Criar tabela de concretagens agendadas (futuras)
CREATE TABLE IF NOT EXISTS concretagens_agendadas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id uuid REFERENCES obras(id) ON DELETE CASCADE NOT NULL,
  data_agendada date NOT NULL,
  elemento text,
  volume_estimado numeric,
  fck_previsto int,
  observacoes text,
  criado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE concretagens_agendadas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'concretagens_agendadas' AND policyname = 'auth_select_concretagens_agendadas'
  ) THEN
    CREATE POLICY "auth_select_concretagens_agendadas" ON concretagens_agendadas
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'concretagens_agendadas' AND policyname = 'auth_insert_concretagens_agendadas'
  ) THEN
    CREATE POLICY "auth_insert_concretagens_agendadas" ON concretagens_agendadas
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'concretagens_agendadas' AND policyname = 'auth_update_concretagens_agendadas'
  ) THEN
    CREATE POLICY "auth_update_concretagens_agendadas" ON concretagens_agendadas
      FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'concretagens_agendadas' AND policyname = 'auth_delete_concretagens_agendadas'
  ) THEN
    CREATE POLICY "auth_delete_concretagens_agendadas" ON concretagens_agendadas
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
