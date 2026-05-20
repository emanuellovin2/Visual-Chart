'use client'

import { useCanvasStore } from '@/store/useCanvasStore'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'

const ZOOM_STEP = 0.15
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

export function CanvasControls() {
  const zoom = useCanvasStore((s) => s.zoom)
  const setZoom = useCanvasStore((s) => s.setZoom)
  const resetView = useCanvasStore((s) => s.resetView)

  const zoomIn = () => setZoom(Math.min(zoom * (1 + ZOOM_STEP), MAX_ZOOM))
  const zoomOut = () => setZoom(Math.max(zoom * (1 - ZOOM_STEP), MIN_ZOOM))
  const zoomTo100 = () => {
    setZoom(1)
    useCanvasStore.getState().setPan(0, 0)
  }

  return (
    <div className="bg-card border-border absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border px-1 py-1 shadow-md">
      <ControlButton onClick={zoomOut} title="Zoom out (-)">
        <ZoomOut className="h-3.5 w-3.5" />
      </ControlButton>

      <button
        onClick={zoomTo100}
        title="Reset zoom to 100%"
        className="text-muted-foreground hover:text-foreground hover:bg-accent min-w-[52px] rounded px-2 py-1 text-xs font-medium tabular-nums transition-colors"
      >
        {Math.round(zoom * 100)}%
      </button>

      <ControlButton onClick={zoomIn} title="Zoom in (+)">
        <ZoomIn className="h-3.5 w-3.5" />
      </ControlButton>

      <div className="bg-border mx-1 h-4 w-px" />

      <ControlButton onClick={resetView} title="Reset view">
        <RotateCcw className="h-3.5 w-3.5" />
      </ControlButton>
    </div>
  )
}

function ControlButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="text-muted-foreground hover:text-foreground hover:bg-accent rounded p-1.5 transition-colors"
    >
      {children}
    </button>
  )
}
