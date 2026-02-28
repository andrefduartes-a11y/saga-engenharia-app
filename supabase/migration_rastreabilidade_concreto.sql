-- ─────────────────────────────────────────────────────────────────────────────
-- Rastreabilidade de Concreto (SAGA Construtora)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rastreabilidade_concreto (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id               uuid NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  created_by            uuid REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- Identificação
  identificacao_pecas   text NOT NULL,          -- "Identificação da(s) peça(s) concretada(s)"
  area_pavto            text,                   -- "Área / Pavto"
  cor_hex               text DEFAULT '#4A90D9', -- Color picker for row identification

  -- Data e volume
  data                  date NOT NULL DEFAULT CURRENT_DATE,
  quantidade_m3         numeric(8,2),

  -- Concreto
  fck_projeto           integer,                -- FCK de Projeto (MPa)
  usinado               boolean DEFAULT true,   -- Usinado? Sim/Não
  nota_transporte       text,                   -- Nº da Nota ou Conhecimento de Transporte

  -- Horários
  horario_chegada       time,                   -- Chegada do Caminhão à Obra
  horario_inicio        time,                   -- Início do Lançamento
  horario_final         time,                   -- Final do Lançamento
  horario_moldagem_cp   time,                   -- Moldagem do Corpo de Prova

  -- Ensaio
  slump                 numeric(5,1),           -- Slump (cm)

  -- Rompimentos (preenchidos depois)
  rompimento_3          numeric(6,1),           -- Resultado 3 dias (MPa)
  rompimento_7          numeric(6,1),           -- Resultado 7 dias (MPa)
  rompimento_28a        numeric(6,1),           -- Resultado 28 dias - 1º CP
  rompimento_28b        numeric(6,1),           -- Resultado 28 dias - 2º CP

  -- Conformidade e responsável
  conforme              boolean,                -- Conforme? (null = ainda não avaliado)
  responsavel           text,                   -- Responsável pelo preenchimento

  -- Anexo relatório da usina
  relatorio_url         text,                   -- URL do relatório da usina (Supabase Storage)
  relatorio_nome        text,                   -- Nome original do arquivo

  -- Observações
  observacoes           text
);

-- RLS
ALTER TABLE rastreabilidade_concreto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_full_access" ON rastreabilidade_concreto
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_rastreabilidade_updated_at ON rastreabilidade_concreto;
CREATE TRIGGER trg_rastreabilidade_updated_at
  BEFORE UPDATE ON rastreabilidade_concreto
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
