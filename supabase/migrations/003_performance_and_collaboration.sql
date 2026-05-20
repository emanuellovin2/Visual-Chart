-- Performance indexes
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);
create index if not exists idx_nodes_project_id on public.nodes(project_id);
create index if not exists idx_edges_project_id on public.edges(project_id);
create index if not exists idx_edges_source_id on public.edges(source_id);
create index if not exists idx_edges_target_id on public.edges(target_id);

-- updated_at triggers for nodes and edges (missing from initial migration)
create trigger handle_updated_at_nodes
  before update on public.nodes
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_edges
  before update on public.edges
  for each row execute procedure public.handle_updated_at();

-- Project collaborators (Phase 3 readiness)
create table if not exists public.project_collaborators (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null default 'viewer' check (role in ('viewer', 'editor', 'admin')),
  invited_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now() not null,
  unique (project_id, user_id)
);

alter table public.project_collaborators enable row level security;

create index if not exists idx_collaborators_project_id on public.project_collaborators(project_id);
create index if not exists idx_collaborators_user_id on public.project_collaborators(user_id);

create policy "Users can view own collaborations"
  on public.project_collaborators for select using (auth.uid() = user_id);

create policy "Project owners can manage collaborators"
  on public.project_collaborators for all using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );

-- Allow collaborators to view the projects they are invited to
create policy "Collaborators can view shared projects"
  on public.projects for select using (
    exists (
      select 1 from public.project_collaborators
      where project_id = id and user_id = auth.uid()
    )
  );

-- Allow collaborators with editor/admin role to view nodes
create policy "Collaborators can view nodes"
  on public.nodes for select using (
    exists (
      select 1 from public.project_collaborators
      where project_id = nodes.project_id
        and user_id = auth.uid()
        and role in ('editor', 'admin', 'viewer')
    )
  );

-- Allow collaborators with editor/admin role to view edges
create policy "Collaborators can view edges"
  on public.edges for select using (
    exists (
      select 1 from public.project_collaborators
      where project_id = edges.project_id
        and user_id = auth.uid()
        and role in ('editor', 'admin', 'viewer')
    )
  );

-- Allow collaborators with editor/admin role to modify nodes
create policy "Collaborators can edit nodes"
  on public.nodes for insert with check (
    exists (
      select 1 from public.project_collaborators
      where project_id = nodes.project_id
        and user_id = auth.uid()
        and role in ('editor', 'admin')
    )
  );

create policy "Collaborators can update nodes"
  on public.nodes for update using (
    exists (
      select 1 from public.project_collaborators
      where project_id = nodes.project_id
        and user_id = auth.uid()
        and role in ('editor', 'admin')
    )
  );

create policy "Collaborators can delete nodes"
  on public.nodes for delete using (
    exists (
      select 1 from public.project_collaborators
      where project_id = nodes.project_id
        and user_id = auth.uid()
        and role in ('editor', 'admin')
    )
  );

create policy "Collaborators can edit edges"
  on public.edges for insert with check (
    exists (
      select 1 from public.project_collaborators
      where project_id = edges.project_id
        and user_id = auth.uid()
        and role in ('editor', 'admin')
    )
  );

create policy "Collaborators can update edges"
  on public.edges for update using (
    exists (
      select 1 from public.project_collaborators
      where project_id = edges.project_id
        and user_id = auth.uid()
        and role in ('editor', 'admin')
    )
  );

create policy "Collaborators can delete edges"
  on public.edges for delete using (
    exists (
      select 1 from public.project_collaborators
      where project_id = edges.project_id
        and user_id = auth.uid()
        and role in ('editor', 'admin')
    )
  );

-- Canvas snapshots for history/versioning (stores full canvas JSON periodically)
create table if not exists public.canvas_snapshots (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  snapshot jsonb not null,
  label text,
  created_at timestamptz default now() not null
);

alter table public.canvas_snapshots enable row level security;

create index if not exists idx_snapshots_project_id_created on public.canvas_snapshots(project_id, created_at desc);

create policy "Users can manage own snapshots"
  on public.canvas_snapshots for all using (
    exists (select 1 from public.projects where id = project_id and user_id = auth.uid())
  );

-- RPC: save entire canvas atomically (upsert nodes + edges, delete orphans)
create or replace function public.save_canvas(
  p_project_id uuid,
  p_nodes jsonb,
  p_edges jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_node_ids uuid[];
  v_edge_ids uuid[];
begin
  -- Verify ownership
  if not exists (
    select 1 from public.projects
    where id = p_project_id
      and (
        user_id = auth.uid()
        or exists (
          select 1 from public.project_collaborators
          where project_id = p_project_id
            and user_id = auth.uid()
            and role in ('editor', 'admin')
        )
      )
  ) then
    raise exception 'Access denied';
  end if;

  -- Collect IDs
  select array_agg((n->>'id')::uuid) into v_node_ids
  from jsonb_array_elements(p_nodes) as n
  where n->>'id' is not null;

  select array_agg((e->>'id')::uuid) into v_edge_ids
  from jsonb_array_elements(p_edges) as e
  where e->>'id' is not null;

  -- Upsert nodes
  insert into public.nodes (id, project_id, type, position_x, position_y, width, height, data)
  select
    (n->>'id')::uuid,
    p_project_id,
    n->>'type',
    (n->>'position_x')::float,
    (n->>'position_y')::float,
    (n->>'width')::float,
    (n->>'height')::float,
    coalesce(n->'data', '{}'::jsonb)
  from jsonb_array_elements(p_nodes) as n
  on conflict (id) do update set
    type = excluded.type,
    position_x = excluded.position_x,
    position_y = excluded.position_y,
    width = excluded.width,
    height = excluded.height,
    data = excluded.data,
    updated_at = now();

  -- Upsert edges
  insert into public.edges (id, project_id, source_id, target_id, type, data)
  select
    (e->>'id')::uuid,
    p_project_id,
    (e->>'source_id')::uuid,
    (e->>'target_id')::uuid,
    coalesce(e->>'type', 'straight'),
    coalesce(e->'data', '{}'::jsonb)
  from jsonb_array_elements(p_edges) as e
  on conflict (id) do update set
    type = excluded.type,
    data = excluded.data,
    updated_at = now();

  -- Delete orphaned nodes
  delete from public.nodes
  where project_id = p_project_id
    and (v_node_ids is null or id != all(v_node_ids));

  -- Delete orphaned edges
  delete from public.edges
  where project_id = p_project_id
    and (v_edge_ids is null or id != all(v_edge_ids));

  -- Bump project updated_at
  update public.projects set updated_at = now() where id = p_project_id;
end;
$$;
