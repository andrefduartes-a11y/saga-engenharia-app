-- Adicionar novos campos à tabela rdos
-- Execute no SQL Editor do Supabase

alter table rdos 
  add column if not exists equipe_membros jsonb default '[]'::jsonb,
  add column if not exists empreiteiros_presente int;

-- Remove o campo custo_real se quiser (opcional - comentado por segurança)
-- alter table rdos drop column if exists custo_real;
