import type { CanvasNode, CanvasEdge } from './index'

export type CollabEventType =
  | 'node_added'
  | 'node_updated'
  | 'node_removed'
  | 'edge_added'
  | 'edge_removed'
  | 'cursor_moved'

export type CollabEvent =
  | { type: 'node_added'; node: CanvasNode; senderId: string }
  | { type: 'node_updated'; nodeId: string; updates: Partial<CanvasNode>; senderId: string }
  | { type: 'node_removed'; nodeIds: string[]; senderId: string }
  | { type: 'edge_added'; edge: CanvasEdge; senderId: string }
  | { type: 'edge_removed'; edgeIds: string[]; senderId: string }
  | { type: 'cursor_moved'; x: number; y: number; senderId: string }

export interface CollaboratorPresence {
  userId: string
  userName: string
  avatarUrl: string | null
  color: string
  cursorX: number
  cursorY: number
  onlineAt: string
}

export type PresencePayload = Omit<CollaboratorPresence, 'userId'>
