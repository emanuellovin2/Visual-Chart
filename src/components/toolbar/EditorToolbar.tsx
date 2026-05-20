'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Share2, Download, Minus, Spline, CornerDownRight,
  Undo2, Redo2, Check, Loader2, CloudOff,
} from 'lucide-react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useEditorStore } from '@/store/useEditorStore'
import dynamic from 'next/dynamic'
import { CollaboratorAvatars } from '@/components/collaboration'

const ExportDialog = dynamic(() => import('./ExportDialog').then((m) => m.ExportDialog), { ssr: false })
const ShareDialog = dynamic(() => import('./ShareDialog').then((m) => m.ShareDialog), { ssr: false })
import type { ConnectionType } from '@/types'

interface EditorToolbarProps {
  projectId: string
  projectTitle: string
  initialIsPublic: boolean
}

function SaveStatusIndicator({ status }: { status: 'saved' | 'saving' | 'unsaved' }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    )
  }
  if (status === 'unsaved') {
    return (
      <span className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
        <CloudOff className="h-3 w-3" />
        Unsaved
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 px-2 text-xs text-muted-foreground">
      <Check className="h-3 w-3 text-green-500" />
      Saved
    </span>
  )
}

const CONNECTION_TYPES: { type: ConnectionType; label: string; icon: React.ElementType }[] = [
  { type: 'straight', label: 'Straight', icon: Minus },
  { type: 'curved', label: 'Curved', icon: Spline },
  { type: 'elbow', label: 'Elbow', icon: CornerDownRight },
]

export function EditorToolbar({ projectId, projectTitle, initialIsPublic }: EditorToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const zoom = useCanvasStore((s) => s.zoom)
  const activeTool = useEditorStore((s) => s.activeTool)
  const activeConnectionType = useEditorStore((s) => s.activeConnectionType)
  const setActiveConnectionType = useEditorStore((s) => s.setActiveConnectionType)

  const [canUndo, setCanUndo] = useState(() => useCanvasStore.temporal.getState().pastStates.length > 0)
  const [canRedo, setCanRedo] = useState(() => useCanvasStore.temporal.getState().futureStates.length > 0)
  useEffect(() => {
    return useCanvasStore.temporal.subscribe((s) => {
      setCanUndo(s.pastStates.length > 0)
      setCanRedo(s.futureStates.length > 0)
    })
  }, [])
  const undo = useCallback(() => useCanvasStore.temporal.getState().undo(), [])
  const redo = useCallback(() => useCanvasStore.temporal.getState().redo(), [])
  const saveStatus = useEditorStore((s) => s.saveStatus)

  return (
    <header className="bg-card border-border flex h-12 items-center gap-1 border-b px-3">
      {/* Back */}
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-accent"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>

      <div className="bg-border h-5 w-px mx-1" />

      {/* File name */}
      <span className="max-w-[180px] truncate text-sm font-medium">{projectTitle}</span>

      <div className="bg-border h-5 w-px mx-1" />

      {/* Undo / Redo */}
      <button
        onClick={() => undo()}
        disabled={!canUndo}
        title="Undo (⌘Z)"
        className="flex h-8 w-8 items-center justify-center rounded transition-colors disabled:opacity-30 text-muted-foreground hover:text-foreground hover:bg-accent disabled:pointer-events-none"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => redo()}
        disabled={!canRedo}
        title="Redo (⌘⇧Z)"
        className="flex h-8 w-8 items-center justify-center rounded transition-colors disabled:opacity-30 text-muted-foreground hover:text-foreground hover:bg-accent disabled:pointer-events-none"
      >
        <Redo2 className="h-4 w-4" />
      </button>

      {/* Connection type selector — visible when arrow tool is active */}
      {activeTool === 'arrow' && (
        <>
          <div className="bg-border h-5 w-px mx-1" />
          <div className="flex items-center gap-0.5">
            {CONNECTION_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setActiveConnectionType(type)}
                title={label}
                className={[
                  'flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors',
                  activeConnectionType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-1">
        <SaveStatusIndicator status={saveStatus} />
        <div className="bg-border h-5 w-px" />
        <span className="tabular-nums text-xs text-muted-foreground px-2">
          {Math.round(zoom * 100)}%
        </span>
        <div className="bg-border h-5 w-px" />
        <CollaboratorAvatars />

        <button
          onClick={() => setShareOpen(true)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-accent"
          title="Share"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
        <button
          onClick={() => setExportOpen(true)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-accent"
          title="Export"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {exportOpen && (
        <ExportDialog projectTitle={projectTitle} onClose={() => setExportOpen(false)} />
      )}
      {shareOpen && (
        <ShareDialog
          projectId={projectId}
          projectTitle={projectTitle}
          initialIsPublic={initialIsPublic}
          onClose={() => setShareOpen(false)}
        />
      )}
    </header>
  )
}
