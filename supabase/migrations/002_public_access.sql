-- Allow anonymous read access to nodes of public projects
create policy "Allow reading nodes of public projects"
  on public.nodes for select using (
    exists (
      select 1 from public.projects
      where id = project_id and is_public = true
    )
  );

-- Allow anonymous read access to edges of public projects
create policy "Allow reading edges of public projects"
  on public.edges for select using (
    exists (
      select 1 from public.projects
      where id = project_id and is_public = true
    )
  );
