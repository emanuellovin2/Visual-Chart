'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { CanvasContainer } from '@/components/canvas/CanvasContainer'
import { CanvasBackground } from '@/components/canvas/CanvasBackground'
import { CanvasLayer } from '@/components/canvas/CanvasLayer'
import { ConnectionLayer } from '@/components/connections'
import { ShapeRenderer } from '@/components/shapes/ShapeRenderer'
import type { CanvasNode, CanvasEdge } from '@/types'

function ViewNodes() {
  const nodes = useCanvasStore((s) => s.nodes)
  return (
    <>
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute"
          style={{
            left: node.x,
            top: node.y,
            width: node.width,
            height: node.height,
            zIndex: node.zIndex,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <ShapeRenderer node={node} />
        </div>
      ))}
    </>
  )
}

interface ShareLayoutProps {
  projectTitle: string
  initialNodes: CanvasNode[]
  initialEdges: CanvasEdge[]
}

export function ShareLayout({ projectTitle, initialNodes, initialEdges }: ShareLayoutProps) {
  useEffect(() => {
    const s = useCanvasStore.getState()
    s.setNodes(initialNodes)
    s.setEdges(initialEdges)
    useCanvasStore.temporal.getState().clear()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Minimal header */}
      <header className="bg-card border-border flex h-12 items-center gap-3 border-b px-4 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">G</span>
          Graphify
        </Link>
        <div className="bg-border h-5 w-px" />
        <span className="text-sm font-medium truncate max-w-[240px]">{projectTitle}</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          View only
        </div>
      </header>

      {/* Canvas — pan/zoom only, no editing */}
      <main className="relative flex-1 overflow-hidden">
        <CanvasContainer>
          <ConnectionLayer />
          <ViewNodes />
        </CanvasContainer>
      </main>
    </div>
  )
}
