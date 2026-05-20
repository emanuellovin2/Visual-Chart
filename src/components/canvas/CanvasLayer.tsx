'use client'

import { useCanvasStore } from '@/store/useCanvasStore'

interface CanvasLayerProps {
  children?: React.ReactNode
}

export function CanvasLayer({ children }: CanvasLayerProps) {
  const zoom = useCanvasStore((s) => s.zoom)
  const panX = useCanvasStore((s) => s.panX)
  const panY = useCanvasStore((s) => s.panY)

  return (
    <div
      style={{
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: '0 0',
        willChange: 'transform',
      }}
      className="absolute inset-0"
    >
      {children}
    </div>
  )
}
