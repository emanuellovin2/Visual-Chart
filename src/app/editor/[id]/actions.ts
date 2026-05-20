'use server'

import { createClient as createClientAnon } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { CanvasNode, CanvasEdge } from '@/types'
import { saveCanvas as dbSaveCanvas, loadCanvas as dbLoadCanvas } from '@/lib/db'

const BUCKET = 'images'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function ensureBucket() {
  const sb = adminClient()
  const { error } = await sb.storage.createBucket(BUCKET, { public: true })
  // Ignore "already exists" error
  if (error && !error.message.includes('already exists')) throw error
}

export async function uploadNodeImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File
  const nodeId = formData.get('nodeId') as string

  await ensureBucket()

  const ext = (file.type.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg')
  const path = `${nodeId}.${ext}`

  const bytes = await file.arrayBuffer()
  const sb = adminClient()

  const { data, error } = await sb.storage
    .from(BUCKET)
    .upload(path, bytes, { upsert: true, contentType: file.type })

  if (error) throw new Error(error.message)

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function loadCanvas(
  projectId: string
): Promise<{ nodes: CanvasNode[]; edges: CanvasEdge[] }> {
  return dbLoadCanvas(projectId)
}

export async function getProjectVisibility(projectId: string): Promise<boolean> {
  const sb = await createClientAnon()
  const { data } = await sb
    .from('projects')
    .select('is_public')
    .eq('id', projectId)
    .maybeSingle()
  return (data as { is_public: boolean } | null)?.is_public ?? false
}

export async function setProjectVisibility(projectId: string, isPublic: boolean): Promise<void> {
  const sb = await createClientAnon()
  await sb.from('projects').update({ is_public: isPublic }).eq('id', projectId)
}

export async function saveCanvas(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): Promise<void> {
  return dbSaveCanvas(projectId, nodes, edges)
}
