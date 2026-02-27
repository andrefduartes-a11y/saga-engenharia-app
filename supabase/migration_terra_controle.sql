-- ─────────────────────────────────────────────────────────────────────────────
-- Controle Diário de Terraplanagem
-- Tabelas: controle_viagens_caminhao + controle_horas_equipamento
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Viagens de caminhão por dia -----------------------------------------------
CREATE TABLE IF NOT EXISTS controle_viagens_caminhao (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_id            uuid NOT NULL REFERENCES terraplanagem_etapas(id) ON DELETE CASCADE,
  data                date NOT NULL DEFAULT CURRENT_DATE,
  caminhao_id         uuid REFERENCES caminhoes(id) ON DELETE SET NULL,
  tipo_caminhao       text,          -- fallback / preenchimento manual
  placa               text,
  quantidade_viagens  integer NOT NULL DEFAULT 1,
  valor_por_viagem    numeric(10,2),
  observacoes         text,
  created_at          timestamptz DEFAULT now()
);

-- 2. Horas de equipamento por dia -----------------------------------------------
CREATE TABLE IF NOT EXISTS controle_horas_equipamento (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_id            uuid NOT NULL REFERENCES terraplanagem_etapas(id) ON DELETE CASCADE,
  data                date NOT NULL DEFAULT CURRENT_DATE,
  equipamento_id      uuid REFERENCES equipamentos(id) ON DELETE SET NULL,
  nome_equipamento    text,          -- fallback / preenchimento manual
  hora_inicio         time NOT NULL,
  hora_fim            time NOT NULL,
  horas_calculadas    numeric(5,2),  -- calculado no app (hora_fim - hora_inicio em horas)
  valor_por_hora      numeric(10,2),
  observacoes         text,
  created_at          timestamptz DEFAULT now()
);

-- 3. Índices -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_viagens_etapa ON controle_viagens_caminhao(etapa_id, data);
CREATE INDEX IF NOT EXISTS idx_horas_etapa   ON controle_horas_equipamento(etapa_id, data);

-- 4. RLS — mesma política das outras tabelas (autenticado = acesso total) -----
ALTER TABLE controle_viagens_caminhao ENABLE ROW LEVEL SECURITY;
ALTER TABLE controle_horas_equipamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_viagens" ON controle_viagens_caminhao
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_horas" ON controle_horas_equipamento
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
