'use client'

import { useCallback, useEffect, useRef, useState, startTransition } from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useEditorStore } from '@/store/useEditorStore'
import { screenToCanvas, snapToGrid } from '@/lib/canvas'
import { CanvasBackground } from './CanvasBackground'
import { CanvasControls } from './CanvasControls'
import { CanvasLayer } from './CanvasLayer'
import { uploadNodeImage } from '@/app/editor/[id]/actions'
import { useCollaborationStore } from '@/store/useCollaborationStore'
import type { CanvasNode, ShapeStyle, ShapeType } from '@/types'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

const DEFAULT_STYLE: ShapeStyle = {
  fill: '#3b82f6',
  stroke: '#1e40af',
  strokeWidth: 1.5,
  opacity: 1,
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  fontWeight: '400',
  textAlign: 'center',
  shadow: false,
}

const SHAPE_DEFAULTS: Partial<Record<ShapeType, Partial<ShapeStyle>>> = {
  'sticky-note': { fill: '#fef08a', stroke: '#ca8a04', strokeWidth: 1 },
  'text-block': { fill: 'transparent', stroke: '#6366f1', strokeWidth: 0 },
  'image-block': { fill: '#e2e8f0', stroke: '#94a3b8', strokeWidth: 1 },
  circle: { fill: '#8b5cf6', stroke: '#6d28d9' },
  diamond: { fill: '#10b981', stroke: '#065f46' },
  triangle: { fill: '#f59e0b', stroke: '#b45309' },
}

const DEFAULT_SIZE: Record<ShapeType, { w: number; h: number }> = {
  rectangle: { w: 160, h: 100 },
  'rounded-rectangle': { w: 160, h: 100 },
  circle: { w: 120, h: 120 },
  diamond: { w: 140, h: 100 },
  triangle: { w: 140, h: 100 },
  'sticky-note': { w: 160, h: 160 },
  'text-block': { w: 200, h: 60 },
  'image-block': { w: 200, h: 150 },
}

const SHAPE_TYPES = new Set<ShapeType>([
  'rectangle', 'rounded-rectangle', 'circle', 'diamond',
  'triangle', 'sticky-note', 'text-block', 'image-block',
])

interface CanvasContainerProps {
  children?: React.ReactNode
}

type Marquee = { sx: number; sy: number; ex: number; ey: number }

export function CanvasContainer({ children }: CanvasContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [spaceDown, setSpaceDown] = useState(false)
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const [marquee, setMarquee] = useState<Marquee | null>(null)
  const marqueeStart = useRef<{ x: number; y: number } | null>(null)
  const cursorThrottleRef = useRef<number>(0)
  const canvasCursorRef = useRef<{ x: number; y: number } | null>(null)

  const setZoom = useCanvasStore((s) => s.setZoom)
  const setPan = useCanvasStore((s) => s.setPan)
  const clearSelection = useCanvasStore((s) => s.clearSelection)
  const addNodeAndSelect = useCanvasStore((s) => s.addNodeAndSelect)

  const activeTool = useEditorStore((s) => s.activeTool)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  const setSelectedEdgeId = useEditorStore((s) => s.setSelectedEdgeId)
  const clipboard = useEditorStore((s) => s.clipboard)
  const setClipboard = useEditorStore((s) => s.setClipboard)

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const s = useCanvasStore.getState()

      if (e.ctrlKey || e.metaKey) {
        const sensitivity = Math.abs(e.deltaY) > 10 ? 0.001 : 0.005
        const delta = -e.deltaY * sensitivity
        const newZoom = Math.min(Math.max(s.zoom * (1 + delta * s.zoom), MIN_ZOOM), MAX_ZOOM)
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const canvasX = (mouseX - s.panX) / s.zoom
        const canvasY = (mouseY - s.panY) / s.zoom
        s.setZoom(newZoom)
        s.setPan(mouseX - canvasX * newZoom, mouseY - canvasY * newZoom)
      } else {
        s.setPan(s.panX - e.deltaX, s.panY - e.deltaY)
      }
    },
    [setZoom, setPan]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    const inTextField = (target: EventTarget | null) => {
      if (!target) return false
      const el = target as HTMLElement
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        setSpaceDown(true)
      }

      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === '=') {
        e.preventDefault()
        const s = useCanvasStore.getState()
        s.setZoom(Math.min(s.zoom * 1.2, MAX_ZOOM))
      }
      if (mod && e.key === '-') {
        e.preventDefault()
        const s = useCanvasStore.getState()
        s.setZoom(Math.max(s.zoom / 1.2, MIN_ZOOM))
      }
      if (mod && e.key === '0') {
        e.preventDefault()
        useCanvasStore.getState().resetView()
      }
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useCanvasStore.temporal.getState().undo()
      }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        useCanvasStore.temporal.getState().redo()
      }

      // Select all
      if (mod && e.key === 'a' && !inTextField(e.target)) {
        e.preventDefault()
        const s = useCanvasStore.getState()
        s.setSelectedIds(s.nodes.map((n) => n.id))
      }

      // Copy
      if (mod && e.key === 'c' && !inTextField(e.target)) {
        const s = useCanvasStore.getState()
        if (s.selectedIds.length > 0) {
          setClipboard(s.nodes.filter((n) => s.selectedIds.includes(n.id)))
        }
      }

      // Paste
      if (mod && e.key === 'v' && !inTextField(e.target)) {
        const editorClipboard = useEditorStore.getState().clipboard
        if (editorClipboard.length > 0) {
          e.preventDefault()
          useCanvasStore.getState().pasteNodes(editorClipboard, canvasCursorRef.current ?? undefined)
        }
      }

      // Duplicate
      if (mod && e.key === 'd' && !inTextField(e.target)) {
        e.preventDefault()
        const s = useCanvasStore.getState()
        if (s.selectedIds.length > 0) s.duplicateNodes(s.selectedIds)
      }

      // Layer ordering
      if (mod && e.key === ']' && !e.shiftKey) {
        e.preventDefault()
        const s = useCanvasStore.getState()
        if (s.selectedIds.length > 0) s.bringForward(s.selectedIds)
      }
      if (mod && e.key === '[' && !e.shiftKey) {
        e.preventDefault()
        const s = useCanvasStore.getState()
        if (s.selectedIds.length > 0) s.sendBackward(s.selectedIds)
      }
      if (mod && e.key === ']' && e.shiftKey) {
        e.preventDefault()
        const s = useCanvasStore.getState()
        if (s.selectedIds.length > 0) s.bringToFront(s.selectedIds)
      }
      if (mod && e.key === '[' && e.shiftKey) {
        e.preventDefault()
        const s = useCanvasStore.getState()
        if (s.selectedIds.length > 0) s.sendToBack(s.selectedIds)
      }

      if (e.key === 'Escape') {
        setActiveTool('select')
        clearSelection()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!inTextField(e.target)) {
          const s = useCanvasStore.getState()
          if (s.selectedIds.length > 0) s.removeNodes(s.selectedIds)
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [clearSelection, setActiveTool, setClipboard])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const isMiddleMouse = e.button === 1
      const isPanMode = spaceDown || isMiddleMouse

      if (isPanMode) {
        e.preventDefault()
        setIsPanning(true)
        const s = useCanvasStore.getState()
        panStart.current = { x: e.clientX, y: e.clientY, panX: s.panX, panY: s.panY }
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        return
      }

      // Shape placement
      if (e.button === 0 && SHAPE_TYPES.has(activeTool as ShapeType)) {
        const rect = containerRef.current!.getBoundingClientRect()
        const s = useCanvasStore.getState()
        const pos = screenToCanvas(
          e.clientX - rect.left,
          e.clientY - rect.top,
          s.panX,
          s.panY,
          s.zoom
        )
        const type = activeTool as ShapeType
        const size = DEFAULT_SIZE[type]
        const style: ShapeStyle = {
          ...DEFAULT_STYLE,
          ...(SHAPE_DEFAULTS[type] ?? {}),
        }
        const node: CanvasNode = {
          id: crypto.randomUUID(),
          type,
          x: snapToGrid(pos.x - size.w / 2),
          y: snapToGrid(pos.y - size.h / 2),
          width: size.w,
          height: size.h,
          text: type !== 'image-block' && type !== 'text-block' ? '' : '',
          style,
          zIndex: useCanvasStore.getState().nodes.length + 1,
        }
        addNodeAndSelect(node)
        setActiveTool('select')
        return
      }

      // Background click/drag → start marquee or deselect
      if (e.button === 0) {
        const rect = containerRef.current!.getBoundingClientRect()
        marqueeStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        clearSelection()
        setSelectedEdgeId(null)
      }
    },
    [spaceDown, activeTool, addNodeAndSelect, setActiveTool, clearSelection, setSelectedEdgeId]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isPanning && panStart.current) {
        const dx = e.clientX - panStart.current.x
        const dy = e.clientY - panStart.current.y
        setPan(panStart.current.panX + dx, panStart.current.panY + dy)
        return
      }
      if (marqueeStart.current) {
        const rect = containerRef.current!.getBoundingClientRect()
        const ex = e.clientX - rect.left
        const ey = e.clientY - rect.top
        const { x: sx, y: sy } = marqueeStart.current
        if (Math.hypot(ex - sx, ey - sy) > 4) {
          setMarquee({ sx, sy, ex, ey })
        }
      }
      // Track canvas cursor position + broadcast at ~20fps
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const s = useCanvasStore.getState()
        const pos = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, s.panX, s.panY, s.zoom)
        canvasCursorRef.current = pos
        const now = Date.now()
        if (now - cursorThrottleRef.current > 50) {
          cursorThrottleRef.current = now
          useCollaborationStore.getState()._broadcastCursor?.(pos.x, pos.y)
        }
      }
    },
    [isPanning, setPan]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsPanning(false)
      panStart.current = null

      if (marquee && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const s = useCanvasStore.getState()
        const c1 = screenToCanvas(Math.min(marquee.sx, marquee.ex), Math.min(marquee.sy, marquee.ey), s.panX, s.panY, s.zoom)
        const c2 = screenToCanvas(Math.max(marquee.sx, marquee.ex), Math.max(marquee.sy, marquee.ey), s.panX, s.panY, s.zoom)
        const hit = s.nodes.filter(
          (n) => n.x < c2.x && n.x + n.width > c1.x && n.y < c2.y && n.y + n.height > c1.y
        )
        if (hit.length > 0) s.setSelectedIds(hit.map((n) => n.id))
        void rect
      }
      setMarquee(null)
      marqueeStart.current = null
    },
    [marquee]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
      if (!file) return

      const rect = containerRef.current!.getBoundingClientRect()
      const s = useCanvasStore.getState()
      const pos = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, s.panX, s.panY, s.zoom)
      const size = DEFAULT_SIZE['image-block']
      const style: ShapeStyle = { ...DEFAULT_STYLE, ...(SHAPE_DEFAULTS['image-block'] ?? {}) }
      const node: CanvasNode = {
        id: crypto.randomUUID(),
        type: 'image-block',
        x: snapToGrid(pos.x - size.w / 2),
        y: snapToGrid(pos.y - size.h / 2),
        width: size.w,
        height: size.h,
        text: '',
        style,
        zIndex: useCanvasStore.getState().nodes.length + 1,
      }
      addNodeAndSelect(node)

      startTransition(async () => {
        const fd = new FormData()
        fd.set('file', file)
        fd.set('nodeId', node.id)
        const url = await uploadNodeImage(fd)
        useCanvasStore.getState().updateNode(node.id, { imageUrl: url })
      })
    },
    [addNodeAndSelect]
  )

  const isShapeTool = SHAPE_TYPES.has(activeTool as ShapeType)

  let cursor = 'default'
  if (isShapeTool) cursor = 'crosshair'
  else if (spaceDown) cursor = isPanning ? 'grabbing' : 'grab'
  else if (isPanning) cursor = 'grabbing'

  return (
    <div
      id="canvas-container"
      ref={containerRef}
      className="bg-background relative h-full w-full overflow-hidden select-none"
      style={{ cursor, touchAction: 'none', overscrollBehavior: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={(e) => { handlePointerUp(e); setMarquee(null); marqueeStart.current = null }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CanvasBackground />
      <CanvasLayer>{children}</CanvasLayer>
      {marquee && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(marquee.sx, marquee.ex),
            top: Math.min(marquee.sy, marquee.ey),
            width: Math.abs(marquee.ex - marquee.sx),
            height: Math.abs(marquee.ey - marquee.sy),
            border: '1px solid #3b82f6',
            background: 'rgba(59,130,246,0.08)',
            pointerEvents: 'none',
          }}
        />
      )}
      <CanvasControls />
    </div>
  )
}
