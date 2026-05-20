'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createProject, renameProject, duplicateProject, deleteProject } from '@/lib/projects'

export async function createProjectAction(_prevState: { error: string } | undefined) {
  const project = await createProject()
  if (!project) return { error: 'Failed to create project' }
  revalidatePath('/dashboard')
  redirect(`/editor/${project.id}`)
}

export async function renameProjectAction(id: string, title: string) {
  const ok = await renameProject(id, title.trim() || 'Untitled Project')
  if (!ok) return { error: 'Failed to rename project' }
  revalidatePath('/dashboard')
}

export async function duplicateProjectAction(id: string) {
  const project = await duplicateProject(id)
  if (!project) return { error: 'Failed to duplicate project' }
  revalidatePath('/dashboard')
}

export async function deleteProjectAction(id: string) {
  const ok = await deleteProject(id)
  if (!ok) return { error: 'Failed to delete project' }
  revalidatePath('/dashboard')
}
