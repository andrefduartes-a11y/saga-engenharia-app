-- ─────────────────────────────────────────────────────────────────────────────
-- Migração: liga rastreabilidade ao agendamento e adiciona status/foto
-- Execute no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. concretagens_agendadas: status + foto do mapa
ALTER TABLE concretagens_agendadas
  ADD COLUMN IF NOT EXISTS status       text DEFAULT 'agendada',  -- agendada | realizada
  ADD COLUMN IF NOT EXISTS foto_mapa_url text;

-- 2. rastreabilidade_concreto: vínculo ao agendamento + placa do caminhão
ALTER TABLE rastreabilidade_concreto
  ADD COLUMN IF NOT EXISTS agendamento_id  uuid REFERENCES concretagens_agendadas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS placa_caminhao  text;
