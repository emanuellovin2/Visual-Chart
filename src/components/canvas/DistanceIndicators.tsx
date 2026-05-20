'use client'

import { useMemo } from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'

interface Gap {
  dir: 'left' | 'right' | 'up' | 'down'
  x1: number
  y1: number
  x2: number
  y2: number
  dist: number
}

export function DistanceIndicators() {
  const nodes = useCanvasStore((s) => s.nodes)
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const zoom = useCanvasStore((s) => s.zoom)
  const panX = useCanvasStore((s) => s.panX)
  const panY = useCanvasStore((s) => s.panY)

  const gaps = useMemo<Gap[]>(() => {
    if (selectedIds.length !== 1) return []
    const sel = nodes.find((n) => n.id === selectedIds[0])
    if (!sel) return []

    const others = nodes.filter((n) => n.id !== sel.id)
    const result: Gap[] = []

    // sel bounds
    const sl = sel.x
    const sr = sel.x + sel.width
    const st = sel.y
    const sb = sel.y + sel.height
    const scx = (sl + sr) / 2
    const scy = (st + sb) / 2

    // For each direction find the nearest shape whose projection overlaps sel
    const candidates = {
      left: [] as { dist: number; ox: number; oy1: number; oy2: number }[],
      right: [] as { dist: number; ox: number; oy1: number; oy2: number }[],
      up: [] as { dist: number; oy: number; ox1: number; ox2: number }[],
      down: [] as { dist: number; oy: number; ox1: number; ox2: number }[],
    }

    for (const n of others) {
      const nl = n.x
      const nr = n.x + n.width
      const nt = n.y
      const nb = n.y + n.height

      // left: other is to the left, vertical overlap
      if (nr <= sl && Math.max(nt, st) < Math.min(nb, sb)) {
        candidates.left.push({ dist: sl - nr, ox: nr, oy1: Math.max(nt, st), oy2: Math.min(nb, sb) })
      }
      // right: other is to the right, vertical overlap
      if (nl >= sr && Math.max(nt, st) < Math.min(nb, sb)) {
        candidates.right.push({ dist: nl - sr, ox: nl, oy1: Math.max(nt, st), oy2: Math.min(nb, sb) })
      }
      // up: other is above, horizontal overlap
      if (nb <= st && Math.max(nl, sl) < Math.min(nr, sr)) {
        candidates.up.push({ dist: st - nb, oy: nb, ox1: Math.max(nl, sl), ox2: Math.min(nr, sr) })
      }
      // down: other is below, horizontal overlap
      if (nt >= sb && Math.max(nl, sl) < Math.min(nr, sr)) {
        candidates.down.push({ dist: nt - sb, oy: nt, ox1: Math.max(nl, sl), ox2: Math.min(nr, sr) })
      }
    }

    // left
    if (candidates.left.length) {
      const best = candidates.left.reduce((a, b) => (a.dist < b.dist ? a : b))
      const gy = (best.oy1 + best.oy2) / 2
      result.push({ dir: 'left', x1: best.ox, y1: gy, x2: sl, y2: gy, dist: best.dist })
    }
    // right
    if (candidates.right.length) {
      const best = candidates.right.reduce((a, b) => (a.dist < b.dist ? a : b))
      const gy = (best.oy1 + best.oy2) / 2
      result.push({ dir: 'right', x1: sr, y1: gy, x2: best.ox, y2: gy, dist: best.dist })
    }
    // up
    if (candidates.up.length) {
      const best = candidates.up.reduce((a, b) => (a.dist < b.dist ? a : b))
      const gx = (best.ox1 + best.ox2) / 2
      result.push({ dir: 'up', x1: gx, y1: best.oy, x2: gx, y2: st, dist: best.dist })
    }
    // down
    if (candidates.down.length) {
      const best = candidates.down.reduce((a, b) => (a.dist < b.dist ? a : b))
      const gx = (best.ox1 + best.ox2) / 2
      result.push({ dir: 'down', x1: gx, y1: sb, x2: gx, y2: best.oy, dist: best.dist })
    }

    return result
  }, [nodes, selectedIds])

  if (gaps.length === 0) return null

  // Convert canvas coords to screen coords
  const toScreen = (x: number, y: number) => ({
    x: x * zoom + panX,
    y: y * zoom + panY,
  })

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <marker id="di-tick" markerWidth="4" markerHeight="8" refX="2" refY="4" orient="auto">
          <line x1="2" y1="0" x2="2" y2="8" stroke="#f59e0b" strokeWidth="1.5" />
        </marker>
      </defs>
      {gaps.map((g, i) => {
        const p1 = toScreen(g.x1, g.y1)
        const p2 = toScreen(g.x2, g.y2)
        const mx = (p1.x + p2.x) / 2
        const my = (p1.y + p2.y) / 2
        const label = Math.round(g.dist)

        return (
          <g key={i}>
            {/* dashed gap line */}
            <line
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              markerStart="url(#di-tick)"
              markerEnd="url(#di-tick)"
            />
            {/* label background */}
            <rect
              x={mx - 18} y={my - 10}
              width={36} height={20}
              rx={4}
              fill="#1c1917"
              opacity={0.85}
            />
            {/* label text */}
            <text
              x={mx} y={my + 4}
              textAnchor="middle"
              fontSize={11}
              fontFamily="Inter, sans-serif"
              fill="#fbbf24"
              fontWeight="600"
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
