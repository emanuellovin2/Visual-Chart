import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import type { CanvasNode, CanvasEdge } from '@/types'

interface CanvasStore {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  selectedIds: string[]
  zoom: number
  panX: number
  panY: number

  setNodes: (nodes: CanvasNode[]) => void
  addNode: (node: CanvasNode) => void
  addNodeAndSelect: (node: CanvasNode) => void
  updateNode: (id: string, updates: Partial<CanvasNode>) => void
  removeNodes: (ids: string[]) => void
  duplicateNodes: (ids: string[], offset?: number) => string[]
  pasteNodes: (sourceNodes: CanvasNode[], pasteAt?: { x: number; y: number }) => string[]

  setEdges: (edges: CanvasEdge[]) => void
  addEdge: (edge: CanvasEdge) => void
  removeEdges: (ids: string[]) => void

  setSelectedIds: (ids: string[]) => void
  clearSelection: () => void

  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  resetView: () => void

  bringToFront: (ids: string[]) => void
  sendToBack: (ids: string[]) => void
  bringForward: (ids: string[]) => void
  sendBackward: (ids: string[]) => void
}

export const useCanvasStore = create<CanvasStore>()(
  temporal(
    immer((set) => ({
      nodes: [],
      edges: [],
      selectedIds: [],
      zoom: 1,
      panX: 0,
      panY: 0,

      setNodes: (nodes) =>
        set((state) => {
          state.nodes = nodes
        }),

      addNode: (node) =>
        set((state) => {
          state.nodes.push(node)
        }),

      addNodeAndSelect: (node) =>
        set((state) => {
          state.nodes.push(node)
          state.selectedIds = [node.id]
        }),

      updateNode: (id, updates) =>
        set((state) => {
          const idx = state.nodes.findIndex((n) => n.id === id)
          if (idx !== -1) Object.assign(state.nodes[idx], updates)
        }),

      removeNodes: (ids) =>
        set((state) => {
          state.nodes = state.nodes.filter((n) => !ids.includes(n.id))
          state.edges = state.edges.filter(
            (e) => !ids.includes(e.sourceId) && !ids.includes(e.targetId)
          )
          state.selectedIds = state.selectedIds.filter((id) => !ids.includes(id))
        }),

      duplicateNodes: (ids, offset = 20) => {
        const newIds: string[] = []
        set((state) => {
          const maxZ = Math.max(0, ...state.nodes.map((n) => n.zIndex))
          const copies = state.nodes
            .filter((n) => ids.includes(n.id))
            .map((n, i) => {
              const newId = crypto.randomUUID()
              newIds.push(newId)
              return {
                ...JSON.parse(JSON.stringify(n)) as CanvasNode,
                id: newId,
                x: n.x + offset,
                y: n.y + offset,
                zIndex: maxZ + i + 1,
              }
            })
          copies.forEach((c) => state.nodes.push(c))
          state.selectedIds = newIds
        })
        return newIds
      },

      pasteNodes: (sourceNodes: CanvasNode[], pasteAt?: { x: number; y: number }) => {
        const newIds: string[] = []
        set((state) => {
          const maxZ = Math.max(0, ...state.nodes.map((n) => n.zIndex))
          let dx = 20
          let dy = 20
          if (pasteAt) {
            const minX = Math.min(...sourceNodes.map((n) => n.x))
            const minY = Math.min(...sourceNodes.map((n) => n.y))
            const maxX = Math.max(...sourceNodes.map((n) => n.x + n.width))
            const maxY = Math.max(...sourceNodes.map((n) => n.y + n.height))
            dx = pasteAt.x - (minX + maxX) / 2
            dy = pasteAt.y - (minY + maxY) / 2
          }
          const copies = sourceNodes.map((n, i) => {
            const newId = crypto.randomUUID()
            newIds.push(newId)
            return {
              ...JSON.parse(JSON.stringify(n)) as CanvasNode,
              id: newId,
              x: Math.round((n.x + dx) / 8) * 8,
              y: Math.round((n.y + dy) / 8) * 8,
              zIndex: maxZ + i + 1,
            }
          })
          copies.forEach((c) => state.nodes.push(c))
          state.selectedIds = newIds
        })
        return newIds
      },

      setEdges: (edges) =>
        set((state) => {
          state.edges = edges
        }),

      addEdge: (edge) =>
        set((state) => {
          state.edges.push(edge)
        }),

      removeEdges: (ids) =>
        set((state) => {
          state.edges = state.edges.filter((e) => !ids.includes(e.id))
        }),

      setSelectedIds: (ids) =>
        set((state) => {
          state.selectedIds = ids
        }),

      clearSelection: () =>
        set((state) => {
          state.selectedIds = []
        }),

      setZoom: (zoom) =>
        set((state) => {
          state.zoom = Math.min(Math.max(zoom, 0.1), 5)
        }),

      setPan: (x, y) =>
        set((state) => {
          state.panX = x
          state.panY = y
        }),

      resetView: () =>
        set((state) => {
          state.zoom = 1
          state.panX = 0
          state.panY = 0
        }),

      bringToFront: (ids) =>
        set((state) => {
          const sorted = [...state.nodes].sort((a, b) => a.zIndex - b.zIndex)
          const others = sorted.filter((n) => !ids.includes(n.id))
          const selected = sorted.filter((n) => ids.includes(n.id))
          const reordered = [...others, ...selected]
          reordered.forEach((n, i) => {
            const idx = state.nodes.findIndex((node) => node.id === n.id)
            if (idx !== -1) state.nodes[idx].zIndex = i + 1
          })
        }),

      sendToBack: (ids) =>
        set((state) => {
          const sorted = [...state.nodes].sort((a, b) => a.zIndex - b.zIndex)
          const selected = sorted.filter((n) => ids.includes(n.id))
          const others = sorted.filter((n) => !ids.includes(n.id))
          const reordered = [...selected, ...others]
          reordered.forEach((n, i) => {
            const idx = state.nodes.findIndex((node) => node.id === n.id)
            if (idx !== -1) state.nodes[idx].zIndex = i + 1
          })
        }),

      bringForward: (ids) =>
        set((state) => {
          const sorted = [...state.nodes].sort((a, b) => a.zIndex - b.zIndex)
          for (let i = sorted.length - 2; i >= 0; i--) {
            if (ids.includes(sorted[i].id) && !ids.includes(sorted[i + 1].id)) {
              ;[sorted[i], sorted[i + 1]] = [sorted[i + 1], sorted[i]]
            }
          }
          sorted.forEach((n, i) => {
            const idx = state.nodes.findIndex((node) => node.id === n.id)
            if (idx !== -1) state.nodes[idx].zIndex = i + 1
          })
        }),

      sendBackward: (ids) =>
        set((state) => {
          const sorted = [...state.nodes].sort((a, b) => a.zIndex - b.zIndex)
          for (let i = 1; i < sorted.length; i++) {
            if (ids.includes(sorted[i].id) && !ids.includes(sorted[i - 1].id)) {
              ;[sorted[i], sorted[i - 1]] = [sorted[i - 1], sorted[i]]
            }
          }
          sorted.forEach((n, i) => {
            const idx = state.nodes.findIndex((node) => node.id === n.id)
            if (idx !== -1) state.nodes[idx].zIndex = i + 1
          })
        }),
    })),
    {
      // Only track nodes/edges in undo history — pan, zoom, and selection
      // changes should not be undoable and would bloat history otherwise.
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    }
  )
)
