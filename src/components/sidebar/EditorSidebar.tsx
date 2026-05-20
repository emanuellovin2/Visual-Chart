'use client'

import { useEffect } from 'react'
import {
  Square, Circle, Diamond, Triangle, StickyNote,
  Type, Image, ArrowRight, MousePointer2, RectangleHorizontal,
} from 'lucide-react'
import { useEditorStore, type ToolType } from '@/store/useEditorStore'

const TOOLS: { id: ToolType; label: string; shortcut: string; icon: React.ElementType }[] = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: MousePointer2 },
]

const SHAPES: { id: ToolType; label: string; shortcut: string; icon: React.ElementType }[] = [
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: Square },
  { id: 'rounded-rectangle', label: 'Rounded', shortcut: 'U', icon: RectangleHorizontal },
  { id: 'circle', label: 'Circle', shortcut: 'O', icon: Circle },
  { id: 'diamond', label: 'Diamond', shortcut: 'D', icon: Diamond },
  { id: 'triangle', label: 'Triangle', shortcut: 'G', icon: Triangle },
  { id: 'sticky-note', label: 'Sticky', shortcut: 'S', icon: StickyNote },
  { id: 'text-block', label: 'Text', shortcut: 'T', icon: Type },
  { id: 'image-block', label: 'Image', shortcut: 'I', icon: Image },
]

const CONNECTORS: { id: ToolType; label: string; shortcut: string; icon: React.ElementType }[] = [
  { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: ArrowRight },
]

const SHORTCUT_MAP: Record<string, ToolType> = {
  v: 'select',
  r: 'rectangle',
  u: 'rounded-rectangle',
  o: 'circle',
  d: 'diamond',
  g: 'triangle',
  s: 'sticky-note',
  t: 'text-block',
  i: 'image-block',
  a: 'arrow',
}

export function EditorSidebar() {
  const activeTool = useEditorStore((s) => s.activeTool)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  const editingNodeId = useEditorStore((s) => s.editingNodeId)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingNodeId) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return
      const tool = SHORTCUT_MAP[e.key.toLowerCase()]
      if (tool) setActiveTool(tool)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingNodeId, setActiveTool])

  return (
    <aside className="bg-card border-border flex h-full w-14 flex-col items-center border-r py-2 overflow-y-auto">
      <SectionLabel label="Tools" />
      {TOOLS.map((t) => (
        <SidebarButton key={t.id} {...t} active={activeTool === t.id} onClick={() => setActiveTool(t.id)} />
      ))}

      <div className="bg-border my-2 h-px w-8" />
      <SectionLabel label="Shapes" />

      {SHAPES.map((t) => (
        <SidebarButton key={t.id} {...t} active={activeTool === t.id} onClick={() => setActiveTool(t.id)} />
      ))}

      <div className="bg-border my-2 h-px w-8" />
      <SectionLabel label="Connect" />

      {CONNECTORS.map((t) => (
        <SidebarButton key={t.id} {...t} active={activeTool === t.id} onClick={() => setActiveTool(t.id)} />
      ))}
    </aside>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <span className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
      {label}
    </span>
  )
}

function SidebarButton({
  label,
  shortcut,
  active,
  onClick,
  icon: Icon,
}: {
  label: string
  shortcut: string
  active: boolean
  onClick: () => void
  icon: React.ElementType
}) {
  return (
    <button
      title={`${label} (${shortcut})`}
      onClick={onClick}
      className={[
        'relative flex h-9 w-9 items-center justify-center rounded-md transition-colors mb-0.5',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
      <span
        className={[
          'absolute bottom-0.5 right-1 text-[8px] font-medium leading-none tabular-nums',
          active ? 'text-primary-foreground/60' : 'text-muted-foreground/50',
        ].join(' ')}
      >
        {shortcut}
      </span>
    </button>
  )
}
