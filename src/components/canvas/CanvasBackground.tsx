'use client'

import { useCanvasStore } from '@/store/useCanvasStore'

const GRID_SIZE = 20
const DOT_RADIUS = 0.8
const LARGE_DOT_RADIUS = 1.4
const LARGE_GRID = 100

export function CanvasBackground() {
  const zoom = useCanvasStore((s) => s.zoom)
  const panX = useCanvasStore((s) => s.panX)
  const panY = useCanvasStore((s) => s.panY)

  const scaledGrid = GRID_SIZE * zoom
  const scaledLarge = LARGE_GRID * zoom
  const offsetX = ((panX % scaledLarge) + scaledLarge) % scaledLarge
  const offsetY = ((panY % scaledLarge) + scaledLarge) % scaledLarge

  const smallR = Math.max(DOT_RADIUS * Math.min(zoom, 1.5), 0.4)
  const largeR = Math.max(LARGE_DOT_RADIUS * Math.min(zoom, 1.5), 0.6)

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <pattern
          id="small-grid"
          width={scaledGrid}
          height={scaledGrid}
          x={offsetX}
          y={offsetY}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={scaledGrid / 2}
            cy={scaledGrid / 2}
            r={smallR}
            fill="currentColor"
            className="text-border"
          />
        </pattern>
        <pattern
          id="large-grid"
          width={scaledLarge}
          height={scaledLarge}
          x={offsetX}
          y={offsetY}
          patternUnits="userSpaceOnUse"
        >
          <rect width={scaledLarge} height={scaledLarge} fill="url(#small-grid)" />
          <circle
            cx={scaledLarge / 2}
            cy={scaledLarge / 2}
            r={largeR}
            fill="currentColor"
            className="text-muted-foreground/50"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#large-grid)" />
    </svg>
  )
}
