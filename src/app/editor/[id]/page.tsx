import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditorLayout } from './EditorLayout'
import { loadCanvas } from '@/lib/db'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('title')
    .eq('id', id)
    .maybeSingle()
  return { title: project ? `${project.title} — Graphify` : 'Editor — Graphify' }
}

export default async function EditorPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, is_public')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!project) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const p = project as { id: string; title: string; is_public: boolean }
  const canvas = await loadCanvas(p.id)
  const userName = (profile as { full_name: string | null; avatar_url: string | null } | null)?.full_name
    ?? user.email?.split('@')[0]
    ?? 'User'
  const avatarUrl = (profile as { full_name: string | null; avatar_url: string | null } | null)?.avatar_url ?? null

  return (
    <EditorLayout
      projectId={p.id}
      projectTitle={p.title}
      initialNodes={canvas.nodes}
      initialEdges={canvas.edges}
      initialIsPublic={p.is_public ?? false}
      userId={user.id}
      userName={userName}
      avatarUrl={avatarUrl}
    />
  )
}
