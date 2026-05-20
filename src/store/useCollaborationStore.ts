import { create } from 'zustand'
import type { CollaboratorPresence } from '@/types/realtime'

const COLLAB_COLORS = [
  '#f97316', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ec4899', '#3b82f6', '#84cc16',
]

export function getCollabColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length]
}

interface CollaborationStore {
  collaborators: Record<string, CollaboratorPresence>
  isConnected: boolean
  setConnected: (connected: boolean) => void
  upsertCollaborator: (collab: CollaboratorPresence) => void
  removeCollaborator: (userId: string) => void
  updateCursor: (userId: string, x: number, y: number) => void
  clearCollaborators: () => void
  // Injected by useRealtimeCollaboration — not reactive state
  _broadcastCursor: ((x: number, y: number) => void) | null
  setBroadcastCursor: (fn: ((x: number, y: number) => void) | null) => void
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  collaborators: {},
  isConnected: false,

  setConnected: (connected) => set({ isConnected: connected }),

  upsertCollaborator: (collab) =>
    set((state) => ({
      collaborators: { ...state.collaborators, [collab.userId]: collab },
    })),

  removeCollaborator: (userId) =>
    set((state) => {
      const next = { ...state.collaborators }
      delete next[userId]
      return { collaborators: next }
    }),

  updateCursor: (userId, x, y) =>
    set((state) => {
      const existing = state.collaborators[userId]
      if (!existing) return {}
      return {
        collaborators: {
          ...state.collaborators,
          [userId]: { ...existing, cursorX: x, cursorY: y },
        },
      }
    }),

  clearCollaborators: () => set({ collaborators: {} }),

  _broadcastCursor: null,
  setBroadcastCursor: (fn) => set({ _broadcastCursor: fn }),
}))
