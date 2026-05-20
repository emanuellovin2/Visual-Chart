'use client'

import { memo, useCallback, useMemo } from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useEditorStore } from '@/store/useEditorStore'
import {
  getPortPosition,
  computePathD,
  getPathMidpoint,
} from '@/lib/connections'
import type { CanvasEdge, CanvasNode } from '@/types'

const MARKER_ID = 'arrowhead'
const MARKER_SIZE = 8

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      markerWidth={MARKER_SIZE}
      markerHeight={MARKER_SIZE}
      refX={MARKER_SIZE - 2}
      refY={MARKER_SIZE / 2}
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <path
        d={`M 0 0 L ${MARKER_SIZE} ${MARKER_SIZE / 2} L 0 ${MARKER_SIZE} Z`}
        fill={color}
      />
    </marker>
  )
}

interface EdgePathProps {
  edge: CanvasEdge
  sourceNode: CanvasNode
  targetNode: CanvasNode
  selected: boolean
  onClick: (id: string) => void
}

const EdgePath = memo(function EdgePath({ edge, sourceNode, targetNode, selected, onClick }: EdgePathProps) {
  const sp = edge.sourcePort
  const tp = edge.targetPort
  const p1 = getPortPosition(sourceNode, sp)
  const p2 = getPortPosition(targetNode, tp)
  const d = computePathD(edge.type, p1, sp, p2, tp)
  const mid = getPathMidpoint(edge.type, p1, sp, p2, tp)
  const markerId = `${MARKER_ID}-${edge.id}`
  const color = selected ? '#818cf8' : edge.style.stroke
  const strokeW = edge.style.strokeWidth

  return (
    <g>
      <ArrowMarker id={markerId} color={color} />
      {/* Hit area */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(strokeW + 10, 16)}
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        onClick={() => onClick(edge.id)}
      />
      {/* Visible path */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeDasharray={edge.style.dashed ? '6 4' : undefined}
        markerEnd={`url(#${markerId})`}
        style={{ pointerEvents: 'none' }}
      />
      {/* Label */}
      {edge.label && (
        <g transform={`translate(${mid.x},${mid.y})`}>
          <rect
            x={-edge.label.length * 3.5 - 4}
            y={-10}
            width={edge.label.length * 7 + 8}
            height={20}
            rx={4}
            fill="var(--color-card)"
            stroke={color}
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fill="currentColor"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {edge.label}
          </text>
        </g>
      )}
      {selected && (
        <>
          <circle cx={p1.x} cy={p1.y} r={5} fill={color} style={{ pointerEvents: 'none' }} />
          <circle cx={p2.x} cy={p2.y} r={5} fill={color} style={{ pointerEvents: 'none' }} />
        </>
      )}
    </g>
  )
})

export function ConnectionLayer() {
  const edges = useCanvasStore((s) => s.edges)
  const nodes = useCanvasStore((s) => s.nodes)
  const draftEdge = useEditorStore((s) => s.draftEdge)
  const selectedEdgeId = useEditorStore((s) => s.selectedEdgeId)
  const setSelectedEdgeId = useEditorStore((s) => s.setSelectedEdgeId)
  const activeConnectionType = useEditorStore((s) => s.activeConnectionType)

  // O(1) node lookup instead of O(n) find per edge
  const nodeMap = useMemo(() => {
    const m = new Map<string, CanvasNode>()
    for (const n of nodes) m.set(n.id, n)
    return m
  }, [nodes])

  const handleEdgeClick = useCallback((id: string) => {
    setSelectedEdgeId(id === selectedEdgeId ? null : id)
  }, [setSelectedEdgeId, selectedEdgeId])

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1,
        height: 1,
        overflow: 'visible',
        zIndex: 0,
      }}
    >
      <defs>
        <marker
          id="arrowhead-draft"
          markerWidth={MARKER_SIZE}
          markerHeight={MARKER_SIZE}
          refX={MARKER_SIZE - 2}
          refY={MARKER_SIZE / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d={`M 0 0 L ${MARKER_SIZE} ${MARKER_SIZE / 2} L 0 ${MARKER_SIZE} Z`}
            fill="#94a3b8"
          />
        </marker>
      </defs>

      {edges.map((edge) => {
        const sourceNode = nodeMap.get(edge.sourceId)
        const targetNode = nodeMap.get(edge.targetId)
        if (!sourceNode || !targetNode) return null
        return (
          <EdgePath
            key={edge.id}
            edge={edge}
            sourceNode={sourceNode}
            targetNode={targetNode}
            selected={edge.id === selectedEdgeId}
            onClick={handleEdgeClick}
          />
        )
      })}

      {draftEdge && (() => {
        const sourceNode = nodeMap.get(draftEdge.sourceId)
        if (!sourceNode) return null
        const p1 = getPortPosition(sourceNode, draftEdge.sourcePort)
        const p2 = { x: draftEdge.cursorX, y: draftEdge.cursorY }
        const sp = draftEdge.sourcePort
        const tp = sp === 'n' ? 's' : sp === 's' ? 'n' : sp === 'e' ? 'w' : 'e'
        const d = computePathD(activeConnectionType, p1, sp, p2, tp)
        return (
          <path
            d={d}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="6 4"
            markerEnd="url(#arrowhead-draft)"
            style={{ pointerEvents: 'none' }}
          />
        )
      })()}
    </svg>
  )
}
