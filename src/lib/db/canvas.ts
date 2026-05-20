import { createClient } from '@/lib/supabase/server'
import type { CanvasNode, CanvasEdge } from '@/types'
import { getProjectNodes, nodeToRow } from './nodes'
import { getProjectEdges, edgeToRow } from './edges'

export async function loadCanvas(
  projectId: string
): Promise<{ nodes: CanvasNode[]; edges: CanvasEdge[] }> {
  const [nodes, edges] = await Promise.all([
    getProjectNodes(projectId),
    getProjectEdges(projectId),
  ])
  return { nodes, edges }
}

export async function saveCanvas(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): Promise<void> {
  const sb = await createClient()

  const nodeRows = nodes.map((n) => nodeToRow(n, projectId))
  const edgeRows = edges.map((e) => edgeToRow(e, projectId))
  const nodeIds = nodes.map((n) => n.id)
  const edgeIds = edges.map((e) => e.id)

  await Promise.all([
    nodeRows.length > 0
      ? sb.from('nodes').upsert(nodeRows, { onConflict: 'id' })
      : Promise.resolve(),
    edgeRows.length > 0
      ? sb.from('edges').upsert(edgeRows, { onConflict: 'id' })
      : Promise.resolve(),
  ])

  await Promise.all([
    nodeIds.length > 0
      ? sb.from('nodes').delete().eq('project_id', projectId).not('id', 'in', `(${nodeIds.join(',')})`)
      : sb.from('nodes').delete().eq('project_id', projectId),
    edgeIds.length > 0
      ? sb.from('edges').delete().eq('project_id', projectId).not('id', 'in', `(${edgeIds.join(',')})`)
      : sb.from('edges').delete().eq('project_id', projectId),
  ])

  await sb.from('projects').update({ updated_at: new Date().toISOString() }).eq('id', projectId)
}

export async function takeSnapshot(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  label?: string
): Promise<boolean> {
  const sb = await createClient()
  const { error } = await sb.from('canvas_snapshots').insert({
    project_id: projectId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snapshot: { nodes, edges } as any,
    label: label ?? null,
  })
  return !error
}

export async function listSnapshots(
  projectId: string
): Promise<Array<{ id: string; label: string | null; created_at: string }>> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('canvas_snapshots')
    .select('id, label, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error || !data) return []
  return data as Array<{ id: string; label: string | null; created_at: string }>
}

export async function restoreSnapshot(
  projectId: string,
  snapshotId: string
): Promise<{ nodes: CanvasNode[]; edges: CanvasEdge[] } | null> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('canvas_snapshots')
    .select('snapshot')
    .eq('id', snapshotId)
    .eq('project_id', projectId)
    .single()
  if (error || !data) return null
  const snap = data.snapshot as unknown as { nodes: CanvasNode[]; edges: CanvasEdge[] }
  return snap
}
