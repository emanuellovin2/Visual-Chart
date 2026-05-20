import type { CanvasNode, CanvasEdge, ShapeType } from '@/types'
import { getBestPorts, getPortPosition, computePathD, getPathMidpoint } from './connections'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function contrastColor(hex: string): string {
  if (!hex || hex === 'transparent' || hex === 'none') return '#0f172a'
  const c = hex.replace('#', '')
  if (c.length < 6) return '#0f172a'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#0f172a' : '#f8fafc'
}

function shapePath(type: ShapeType, x: number, y: number, w: number, h: number): string {
  const p = 1
  switch (type) {
    case 'rectangle':
      return `<rect x="${x + p}" y="${y + p}" width="${w - p * 2}" height="${h - p * 2}"/>`
    case 'rounded-rectangle': {
      const rx = Math.min(12, w * 0.15, h * 0.15)
      return `<rect x="${x + p}" y="${y + p}" width="${w - p * 2}" height="${h - p * 2}" rx="${rx}"/>`
    }
    case 'circle':
      return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${(w - p * 2) / 2}" ry="${(h - p * 2) / 2}"/>`
    case 'diamond': {
      const mx = x + w / 2
      const my = y + h / 2
      return `<polygon points="${mx},${y + p} ${x + w - p},${my} ${mx},${y + h - p} ${x + p},${my}"/>`
    }
    case 'triangle':
      return `<polygon points="${x + w / 2},${y + p} ${x + w - p},${y + h - p} ${x + p},${y + h - p}"/>`
    case 'sticky-note':
      return (
        `<polygon points="${x + p},${y + p} ${x + w - 20},${y + p} ${x + w - p},${y + 20} ${x + w - p},${y + h - p} ${x + p},${y + h - p}"/>` +
        `<polyline points="${x + w - 20},${y + p} ${x + w - 20},${y + 20} ${x + w - p},${y + 20}" fill="none"/>`
      )
    case 'text-block':
    case 'image-block':
    default:
      return `<rect x="${x + p}" y="${y + p}" width="${w - p * 2}" height="${h - p * 2}" rx="4"/>`
  }
}

function nodeToSvg(node: CanvasNode): string {
  const { x, y, width: w, height: h, style, type, text } = node
  const isText = type === 'text-block'
  const fill = isText ? 'none' : style.fill
  const stroke = style.strokeWidth > 0 ? style.stroke : 'none'
  const textColor = isText ? style.stroke : contrastColor(style.fill)
  const filter = style.shadow ? ' filter="url(#shadow)"' : ''
  const opacity = style.opacity !== 1 ? ` opacity="${style.opacity}"` : ''

  const path = shapePath(type, x, y, w, h)
  const groupAttrs = `fill="${esc(fill)}" stroke="${esc(stroke)}" stroke-width="${style.strokeWidth}"${filter}${opacity}`

  let textSvg = ''
  if (text && type !== 'image-block') {
    const cx = x + w / 2
    const cy = y + h / 2
    const anchor =
      style.textAlign === 'left' ? 'start' : style.textAlign === 'right' ? 'end' : 'middle'
    const tx =
      style.textAlign === 'left' ? x + 8 : style.textAlign === 'right' ? x + w - 8 : cx
    const lines = text.split('\n')
    const lineH = style.fontSize * 1.4
    const totalH = lines.length * lineH
    const startY = cy - totalH / 2 + style.fontSize * 0.6
    textSvg = lines
      .map(
        (line, i) =>
          `<text x="${tx}" y="${startY + i * lineH}" text-anchor="${anchor}" font-size="${style.fontSize}" font-family="${esc(style.fontFamily)}" font-weight="${style.fontWeight}" fill="${esc(textColor)}">${esc(line)}</text>`
      )
      .join('\n')
  }

  return `<g ${groupAttrs}>${path}</g>\n${textSvg}`
}

function edgeToSvg(edge: CanvasEdge, nodes: CanvasNode[]): string {
  const src = nodes.find((n) => n.id === edge.sourceId)
  const tgt = nodes.find((n) => n.id === edge.targetId)
  if (!src || !tgt) return ''

  const { sp, tp } = getBestPorts(src, tgt)
  const p1 = getPortPosition(src, sp)
  const p2 = getPortPosition(tgt, tp)
  const d = computePathD(edge.type, p1, sp, p2, tp)
  const mid = getPathMidpoint(edge.type, p1, sp, p2, tp)
  const color = edge.style.stroke
  const sw = edge.style.strokeWidth
  const dash = edge.style.dashed ? ' stroke-dasharray="6 4"' : ''
  const markerId = `arrow-${edge.id}`

  let label = ''
  if (edge.label) {
    const lw = edge.label.length * 7 + 8
    label =
      `<rect x="${mid.x - lw / 2}" y="${mid.y - 10}" width="${lw}" height="20" rx="4" fill="white" stroke="${esc(color)}" stroke-width="1"/>` +
      `<text x="${mid.x}" y="${mid.y}" text-anchor="middle" dominant-baseline="central" font-size="12" fill="#0f172a">${esc(edge.label)}</text>`
  }

  return `<path d="${d}" fill="none" stroke="${esc(color)}" stroke-width="${sw}"${dash} marker-end="url(#${markerId})"/>${label}`
}

export function buildExportSvg(nodes: CanvasNode[], edges: CanvasEdge[], padding = 40): string {
  if (nodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="white"/><text x="200" y="150" text-anchor="middle" font-size="16" fill="#94a3b8" font-family="sans-serif">Empty diagram</text></svg>`
  }

  const minX = Math.min(...nodes.map((n) => n.x)) - padding
  const minY = Math.min(...nodes.map((n) => n.y)) - padding
  const maxX = Math.max(...nodes.map((n) => n.x + n.width)) + padding
  const maxY = Math.max(...nodes.map((n) => n.y + n.height)) + padding
  const W = maxX - minX
  const H = maxY - minY

  const sortedNodes = [...nodes].sort((a, b) => a.zIndex - b.zIndex)

  const S = 8
  const markers = edges
    .map(
      (e) =>
        `<marker id="arrow-${e.id}" markerWidth="${S}" markerHeight="${S}" refX="${S - 2}" refY="${S / 2}" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L ${S} ${S / 2} L 0 ${S} Z" fill="${esc(e.style.stroke)}"/></marker>`
    )
    .join('\n')

  const edgesSvg = edges.map((e) => edgeToSvg(e, nodes)).join('\n')
  const shapesSvg = sortedNodes.map((n) => nodeToSvg(n)).join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${W} ${H}" width="${W}" height="${H}">
<defs>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.25"/>
  </filter>
  ${markers}
</defs>
<rect x="${minX}" y="${minY}" width="${W}" height="${H}" fill="white"/>
${edgesSvg}
${shapesSvg}
</svg>`
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSvg(nodes: CanvasNode[], edges: CanvasEdge[], filename = 'diagram.svg') {
  const svg = buildExportSvg(nodes, edges)
  triggerDownload(new Blob([svg], { type: 'image/svg+xml' }), filename)
}

function svgToPngCanvas(
  svgString: string,
  w: number,
  h: number,
  scale: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w * scale
      canvas.height = h * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG for export'))
    }
    img.src = url
  })
}

function parseSvgDimensions(svg: string): { w: number; h: number } {
  const wMatch = svg.match(/\bwidth="(\d+(?:\.\d+)?)"/)
  const hMatch = svg.match(/\bheight="(\d+(?:\.\d+)?)"/)
  return {
    w: wMatch ? parseFloat(wMatch[1]) : 800,
    h: hMatch ? parseFloat(hMatch[1]) : 600,
  }
}

export async function exportPng(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  filename = 'diagram.png',
  scale = 2
): Promise<void> {
  const svg = buildExportSvg(nodes, edges)
  const { w, h } = parseSvgDimensions(svg)
  const canvas = await svgToPngCanvas(svg, w, h, scale)

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('PNG export failed')); return }
      triggerDownload(blob, filename)
      resolve()
    }, 'image/png')
  })
}

export async function exportPdf(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  filename = 'diagram.pdf',
  scale = 2
): Promise<void> {
  const svg = buildExportSvg(nodes, edges)
  const { w, h } = parseSvgDimensions(svg)
  const canvas = await svgToPngCanvas(svg, w, h, scale)
  const dataUrl = canvas.toDataURL('image/png')

  const { jsPDF } = await import('jspdf')
  const orientation = w >= h ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'px', format: [w, h] })
  pdf.addImage(dataUrl, 'PNG', 0, 0, w, h)
  pdf.save(filename)
}

export function exportJson(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  filename = 'diagram.json'
) {
  const data = { nodes, edges, exportedAt: new Date().toISOString() }
  triggerDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    filename
  )
}
