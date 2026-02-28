-- ─────────────────────────────────────────────────────────────────────────────
-- Migração consolidada — adicionar colunas ausentes em rdos e fvs
-- Execute no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabela rdos — campos de equipe e empreiteiros
ALTER TABLE rdos
  ADD COLUMN IF NOT EXISTS equipe_membros  jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS empreiteiros_presente int;

-- 2. Tabela fvs — campos de serviço e local
ALTER TABLE fvs
  ADD COLUMN IF NOT EXISTS servico_inspecionado text,
  ADD COLUMN IF NOT EXISTS local_trecho          text,
  ADD COLUMN IF NOT EXISTS responsavel           text,
  ADD COLUMN IF NOT EXISTS observacoes           text;
