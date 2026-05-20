import type { CanvasNode, CanvasEdge, PortSide, ConnectionType } from '@/types'

export function getPortPosition(node: CanvasNode, port: PortSide): { x: number; y: number } {
  const cx = node.x + node.width / 2
  const cy = node.y + node.height / 2
  switch (port) {
    case 'n': return { x: cx, y: node.y }
    case 's': return { x: cx, y: node.y + node.height }
    case 'e': return { x: node.x + node.width, y: cy }
    case 'w': return { x: node.x, y: cy }
  }
}

export function getBestPorts(
  source: CanvasNode,
  target: CanvasNode
): { sp: PortSide; tp: PortSide } {
  const sdx = (target.x + target.width / 2) - (source.x + source.width / 2)
  const sdy = (target.y + target.height / 2) - (source.y + source.height / 2)
  if (Math.abs(sdx) >= Math.abs(sdy)) {
    return sdx >= 0 ? { sp: 'e', tp: 'w' } : { sp: 'w', tp: 'e' }
  }
  return sdy >= 0 ? { sp: 's', tp: 'n' } : { sp: 'n', tp: 's' }
}

export function getClosestPort(
  node: CanvasNode,
  canvasX: number,
  canvasY: number
): PortSide {
  const ports: PortSide[] = ['n', 's', 'e', 'w']
  let minDist = Infinity
  let closest: PortSide = 'n'
  for (const port of ports) {
    const pos = getPortPosition(node, port)
    const dist = Math.hypot(canvasX - pos.x, canvasY - pos.y)
    if (dist < minDist) { minDist = dist; closest = port }
  }
  return closest
}

function controlOffset(port: PortSide, dist: number): { dx: number; dy: number } {
  switch (port) {
    case 'n': return { dx: 0, dy: -dist }
    case 's': return { dx: 0, dy: dist }
    case 'e': return { dx: dist, dy: 0 }
    case 'w': return { dx: -dist, dy: 0 }
  }
}

export function computePathD(
  type: ConnectionType,
  p1: { x: number; y: number },
  sp: PortSide,
  p2: { x: number; y: number },
  tp: PortSide
): string {
  switch (type) {
    case 'straight':
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`

    case 'curved': {
      const dist = Math.max(60, Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.45)
      const o1 = controlOffset(sp, dist)
      const o2 = controlOffset(tp, dist)
      return `M ${p1.x} ${p1.y} C ${p1.x + o1.dx} ${p1.y + o1.dy} ${p2.x + o2.dx} ${p2.y + o2.dy} ${p2.x} ${p2.y}`
    }

    case 'elbow': {
      const isH = sp === 'e' || sp === 'w'
      if (isH) {
        const mx = (p1.x + p2.x) / 2
        return `M ${p1.x} ${p1.y} L ${mx} ${p1.y} L ${mx} ${p2.y} L ${p2.x} ${p2.y}`
      } else {
        const my = (p1.y + p2.y) / 2
        return `M ${p1.x} ${p1.y} L ${p1.x} ${my} L ${p2.x} ${my} L ${p2.x} ${p2.y}`
      }
    }
  }
}

export function getPathMidpoint(
  type: ConnectionType,
  p1: { x: number; y: number },
  sp: PortSide,
  p2: { x: number; y: number },
  tp: PortSide
): { x: number; y: number } {
  switch (type) {
    case 'straight':
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }

    case 'curved': {
      const dist = Math.max(60, Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.45)
      const o1 = controlOffset(sp, dist)
      const o2 = controlOffset(tp, dist)
      const c1 = { x: p1.x + o1.dx, y: p1.y + o1.dy }
      const c2 = { x: p2.x + o2.dx, y: p2.y + o2.dy }
      // t=0.5 on cubic bezier
      const t = 0.5
      return {
        x: (1-t)**3*p1.x + 3*(1-t)**2*t*c1.x + 3*(1-t)*t**2*c2.x + t**3*p2.x,
        y: (1-t)**3*p1.y + 3*(1-t)**2*t*c1.y + 3*(1-t)*t**2*c2.y + t**3*p2.y,
      }
    }

    case 'elbow': {
      const isH = sp === 'e' || sp === 'w'
      if (isH) {
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
      }
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
    }
  }
}

export function resolveEdgePorts(
  edge: CanvasEdge,
  sourceNode: CanvasNode,
  targetNode: CanvasNode
): { sp: PortSide; tp: PortSide } {
  // If ports are explicitly set (not auto), use them; otherwise recompute best
  return getBestPorts(sourceNode, targetNode)
}
