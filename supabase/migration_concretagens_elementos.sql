-- ─────────────────────────────────────────────────────────────────────────────
-- Migração definitiva da tabela concretagens
-- Adiciona TODAS as colunas que o app usa e ainda não existem no banco
-- Execute no SQL Editor do Supabase (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE concretagens
  ADD COLUMN IF NOT EXISTS volume_m3              numeric(8,2),
  ADD COLUMN IF NOT EXISTS elementos_concretados  text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fornecedor             text,
  ADD COLUMN IF NOT EXISTS caminhao               text,
  ADD COLUMN IF NOT EXISTS nota_fiscal            text,
  ADD COLUMN IF NOT EXISTS responsavel            text,
  ADD COLUMN IF NOT EXISTS cor_hex                text      DEFAULT '#4A90D9';
