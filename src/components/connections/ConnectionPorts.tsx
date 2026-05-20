'use client'

import { useEditorStore } from '@/store/useEditorStore'
import { useCanvasStore } from '@/store/useCanvasStore'
import { getPortPosition, getClosestPort } from '@/lib/connections'
import { screenToCanvas } from '@/lib/canvas'
import type { CanvasNode, PortSide } from '@/types'

const PORTS: PortSide[] = ['n', 's', 'e', 'w']
const PORT_R = 6

interface ConnectionPortsProps {
  node: CanvasNode
}

export function ConnectionPorts({ node }: ConnectionPortsProps) {
  const zoom = useCanvasStore((s) => s.zoom)
  const startDraftEdge = useEditorStore((s) => s.startDraftEdge)
  const clearDraftEdge = useEditorStore((s) => s.clearDraftEdge)
  const updateDraftCursor = useEditorStore((s) => s.updateDraftCursor)
  const draftEdge = useEditorStore((s) => s.draftEdge)
  const hoveredNodeId = useEditorStore((s) => s.hoveredNodeId)
  const setHoveredNodeId = useEditorStore((s) => s.setHoveredNodeId)
  const addEdge = useCanvasStore((s) => s.addEdge)
  const nodes = useCanvasStore((s) => s.nodes)
  const activeConnectionType = useEditorStore((s) => s.activeConnectionType)

  // Highlight this node's ports as drop target when dragging
  const isDropTarget = draftEdge !== null && hoveredNodeId === node.id && draftEdge.sourceId !== node.id

  const handlePortPointerDown = (e: React.PointerEvent, port: PortSide) => {
    e.stopPropagation()
    e.preventDefault()

    const containerEl = document.getElementById('canvas-container')
    const rect = containerEl?.getBoundingClientRect()
    if (!rect) return

    const s = useCanvasStore.getState()
    const pos = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, s.panX, s.panY, s.zoom)

    startDraftEdge(node.id, port, pos.x, pos.y)

    const onMove = (me: PointerEvent) => {
      const ms = useCanvasStore.getState()
      const mp = screenToCanvas(me.clientX - rect.left, me.clientY - rect.top, ms.panX, ms.panY, ms.zoom)
      updateDraftCursor(mp.x, mp.y)

      // Update hoveredNodeId based on which node is under cursor
      const targetNode = ms.nodes.find((n) => {
        if (n.id === node.id) return false
        return me.clientX - rect.left >= n.x * ms.zoom + ms.panX - 20 &&
          me.clientX - rect.left <= (n.x + n.width) * ms.zoom + ms.panX + 20 &&
          me.clientY - rect.top >= n.y * ms.zoom + ms.panY - 20 &&
          me.clientY - rect.top <= (n.y + n.height) * ms.zoom + ms.panY + 20
      })
      setHoveredNodeId(targetNode?.id ?? null)
    }

    const onUp = (ue: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      const es = useEditorStore.getState()
      const cs = useCanvasStore.getState()
      const targetId = es.hoveredNodeId

      if (targetId && targetId !== node.id) {
        const targetNode = cs.nodes.find((n) => n.id === targetId)
        if (targetNode) {
          const { panX, panY, zoom: z } = cs
          const cp = screenToCanvas(ue.clientX - rect.left, ue.clientY - rect.top, panX, panY, z)
          const tp = getClosestPort(targetNode, cp.x, cp.y)
          addEdge({
            id: crypto.randomUUID(),
            sourceId: node.id,
            targetId,
            sourcePort: port,
            targetPort: tp,
            type: es.activeConnectionType,
            label: '',
            style: { stroke: '#6366f1', strokeWidth: 2 },
          })
        }
      }

      setHoveredNodeId(null)
      clearDraftEdge()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const r = PORT_R / zoom

  return (
    <svg
      className="pointer-events-none absolute overflow-visible"
      style={{ left: 0, top: 0, width: node.width, height: node.height, zIndex: 100 }}
    >
      {PORTS.map((port) => {
        const pos = getPortPosition(node, port)
        const cx = pos.x - node.x
        const cy = pos.y - node.y
        return (
          <circle
            key={port}
            cx={cx}
            cy={cy}
            r={r}
            fill={isDropTarget ? '#6366f1' : 'white'}
            stroke={isDropTarget ? '#4338ca' : '#6366f1'}
            strokeWidth={1.5 / zoom}
            style={{ pointerEvents: 'all', cursor: 'crosshair' }}
            onPointerDown={(e) => handlePortPointerDown(e, port)}
          />
        )
      })}
    </svg>
  )
}
