import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProjects } from '@/lib/projects'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { ProjectsGrid } from '@/components/dashboard/ProjectsGrid'
import type { User } from '@/types'

export const metadata = { title: 'Dashboard — Graphify' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const [profileData, projects] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    getUserProjects(),
  ])

  const user: User = profileData.data ?? {
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: authUser.user_metadata?.full_name ?? null,
    avatar_url: authUser.user_metadata?.avatar_url ?? null,
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <DashboardHeader user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold">
            {user.full_name ? `Good to see you, ${user.full_name.split(' ')[0]}` : 'My projects'}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ProjectsGrid projects={projects} />
      </main>
    </div>
  )
}
