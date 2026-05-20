'use client'

import { useCanvasStore } from '@/store/useCanvasStore'
import { DraggableShape } from './DraggableShape'

export function CanvasNodes() {
  const nodes = useCanvasStore((s) => s.nodes)

  return (
    <>
      {nodes.map((node) => (
        <DraggableShape key={node.id} node={node} />
      ))}
    </>
  )
}
