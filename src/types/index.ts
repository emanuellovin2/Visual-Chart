export type { Database, Json } from './database'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export type ShapeType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'sticky-note'
  | 'text-block'
  | 'image-block'

export type ConnectionType = 'straight' | 'curved' | 'elbow'
export type PortSide = 'n' | 's' | 'e' | 'w'

export interface ShapeStyle {
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  textAlign: 'left' | 'center' | 'right'
  shadow: boolean
}

export interface CanvasNode {
  id: string
  type: ShapeType
  x: number
  y: number
  width: number
  height: number
  text: string
  style: ShapeStyle
  zIndex: number
  imageUrl?: string
}

export interface CanvasEdge {
  id: string
  sourceId: string
  targetId: string
  sourcePort: PortSide
  targetPort: PortSide
  type: ConnectionType
  label: string
  style: {
    stroke: string
    strokeWidth: number
    dashed?: boolean
  }
}

export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  selectedIds: string[]
  zoom: number
  panX: number
  panY: number
}
