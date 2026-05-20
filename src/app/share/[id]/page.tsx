import { notFound } from 'next/navigation'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { ShareLayout } from './ShareLayout'
import type { CanvasNode, CanvasEdge } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const sb = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await sb.from('projects').select('title').eq('id', id).maybeSingle()
  const title = (data as { title: string } | null)?.title
  return { title: title ? `${title} — Graphify` : 'Shared diagram — Graphify' }
}

export default async function SharePage({ params }: Props) {
  const { id } = await params

  const sb = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: project } = await sb
    .from('projects')
    .select('id, title, is_public')
    .eq('id', id)
    .maybeSingle()

  const p = project as { id: string; title: string; is_public: boolean } | null

  if (!p || !p.is_public) notFound()

  const [{ data: rawNodes }, { data: rawEdges }] = await Promise.all([
    sb.from('nodes').select('*').eq('project_id', p.id),
    sb.from('edges').select('*').eq('project_id', p.id),
  ])

  const nodes: CanvasNode[] = (rawNodes ?? []).map((row) => {
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
  })

  const edges: CanvasEdge[] = (rawEdges ?? []).map((row) => {
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
  })

  return <ShareLayout projectTitle={p.title} initialNodes={nodes} initialEdges={edges} />
}
