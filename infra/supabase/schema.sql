-- Perfis: 1 linha por usuário logado, ligada ao auth.users do Supabase
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text,
  avatar_url text,
  github_access_token text, -- guardado só pra chamadas server-side, nunca exposto ao client
  bio text,
  location text,
  summary text, -- resumo profissional gerado
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Repositórios detectados via API do GitHub, com o score de impacto calculado
create table repos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  github_repo_id bigint not null,
  name text not null,
  description text,
  stack text[], -- ex: {"TypeScript","Node.js"}
  stars int default 0,
  forks int default 0,
  commits int default 0,
  impact_score int default 0,
  is_selected boolean default false, -- se o usuário escolheu pro currículo
  created_at timestamptz default now(),
  unique (profile_id, github_repo_id)
);

-- RLS: cada usuário só vê e edita os próprios dados
alter table profiles enable row level security;
alter table repos enable row level security;

create policy "usuário lê seu próprio perfil"
  on profiles for select using (auth.uid() = id);

create policy "usuário atualiza seu próprio perfil"
  on profiles for update using (auth.uid() = id);

create policy "usuário lê seus próprios repos"
  on repos for select using (auth.uid() = profile_id);

create policy "usuário edita seus próprios repos (seleção)"
  on repos for update using (auth.uid() = profile_id);

create policy "qualquer um lê repos selecionados publicamente"
  on repos for select using (is_selected = true);

create view public_profiles as
  select id, github_username, avatar_url, bio, location, summary, created_at
  from profiles;

grant select on public_profiles to anon, authenticated;