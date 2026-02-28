-- ─── Migration: Equipe Obra + equipe_json no RDO ─────────────────────────────

-- 1. Tabela de membros pré-cadastrados por obra
CREATE TABLE IF NOT EXISTS equipe_obra (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    obra_id     uuid NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
    nome        text NOT NULL,
    funcao      text NOT NULL,
    ativo       boolean DEFAULT true,
    created_at  timestamptz DEFAULT now()
);

ALTER TABLE equipe_obra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage equipe_obra"
    ON equipe_obra FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

-- 2. Coluna equipe_json na tabela rdos (array de {nome, funcao})
ALTER TABLE rdos
    ADD COLUMN IF NOT EXISTS equipe_json jsonb DEFAULT '[]'::jsonb;

-- Index para buscas por obra
CREATE INDEX IF NOT EXISTS equipe_obra_obra_id_idx ON equipe_obra(obra_id);
