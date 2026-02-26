-- =====================================================
-- SAGA ENGENHARIA — Schema do Banco (Supabase)
-- Execute no SQL Editor do Supabase
-- =====================================================

-- Tabela de perfis (complementa auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  nome text,
  role text default 'engenheiro' check (role in ('admin', 'engenheiro', 'tecnico')),
  created_at timestamptz default now()
);

-- Trigger para criar profile automaticamente no cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Obras
create table if not exists obras (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  spe_id text,
  status text default 'ativa' check (status in ('ativa', 'pausada', 'concluida')),
  data_inicio date,
  data_previsao_fim date,
  created_at timestamptz default now()
);

-- RDOs (Relatório Diário de Obra)
create table if not exists rdos (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade,
  data date not null,
  clima text,
  equipe_presente int,
  descricao_atividades text,
  ocorrencias text,
  fotos_url text[],
  custo_real numeric,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Concretagens
create table if not exists concretagens (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade,
  data date not null,
  fornecedor text,
  fck int,
  volume numeric,
  elemento text,
  fotos_url text[],
  custo_real numeric,
  created_at timestamptz default now()
);

-- Equipamentos
create table if not exists equipamentos (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete set null,
  nome text not null,
  horas_utilizadas numeric,
  custo_estimado numeric,
  custo_real numeric,
  data_registro date,
  created_at timestamptz default now()
);

-- Documentos do projeto
create table if not exists documentos_projeto (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete set null,
  nome_arquivo text not null,
  tipo text check (tipo in ('projeto', 'contrato', 'memorial', 'foto', 'rdo', 'concreto', 'outro')),
  url_storage text not null,
  tamanho_bytes int,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
alter table profiles enable row level security;
alter table obras enable row level security;
alter table rdos enable row level security;
alter table concretagens enable row level security;
alter table equipamentos enable row level security;
alter table documentos_projeto enable row level security;

-- Policies: usuários autenticados têm acesso
create policy "Usuários autenticados podem ver obras"
  on obras for select to authenticated using (true);
create policy "Usuários autenticados podem inserir obras"
  on obras for insert to authenticated with check (true);
create policy "Usuários autenticados podem atualizar obras"
  on obras for update to authenticated using (true);

create policy "Usuários autenticados podem ver RDOs"
  on rdos for select to authenticated using (true);
create policy "Usuários autenticados podem inserir RDOs"
  on rdos for insert to authenticated with check (true);
create policy "Usuários autenticados podem atualizar seus RDOs"
  on rdos for update to authenticated using (auth.uid() = created_by);

create policy "Usuários autenticados podem ver concretagens"
  on concretagens for select to authenticated using (true);
create policy "Usuários autenticados podem inserir concretagens"
  on concretagens for insert to authenticated with check (true);

create policy "Usuários autenticados podem ver equipamentos"
  on equipamentos for select to authenticated using (true);
create policy "Usuários autenticados podem inserir equipamentos"
  on equipamentos for insert to authenticated with check (true);

create policy "Usuários autenticados podem ver documentos"
  on documentos_projeto for select to authenticated using (true);
create policy "Usuários autenticados podem inserir documentos"
  on documentos_projeto for insert to authenticated with check (true);

create policy "Usuários podem ver seu profile"
  on profiles for select to authenticated using (auth.uid() = id);
create policy "Usuários podem atualizar seu profile"
  on profiles for update to authenticated using (auth.uid() = id);

-- =====================================================
-- STORAGE BUCKET
-- =====================================================
-- Execute via Supabase Dashboard → Storage → New Bucket:
-- Nome: saga-engenharia
-- Public: false (ou true para simplificar)
-- File size limit: 52428800 (50MB)

-- Ou via SQL:
insert into storage.buckets (id, name, public, file_size_limit)
values ('saga-engenharia', 'saga-engenharia', true, 52428800)
on conflict (id) do nothing;

create policy "Usuários autenticados podem fazer upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'saga-engenharia');

create policy "Usuários autenticados podem ver arquivos"
  on storage.objects for select to authenticated
  using (bucket_id = 'saga-engenharia');

-- =====================================================
-- NOVOS M�DULOS (APLICATIVO SAGA ENGENHARIA 2.0)
-- =====================================================

-- Projetos (Plantas, Desenhos e Projetos Executivos)
create table if not exists projetos (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade,
  nome text not null,
  disciplina text,
  revisao text default 'R00',
  url_arquivo text,
  data_upload date default CURRENT_DATE,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Instru��es de Trabalho (ITs Gen�ricas)
create table if not exists instrucoes_trabalho (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descricao text,
  url_arquivo text,
  created_at timestamptz default now()
);

-- Inspe��es de Servi�o (FVS)
create table if not exists fvs (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade,
  data date not null,
  servico_inspecionado text not null,
  local_trecho text,
  verificacoes jsonb default '[]'::jsonb,
  status text default 'em_andamento' check (status in ('em_andamento', 'aprovado', 'reprovado')),
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Apontamento de Horas de Equipamentos
create table if not exists apontamento_equipamentos (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade,
  data date not null,
  equipamento text not null,
  horas_trabalhadas numeric not null,
  atividade_realizada text,
  observacao text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Controle de Viagens de Caminh�o (Terraplanagem)
create table if not exists viagens_caminhao (
  id uuid default gen_random_uuid() primary key,
  obra_id uuid references obras(id) on delete cascade,
  data date not null,
  tipo_caminhao text not null,
  placa text,
  qtd_viagens int not null default 1,
  material_transportado text,
  origem text,
  destino text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Habilitar RLS nas novas tabelas
alter table projetos enable row level security;
alter table instrucoes_trabalho enable row level security;
alter table fvs enable row level security;
alter table apontamento_equipamentos enable row level security;
alter table viagens_caminhao enable row level security;

-- Pol�ticas de RLS
create policy "Autenticados veem projetos" on projetos for select to authenticated using (true);
create policy "Autenticados inserem projetos" on projetos for insert to authenticated with check (true);
create policy "Autenticados veem ITs" on instrucoes_trabalho for select to authenticated using (true);
create policy "Autenticados inserem ITs" on instrucoes_trabalho for insert to authenticated with check (true);
create policy "Autenticados veem FVS" on fvs for select to authenticated using (true);
create policy "Autenticados inserem FVS" on fvs for insert to authenticated with check (true);
create policy "Autenticados atualizam FVS" on fvs for update to authenticated using (auth.uid() = created_by);
create policy "Autenticados veem apontamento equipamentos" on apontamento_equipamentos for select to authenticated using (true);
create policy "Autenticados inserem apontamento equipamentos" on apontamento_equipamentos for insert to authenticated with check (true);
create policy "Autenticados veem viagens de caminhao" on viagens_caminhao for select to authenticated using (true);
create policy "Autenticados inserem viagens de caminhao" on viagens_caminhao for insert to authenticated with check (true);
