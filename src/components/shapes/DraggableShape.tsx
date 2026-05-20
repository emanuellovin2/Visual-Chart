'use client'

import { memo, useCallback, useRef, useState, startTransition } from 'react'
import { uploadNodeImage } from '@/app/editor/[id]/actions'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useEditorStore } from '@/store/useEditorStore'
import { snapToGrid } from '@/lib/canvas'
import { ShapeRenderer } from './ShapeRenderer'
import { ResizeHandles } from './ResizeHandles'
import { InlineTextEditor } from './InlineTextEditor'
import { ConnectionPorts } from '@/components/connections/ConnectionPorts'
import type { CanvasNode } from '@/types'

interface DraggableShapeProps {
  node: CanvasNode
}

function DraggableShapeInner({ node }: DraggableShapeProps) {
  // Atomic boolean selectors — only this shape re-renders when its state changes
  const isSelected = useCanvasStore((s) => s.selectedIds.includes(node.id))
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds)
  const updateNode = useCanvasStore((s) => s.updateNode)

  const activeTool = useEditorStore((s) => s.activeTool)
  const isHovered = useEditorStore((s) => s.hoveredNodeId === node.id)
  const setHoveredNodeId = useEditorStore((s) => s.setHoveredNodeId)
  const hasDraftEdge = useEditorStore((s) => s.draftEdge !== null)
  const setSelectedEdgeId = useEditorStore((s) => s.setSelectedEdgeId)
  const isEditing = useEditorStore((s) => s.editingNodeId === node.id)
  const setEditingNodeId = useEditorStore((s) => s.setEditingNodeId)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const isArrowMode = activeTool === 'arrow'
  const showPorts = isArrowMode && (isHovered || hasDraftEdge)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setIsUploading(true)
      try {
        const fd = new FormData()
        fd.set('file', file)
        fd.set('nodeId', node.id)
        startTransition(async () => {
          const url = await uploadNodeImage(fd)
          updateNode(node.id, { imageUrl: url })
          setIsUploading(false)
        })
      } catch {
        setIsUploading(false)
      }
      e.target.value = ''
    },
    [node.id, updateNode]
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isArrowMode) return
      e.stopPropagation()
      if (node.type === 'image-block') {
        fileInputRef.current?.click()
      } else {
        setEditingNodeId(node.id)
      }
    },
    [isArrowMode, node.type, node.id, setEditingNodeId]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      if (isEditing) return
      if (isArrowMode) {
        e.stopPropagation()
        return
      }
      e.stopPropagation()

      if (e.shiftKey) {
        const s = useCanvasStore.getState()
        if (s.selectedIds.includes(node.id)) {
          s.setSelectedIds(s.selectedIds.filter((id) => id !== node.id))
        } else {
          s.setSelectedIds([...s.selectedIds, node.id])
        }
        setSelectedEdgeId(null)
        return
      }

      if (!isSelected) {
        setSelectedIds([node.id])
      }
      setSelectedEdgeId(null)

      const startX = e.clientX
      const startY = e.clientY
      let moved = false

      const s = useCanvasStore.getState()
      const dragIds = s.selectedIds.includes(node.id) ? s.selectedIds : [node.id]
      const origPositions = dragIds.map((id) => {
        const n = s.nodes.find((n) => n.id === id)
        return { id, x: n?.x ?? 0, y: n?.y ?? 0 }
      })

      let rafId = 0
      let lastMe: PointerEvent | null = null

      const flush = () => {
        rafId = 0
        if (!lastMe) return
        const me = lastMe
        lastMe = null
        const zoom = useCanvasStore.getState().zoom
        const dx = (me.clientX - startX) / zoom
        const dy = (me.clientY - startY) / zoom
        if (!moved && Math.hypot(dx, dy) < 2) return
        moved = true
        origPositions.forEach(({ id, x, y }) => {
          updateNode(id, { x: snapToGrid(x + dx), y: snapToGrid(y + dy) })
        })
      }

      const onMove = (me: PointerEvent) => {
        lastMe = me
        if (!rafId) rafId = requestAnimationFrame(flush)
      }

      const onUp = () => {
        if (rafId) { cancelAnimationFrame(rafId); flush() }
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [node, isArrowMode, isEditing, isSelected, setSelectedIds, setSelectedEdgeId, updateNode]
  )

  const handlePointerEnter = useCallback(() => {
    if (isArrowMode || hasDraftEdge) {
      setHoveredNodeId(node.id)
    }
  }, [isArrowMode, hasDraftEdge, node.id, setHoveredNodeId])

  const handlePointerLeave = useCallback(() => {
    setHoveredNodeId(null)
  }, [setHoveredNodeId])

  return (
    <div
      className="absolute"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex,
        cursor: isArrowMode ? 'crosshair' : 'move',
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <ShapeRenderer node={node} isEditing={isEditing} />
      {isEditing && <InlineTextEditor node={node} />}
      {isUploading && (
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)', borderRadius: 4, color: '#fff', fontSize: 12,
          }}
        >
          Uploading…
        </div>
      )}
      {node.type === 'image-block' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}
      {isSelected && !isArrowMode && !isEditing && <ResizeHandles node={node} />}
      {showPorts && <ConnectionPorts node={node} />}
    </div>
  )
}

export const DraggableShape = memo(DraggableShapeInner)
