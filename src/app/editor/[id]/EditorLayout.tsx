'use client'

import { useEffect } from 'react'
import { EditorToolbar } from '@/components/toolbar/EditorToolbar'
import { EditorSidebar } from '@/components/sidebar/EditorSidebar'
import { CanvasContainer } from '@/components/canvas/CanvasContainer'
import { PropertiesPanel } from '@/components/panels/PropertiesPanel'
import { CanvasNodes } from '@/components/shapes'
import { ConnectionLayer } from '@/components/connections'
import { CollaboratorCursors } from '@/components/collaboration'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useAutosave } from '@/hooks/useAutosave'
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration'
import type { CanvasNode, CanvasEdge } from '@/types'

interface EditorLayoutProps {
  projectId: string
  projectTitle: string
  initialNodes: CanvasNode[]
  initialEdges: CanvasEdge[]
  initialIsPublic: boolean
  userId: string
  userName: string
  avatarUrl: string | null
}

export function EditorLayout({
  projectId,
  projectTitle,
  initialNodes,
  initialEdges,
  initialIsPublic,
  userId,
  userName,
  avatarUrl,
}: EditorLayoutProps) {
  useAutosave(projectId)
  useRealtimeCollaboration({ projectId, userId, userName, avatarUrl })

  useEffect(() => {
    useCanvasStore.getState().setNodes(initialNodes)
    useCanvasStore.getState().setEdges(initialEdges)
    useCanvasStore.temporal.getState().clear()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <EditorToolbar projectId={projectId} projectTitle={projectTitle} initialIsPublic={initialIsPublic} />
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar />
        <main className="relative flex-1 overflow-hidden">
          <CanvasContainer>
            <ConnectionLayer />
            <CanvasNodes />
          </CanvasContainer>
          <CollaboratorCursors />
        </main>
        <PropertiesPanel />
      </div>
    </div>
  )
}
