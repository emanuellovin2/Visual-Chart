'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useEditorStore } from '@/store/useEditorStore'
import type { CanvasNode } from '@/types'

function contrastColor(hex: string): string {
  if (!hex || hex === 'transparent' || hex === 'none') return '#0f172a'
  const c = hex.replace('#', '')
  if (c.length < 6) return '#0f172a'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#0f172a' : '#f8fafc'
}

export function InlineTextEditor({ node }: { node: CanvasNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const updateNode = useCanvasStore((s) => s.updateNode)
  const setEditingNodeId = useEditorStore((s) => s.setEditingNodeId)
  const { style, text, type } = node
  const isText = type === 'text-block'
  const textColor = isText ? style.stroke : contrastColor(style.fill)

  const commit = useCallback(() => {
    if (!ref.current) return
    updateNode(node.id, { text: ref.current.innerText })
    setEditingNodeId(null)
  }, [node.id, updateNode, setEditingNodeId])

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerText = text
    ref.current.focus()
    const range = document.createRange()
    range.selectNodeContents(ref.current)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        zIndex: 10,
        outline: '2px solid #3b82f6',
        outlineOffset: '1px',
        borderRadius: 4,
        pointerEvents: 'all',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); commit() }
          e.stopPropagation()
        }}
        style={{
          width: '100%',
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          color: textColor,
          textAlign: style.textAlign,
          lineHeight: 1.3,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          outline: 'none',
          cursor: 'text',
          minHeight: '1em',
        }}
      />
    </div>
  )
}
