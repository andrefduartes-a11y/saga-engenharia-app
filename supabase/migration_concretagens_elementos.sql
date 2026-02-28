-- ─────────────────────────────────────────────────────────────────────────────
-- Migração: adicionar coluna elementos_concretados à tabela concretagens
-- Execute no SQL Editor do Supabase (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE concretagens
  ADD COLUMN IF NOT EXISTS elementos_concretados text[] DEFAULT '{}';
