import { create } from 'zustand'
import type { ShapeType, PortSide, ConnectionType, CanvasNode } from '@/types'

export type ToolType = 'select' | 'arrow' | ShapeType

export interface DraftEdge {
  sourceId: string
  sourcePort: PortSide
  cursorX: number
  cursorY: number
}

interface EditorStore {
  activeTool: ToolType
  setActiveTool: (tool: ToolType) => void

  activeConnectionType: ConnectionType
  setActiveConnectionType: (type: ConnectionType) => void

  hoveredNodeId: string | null
  setHoveredNodeId: (id: string | null) => void

  draftEdge: DraftEdge | null
  startDraftEdge: (sourceId: string, sourcePort: PortSide, cursorX: number, cursorY: number) => void
  updateDraftCursor: (x: number, y: number) => void
  clearDraftEdge: () => void

  selectedEdgeId: string | null
  setSelectedEdgeId: (id: string | null) => void

  editingNodeId: string | null
  setEditingNodeId: (id: string | null) => void

  saveStatus: 'saved' | 'saving' | 'unsaved'
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void

  clipboard: CanvasNode[]
  setClipboard: (nodes: CanvasNode[]) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  activeConnectionType: 'elbow',
  setActiveConnectionType: (type) => set({ activeConnectionType: type }),

  hoveredNodeId: null,
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),

  draftEdge: null,
  startDraftEdge: (sourceId, sourcePort, cursorX, cursorY) =>
    set({ draftEdge: { sourceId, sourcePort, cursorX, cursorY } }),
  updateDraftCursor: (x, y) =>
    set((s) => s.draftEdge ? { draftEdge: { ...s.draftEdge, cursorX: x, cursorY: y } } : {}),
  clearDraftEdge: () => set({ draftEdge: null }),

  selectedEdgeId: null,
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

  editingNodeId: null,
  setEditingNodeId: (id) => set({ editingNodeId: id }),

  saveStatus: 'saved',
  setSaveStatus: (status) => set({ saveStatus: status }),

  clipboard: [],
  setClipboard: (nodes) => set({ clipboard: nodes }),
}))
