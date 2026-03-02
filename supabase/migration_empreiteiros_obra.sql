-- Tabela de empreiteiros pré-cadastrados por obra
CREATE TABLE IF NOT EXISTS empreiteiros_obra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
    empresa TEXT NOT NULL,
    servico TEXT NOT NULL DEFAULT 'Geral',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empreiteiros_obra_obra_id ON empreiteiros_obra(obra_id);

-- Coluna para armazenar as equipes de empreiteiros por RDO (JSON array)
ALTER TABLE rdos ADD COLUMN IF NOT EXISTS empreiteiros_json JSONB;
