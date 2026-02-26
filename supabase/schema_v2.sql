-- =====================================================
-- SAGA ENGENHARIA 2.0 — Schema Completo
-- Execute no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- OBRAS (já existe — garantir campos extras)
-- =====================================================
alter table obras add column if not exists descricao text;
alter table obras add column if not exists endereco text;
alter table obras add column if not exists responsavel_tecnico text;

-- =====================================================
-- MÓDULO CONCRETAGEM
-- =====================================================
create table if not exists concretagens (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade not null,
  data_concretagem date not null,
  elementos_concretados text[] default '{}',
  volume_m3 numeric not null,
  fck int,
  fornecedor text,
  caminhao text,
  nota_fiscal text,
  responsavel text,
  cor_hex text default '#525F6B',
  created_at timestamptz default now()
);

-- Rompimentos (subcoleção de concretagens)
create table if not exists rompimentos (
  id uuid default gen_random_uuid() primary key,
  concretagem_id uuid references concretagens(id) on delete cascade not null,
  idade_dias int not null,
  data_rompimento date,
  mpa numeric,
  laboratorio text,
  observacoes text,
  anexo_url text,
  created_at timestamptz default now()
);

-- Anexos de concretagens
create table if not exists anexos_concretagem (
  id uuid default gen_random_uuid() primary key,
  concretagem_id uuid references concretagens(id) on delete cascade not null,
  tipo text check (tipo in ('foto', 'pdf', 'mapa')),
  url text not null,
  data_upload timestamptz default now()
);

-- =====================================================
-- BANCO DE TRAÇOS
-- =====================================================
create table if not exists tracos_concreto (
  id uuid default gen_random_uuid() primary key,
  nome_traco text not null,
  fck int,
  cimento_kg_m3 numeric,
  areia_m3 numeric,
  brita_m3 numeric,
  agua_l numeric,
  aditivo text,
  slump text,
  observacoes text,
  created_at timestamptz default now()
);

-- =====================================================
-- MÓDULO TERRAPLANAGEM
-- =====================================================
create table if not exists terraplanagem_etapas (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade not null,
  nome_etapa text not null,
  data_inicio date,
  responsavel text,
  status text default 'em_andamento' check (status in ('em_andamento', 'finalizada')),
  created_at timestamptz default now()
);

create table if not exists registros_diarios_terra (
  id uuid default gen_random_uuid() primary key,
  etapa_id uuid references terraplanagem_etapas(id) on delete cascade not null,
  data date not null,
  equipamentos text[] default '{}',
  horas_trabalhadas numeric,
  viagens int,
  volume_movimentado numeric,
  observacoes text,
  created_at timestamptz default now()
);

-- =====================================================
-- MÓDULO MONITORAMENTO — ITs e FVS
-- =====================================================
drop table if exists instrucoes_trabalho cascade;
create table if not exists its (
  id uuid default gen_random_uuid() primary key,
  codigo text not null,
  nome text not null,
  categoria text,
  descricao text,
  revisao text default 'R00',
  vigente boolean default true,
  anexo_pdf_url text,
  created_at timestamptz default now()
);

drop table if exists fvs cascade;
create table if not exists fvs (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade not null,
  it_id uuid references its(id) on delete set null,
  elemento text,
  data date not null,
  status text default 'em_andamento' check (status in ('aprovado', 'reprovado', 'em_andamento')),
  responsavel text,
  observacoes text,
  verificacoes jsonb default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- =====================================================
-- MÓDULO PROJETOS (v2 com 13 disciplinas fixas)
-- =====================================================
drop table if exists projetos cascade;
create table if not exists projetos (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade not null,
  disciplina text not null,
  nome text not null,
  revisao text default 'R00',
  vigente boolean default true,
  data date default CURRENT_DATE,
  download_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- =====================================================
-- MÓDULO SUPRIMENTOS (por voz)
-- =====================================================
create table if not exists solicitacoes_suprimentos (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade not null,
  usuario uuid references auth.users(id),
  texto_original text,
  texto_formatado text,
  created_at timestamptz default now()
);

-- =====================================================
-- MÓDULO ASSISTENTE IA (logs)
-- =====================================================
create table if not exists assistant_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  pergunta text,
  resposta text,
  tokens_estimados int,
  created_at timestamptz default now()
);

-- =====================================================
-- EAD
-- =====================================================
create table if not exists ead_modules (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descricao text,
  ordem int default 0,
  created_at timestamptz default now()
);

create table if not exists ead_lessons (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references ead_modules(id) on delete cascade not null,
  titulo text not null,
  ordem int default 0,
  video_url text,
  created_at timestamptz default now()
);

-- =====================================================
-- FAQ / DRH
-- =====================================================
create table if not exists faq (
  id uuid default gen_random_uuid() primary key,
  categoria text,
  pergunta text not null,
  resposta text not null,
  created_at timestamptz default now()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
alter table concretagens enable row level security;
alter table rompimentos enable row level security;
alter table anexos_concretagem enable row level security;
alter table tracos_concreto enable row level security;
alter table terraplanagem_etapas enable row level security;
alter table registros_diarios_terra enable row level security;
alter table its enable row level security;
alter table fvs enable row level security;
alter table projetos enable row level security;
alter table solicitacoes_suprimentos enable row level security;
alter table assistant_logs enable row level security;
alter table ead_modules enable row level security;
alter table ead_lessons enable row level security;
alter table faq enable row level security;

-- Policies genéricas: autenticados têm acesso total
do $$ declare t text; begin
  for t in select unnest(array[
    'concretagens','rompimentos','anexos_concretagem','tracos_concreto',
    'terraplanagem_etapas','registros_diarios_terra','its','fvs',
    'projetos','solicitacoes_suprimentos','ead_modules','ead_lessons','faq'
  ]) loop
    execute format('create policy "auth_select_%s" on %s for select to authenticated using (true)', t, t);
    execute format('create policy "auth_insert_%s" on %s for insert to authenticated with check (true)', t, t);
    execute format('create policy "auth_update_%s" on %s for update to authenticated using (true)', t, t);
  end loop;
end $$;

-- assistant_logs: cada usuário vê só os seus
create policy "auth_select_assistant_logs" on assistant_logs for select to authenticated using (auth.uid() = user_id);
create policy "auth_insert_assistant_logs" on assistant_logs for insert to authenticated with check (auth.uid() = user_id);
