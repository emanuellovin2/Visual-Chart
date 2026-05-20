import { createClient } from '@/lib/supabase/server'
import type { CanvasEdge, Json } from '@/types'

type EdgeRow = {
  id: string
  project_id: string
  source_id: string
  target_id: string
  type: string
  data: Json
  created_at: string
  updated_at: string
}

function rowToEdge(row: EdgeRow): CanvasEdge {
  const d = (row.data ?? {}) as Record<string, unknown>
  return {
    id: row.id,
    sourceId: row.source_id,
    targetId: row.target_id,
    type: row.type as CanvasEdge['type'],
    sourcePort: (d.sourcePort as CanvasEdge['sourcePort']) ?? 'e',
    targetPort: (d.targetPort as CanvasEdge['targetPort']) ?? 'w',
    label: (d.label as string) ?? '',
    style: d.style as CanvasEdge['style'],
  }
}

export async function getProjectEdges(projectId: string): Promise<CanvasEdge[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('edges')
    .select('*')
    .eq('project_id', projectId)
  if (error || !data) return []
  return (data as EdgeRow[]).map(rowToEdge)
}

export function edgeToRow(e: CanvasEdge, projectId: string) {
  return {
    id: e.id,
    project_id: projectId,
    source_id: e.sourceId,
    target_id: e.targetId,
    type: e.type as string,
    data: { sourcePort: e.sourcePort, targetPort: e.targetPort, label: e.label, style: e.style as unknown } as unknown as Json,
  }
}

export async function upsertEdges(edges: CanvasEdge[], projectId: string): Promise<boolean> {
  if (edges.length === 0) return true
  const sb = await createClient()
  const { error } = await sb
    .from('edges')
    .upsert(edges.map((e) => edgeToRow(e, projectId)), { onConflict: 'id' })
  return !error
}

export async function deleteOrphanEdges(projectId: string, keepIds: string[]): Promise<boolean> {
  const sb = await createClient()
  if (keepIds.length === 0) {
    const { error } = await sb.from('edges').delete().eq('project_id', projectId)
    return !error
  }
  const { error } = await sb
    .from('edges')
    .delete()
    .eq('project_id', projectId)
    .not('id', 'in', `(${keepIds.join(',')})`)
  return !error
}
