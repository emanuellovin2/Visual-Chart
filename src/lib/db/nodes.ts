import { createClient } from '@/lib/supabase/server'
import type { CanvasNode, Json } from '@/types'

type NodeRow = {
  id: string
  project_id: string
  type: string
  position_x: number
  position_y: number
  width: number
  height: number
  data: Json
  created_at: string
  updated_at: string
}

function rowToNode(row: NodeRow): CanvasNode {
  const d = (row.data ?? {}) as Record<string, unknown>
  return {
    id: row.id,
    type: row.type as CanvasNode['type'],
    x: row.position_x,
    y: row.position_y,
    width: row.width,
    height: row.height,
    text: (d.text as string) ?? '',
    style: d.style as CanvasNode['style'],
    zIndex: (d.zIndex as number) ?? 0,
    imageUrl: (d.imageUrl as string) ?? undefined,
  }
}

export async function getProjectNodes(projectId: string): Promise<CanvasNode[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('nodes')
    .select('*')
    .eq('project_id', projectId)
  if (error || !data) return []
  return (data as NodeRow[]).map(rowToNode)
}

export function nodeToRow(n: CanvasNode, projectId: string) {
  return {
    id: n.id,
    project_id: projectId,
    type: n.type as string,
    position_x: n.x,
    position_y: n.y,
    width: n.width,
    height: n.height,
    data: { text: n.text, style: n.style as unknown, zIndex: n.zIndex, imageUrl: n.imageUrl ?? null } as unknown as Json,
  }
}

export async function upsertNodes(nodes: CanvasNode[], projectId: string): Promise<boolean> {
  if (nodes.length === 0) return true
  const sb = await createClient()
  const { error } = await sb
    .from('nodes')
    .upsert(nodes.map((n) => nodeToRow(n, projectId)), { onConflict: 'id' })
  return !error
}

export async function deleteOrphanNodes(projectId: string, keepIds: string[]): Promise<boolean> {
  const sb = await createClient()
  if (keepIds.length === 0) {
    const { error } = await sb.from('nodes').delete().eq('project_id', projectId)
    return !error
  }
  const { error } = await sb
    .from('nodes')
    .delete()
    .eq('project_id', projectId)
    .not('id', 'in', `(${keepIds.join(',')})`)
  return !error
}
