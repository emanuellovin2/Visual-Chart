-- Users profile table (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null default 'Untitled Project',
  description text,
  thumbnail_url text,
  is_public boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Nodes table
create table if not exists public.nodes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  type text not null,
  position_x float not null default 0,
  position_y float not null default 0,
  width float not null default 160,
  height float not null default 80,
  data jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Edges table
create table if not exists public.edges (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  source_id uuid references public.nodes(id) on delete cascade not null,
  target_id uuid references public.nodes(id) on delete cascade not null,
  type text not null default 'straight',
  data jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.nodes enable row level security;
alter table public.edges enable row level security;

-- Users policies
create policy "Users can view own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- Projects policies
create policy "Users can view own projects"
  on public.projects for select using (auth.uid() = user_id);

create policy "Users can view public projects"
  on public.projects for select using (is_public = true);

create policy "Users can insert own projects"
  on public.projects for insert with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete using (auth.uid() = user_id);

-- Nodes policies
create policy "Users can manage own nodes"
  on public.nodes for all using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );

-- Edges policies
create policy "Users can manage own edges"
  on public.edges for all using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_updated_at_users
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_projects
  before update on public.projects
  for each row execute procedure public.handle_updated_at();
