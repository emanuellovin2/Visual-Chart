'use client'

import { memo } from 'react'
import type { CanvasNode, ShapeType } from '@/types'

interface ShapeRendererProps {
  node: CanvasNode
  isEditing?: boolean
}

function getShapePath(type: ShapeType, w: number, h: number): React.ReactNode {
  const pad = 1
  switch (type) {
    case 'rectangle':
      return <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} />
    case 'rounded-rectangle':
      return <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} rx={Math.min(12, w * 0.15, h * 0.15)} />
    case 'circle':
      return <ellipse cx={w / 2} cy={h / 2} rx={(w - pad * 2) / 2} ry={(h - pad * 2) / 2} />
    case 'diamond': {
      const mx = w / 2, my = h / 2
      return <polygon points={`${mx},${pad} ${w - pad},${my} ${mx},${h - pad} ${pad},${my}`} />
    }
    case 'triangle':
      return <polygon points={`${w / 2},${pad} ${w - pad},${h - pad} ${pad},${h - pad}`} />
    case 'sticky-note':
      return (
        <>
          <polygon points={`${pad},${pad} ${w - 20},${pad} ${w - pad},${20} ${w - pad},${h - pad} ${pad},${h - pad}`} />
          <polyline points={`${w - 20},${pad} ${w - 20},${20} ${w - pad},${20}`} fill="none" />
        </>
      )
    case 'text-block':
      return <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} rx={4} />
    case 'image-block':
      return (
        <>
          <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2} rx={4} />
          <line x1={pad} y1={pad} x2={w - pad} y2={h - pad} strokeWidth={1} opacity={0.3} />
          <line x1={w - pad} y1={pad} x2={pad} y2={h - pad} strokeWidth={1} opacity={0.3} />
        </>
      )
  }
}

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

function ShapeRendererInner({ node, isEditing }: ShapeRendererProps) {
  const { type, width: w, height: h, style, text, imageUrl } = node
  const pad = 1
  const isText = type === 'text-block'
  const fill = isText ? 'transparent' : style.fill
  const textColor = isText ? style.stroke : contrastColor(style.fill)
  const shadowFilter = style.shadow ? 'url(#node-shadow)' : undefined

  return (
    <svg
      width={w}
      height={h}
      className="overflow-visible"
      style={{ opacity: style.opacity }}
    >
      <defs>
        <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      <g
        fill={fill}
        stroke={style.strokeWidth > 0 ? style.stroke : 'none'}
        strokeWidth={style.strokeWidth}
        filter={shadowFilter}
      >
        {getShapePath(type, w, h)}
      </g>

      {type === 'image-block' && imageUrl && (
        <foreignObject x={pad} y={pad} width={Math.max(w - pad * 2, 1)} height={Math.max(h - pad * 2, 1)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 3,
              display: 'block',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </foreignObject>
      )}

      {type === 'image-block' && !imageUrl && (
        <foreignObject x={pad} y={pad} width={Math.max(w - pad * 2, 1)} height={Math.max(h - pad * 2, 1)}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: '#94a3b8',
              fontSize: 12,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Double-click to upload</span>
          </div>
        </foreignObject>
      )}

      {text && !isEditing && (
        <foreignObject x={8} y={4} width={Math.max(w - 16, 1)} height={Math.max(h - 8, 1)}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                style.textAlign === 'left'
                  ? 'flex-start'
                  : style.textAlign === 'right'
                    ? 'flex-end'
                    : 'center',
              fontSize: style.fontSize,
              fontFamily: style.fontFamily,
              fontWeight: style.fontWeight,
              color: textColor,
              lineHeight: 1.3,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            <span style={{ textAlign: style.textAlign }}>{text}</span>
          </div>
        </foreignObject>
      )}
    </svg>
  )
}

export const ShapeRenderer = memo(ShapeRendererInner)
