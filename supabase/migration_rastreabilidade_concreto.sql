-- ─────────────────────────────────────────────────────────────────────────────
-- Criação completa da tabela rastreabilidade_concreto
-- Execute no SQL Editor do Supabase (Dashboard → SQL Editor → New query)
-- Seguro para rodar mesmo se a tabela já existir (IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rastreabilidade_concreto (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id               uuid NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  created_by            uuid REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Identificação
  identificacao_pecas   text NOT NULL,
  area_pavto            text,
  cor_hex               text DEFAULT '#4A90D9',

  -- Data e volume
  data                  date NOT NULL DEFAULT CURRENT_DATE,
  quantidade_m3         numeric(8,2),

  -- Concreto
  fck_projeto           integer,
  usinado               boolean DEFAULT true,
  nota_transporte       text,

  -- Horários
  horario_chegada       time,
  horario_inicio        time,
  horario_final         time,
  horario_moldagem_cp   time,

  -- Ensaio
  slump                 numeric(5,1),

  -- Rompimentos
  rompimento_3          numeric(6,1),
  rompimento_7          numeric(6,1),
  rompimento_28a        numeric(6,1),
  rompimento_28b        numeric(6,1),

  -- Conformidade e responsável
  conforme              boolean,
  responsavel           text,

  -- Anexo relatório da usina
  relatorio_url         text,
  relatorio_nome        text,

  -- Observações
  observacoes           text
);

-- RLS
ALTER TABLE rastreabilidade_concreto ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado tem acesso total
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rastreabilidade_concreto'
    AND policyname = 'auth_full_access'
  ) THEN
    CREATE POLICY "auth_full_access" ON rastreabilidade_concreto
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END
$$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rastreabilidade_updated_at ON rastreabilidade_concreto;
CREATE TRIGGER trg_rastreabilidade_updated_at
  BEFORE UPDATE ON rastreabilidade_concreto
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- Bucket de Storage para relatórios da usina
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('saga-engenharia', 'saga-engenharia', true)
ON CONFLICT (id) DO NOTHING;

-- Política: usuários autenticados podem fazer upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'saga_engenharia_auth_upload'
  ) THEN
    CREATE POLICY "saga_engenharia_auth_upload" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'saga-engenharia');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'saga_engenharia_public_read'
  ) THEN
    CREATE POLICY "saga_engenharia_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'saga-engenharia');
  END IF;
END
$$;
