'use client'

import { useShallow } from 'zustand/react/shallow'
import { useCollaborationStore } from '@/store/useCollaborationStore'
import { useCanvasStore } from '@/store/useCanvasStore'

export function CollaboratorCursors() {
  const collaborators = useCollaborationStore(
    useShallow((s) => Object.values(s.collaborators))
  )
  const zoom = useCanvasStore((s) => s.zoom)
  const panX = useCanvasStore((s) => s.panX)
  const panY = useCanvasStore((s) => s.panY)

  if (collaborators.length === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-50 overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      {collaborators.map((c) => {
        const sx = c.cursorX * zoom + panX
        const sy = c.cursorY * zoom + panY
        return (
          <g key={c.userId} transform={`translate(${sx}, ${sy})`}>
            {/* Cursor arrow */}
            <path
              d="M 0 0 L 0 16 L 4 12 L 8 20 L 10 19 L 6 11 L 12 11 Z"
              fill={c.color}
              stroke="white"
              strokeWidth={1}
            />
            {/* Name label */}
            <g transform="translate(14, 16)">
              <rect
                x={0}
                y={0}
                width={c.userName.length * 7 + 10}
                height={20}
                rx={4}
                fill={c.color}
              />
              <text
                x={5}
                y={14}
                fontSize={11}
                fontFamily="sans-serif"
                fontWeight="500"
                fill="white"
              >
                {c.userName}
              </text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}
