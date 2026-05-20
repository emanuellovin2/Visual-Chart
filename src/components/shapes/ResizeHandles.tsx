'use client'

import { useCallback } from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { snapToGrid } from '@/lib/canvas'
import type { CanvasNode } from '@/types'

type Direction = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const HANDLE_SIZE = 8

const HANDLES: { dir: Direction; cx: number; cy: number }[] = [
  { dir: 'nw', cx: 0, cy: 0 },
  { dir: 'n', cx: 0.5, cy: 0 },
  { dir: 'ne', cx: 1, cy: 0 },
  { dir: 'e', cx: 1, cy: 0.5 },
  { dir: 'se', cx: 1, cy: 1 },
  { dir: 's', cx: 0.5, cy: 1 },
  { dir: 'sw', cx: 0, cy: 1 },
  { dir: 'w', cx: 0, cy: 0.5 },
]

const CURSORS: Record<Direction, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
}

interface ResizeHandlesProps {
  node: CanvasNode
}

export function ResizeHandles({ node }: ResizeHandlesProps) {
  const updateNode = useCanvasStore((s) => s.updateNode)
  const zoom = useCanvasStore((s) => s.zoom)

  const startResize = useCallback(
    (e: React.PointerEvent, dir: Direction) => {
      e.stopPropagation()
      e.preventDefault()

      const startX = e.clientX
      const startY = e.clientY
      const orig = { x: node.x, y: node.y, w: node.width, h: node.height }
      const MIN = 40

      const onMove = (me: PointerEvent) => {
        const dx = (me.clientX - startX) / zoom
        const dy = (me.clientY - startY) / zoom

        let { x, y, w, h } = orig

        if (dir.includes('e')) w = Math.max(MIN, snapToGrid(orig.w + dx))
        if (dir.includes('s')) h = Math.max(MIN, snapToGrid(orig.h + dy))
        if (dir.includes('w')) {
          const nw = Math.max(MIN, snapToGrid(orig.w - dx))
          x = orig.x + orig.w - nw
          w = nw
        }
        if (dir.includes('n')) {
          const nh = Math.max(MIN, snapToGrid(orig.h - dy))
          y = orig.y + orig.h - nh
          h = nh
        }

        updateNode(node.id, { x, y, width: w, height: h })
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [node, zoom, updateNode]
  )

  const hs = HANDLE_SIZE / zoom

  return (
    <>
      {/* selection border */}
      <div
        className="pointer-events-none absolute border border-blue-500"
        style={{ inset: -1 / zoom, borderWidth: 1.5 / zoom }}
      />

      {HANDLES.map(({ dir, cx, cy }) => (
        <div
          key={dir}
          className="absolute rounded-sm border border-blue-500 bg-white"
          style={{
            width: hs,
            height: hs,
            left: cx * node.width - hs / 2,
            top: cy * node.height - hs / 2,
            cursor: CURSORS[dir],
          }}
          onPointerDown={(e) => startResize(e, dir)}
        />
      ))}
    </>
  )
}
