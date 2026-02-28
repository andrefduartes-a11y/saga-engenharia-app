-- Adiciona coluna subpasta na tabela projetos (para suporte a subpastas)
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS subpasta text;
