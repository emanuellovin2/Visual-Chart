import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export async function getUserProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return []
  return data as Project[]
}

export async function createProject(title = 'Untitled Project'): Promise<Project | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, title })
    .select()
    .single()

  if (error) return null
  return data as Project
}

export async function renameProject(id: string, title: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ title })
    .eq('id', id)
  return !error
}

export async function duplicateProject(id: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: original } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!original) return null

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: `${original.title} (copy)`,
      description: original.description,
    })
    .select()
    .single()

  if (error) return null
  return data as Project
}

export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  return !error
}
