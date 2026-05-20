'use client'

import { useRef, startTransition } from 'react'
import { uploadNodeImage } from '@/app/editor/[id]/actions'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useEditorStore } from '@/store/useEditorStore'
import type { ShapeStyle, ConnectionType, ShapeType } from '@/types'

const TYPE_LABELS: Record<ShapeType, string> = {
  rectangle: 'Rectangle',
  'rounded-rectangle': 'Rounded Rect',
  circle: 'Circle',
  diamond: 'Diamond',
  triangle: 'Triangle',
  'sticky-note': 'Sticky Note',
  'text-block': 'Text',
  'image-block': 'Image',
}

export function PropertiesPanel() {
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const updateNode = useCanvasStore((s) => s.updateNode)
  const removeEdges = useCanvasStore((s) => s.removeEdges)
  const selectedEdgeId = useEditorStore((s) => s.selectedEdgeId)
  const setSelectedEdgeId = useEditorStore((s) => s.setSelectedEdgeId)

  const removeNodes = useCanvasStore((s) => s.removeNodes)
  const selectedNode = nodes.find((n) => n.id === selectedIds[0])
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)

  // Edge panel
  if (selectedEdge && !selectedNode) {
    const updateEdge = (patch: Partial<typeof selectedEdge>) => {
      const updated = { ...selectedEdge, ...patch }
      const rest = edges.filter((e) => e.id !== selectedEdge.id)
      useCanvasStore.getState().setEdges([...rest, updated])
    }
    const updateEdgeStyle = (patch: Partial<typeof selectedEdge.style>) => {
      updateEdge({ style: { ...selectedEdge.style, ...patch } })
    }
    return (
      <aside className="bg-card border-border flex h-full w-60 flex-col border-l overflow-y-auto">
        <PanelHeader label="Connection" />
        <div className="flex-1 space-y-4 p-4">
          <Section label="Type">
            <div className="flex gap-1">
              {(['straight', 'curved', 'elbow'] as ConnectionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => updateEdge({ type: t })}
                  className={[
                    'flex-1 rounded py-1 text-xs capitalize transition-colors',
                    selectedEdge.type === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {t}
                </button>
              ))}
            </div>
          </Section>
          <Section label="Color">
            <ColorInput value={selectedEdge.style.stroke} onChange={(v) => updateEdgeStyle({ stroke: v })} />
          </Section>
          <Section label="Thickness">
            <NumberInput label="W" value={selectedEdge.style.strokeWidth} onChange={(v) => updateEdgeStyle({ strokeWidth: Math.max(0.5, v) })} min={0.5} max={20} />
          </Section>
          <Section label="Style">
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-xs text-muted-foreground">Dashed</span>
              <div
                onClick={() => updateEdgeStyle({ dashed: !selectedEdge.style.dashed })}
                className={['relative h-4 w-7 rounded-full transition-colors', selectedEdge.style.dashed ? 'bg-blue-500' : 'bg-muted'].join(' ')}
              >
                <div className={['absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform', selectedEdge.style.dashed ? 'translate-x-3.5' : 'translate-x-0.5'].join(' ')} />
              </div>
            </label>
          </Section>
          <Section label="Label">
            <input
              type="text"
              value={selectedEdge.label}
              onChange={(e) => updateEdge({ label: e.target.value })}
              placeholder="Add label..."
              className="bg-muted border-border h-7 w-full rounded border px-2 text-xs outline-none focus:border-blue-500"
            />
          </Section>
          <button
            onClick={() => { removeEdges([selectedEdge.id]); setSelectedEdgeId(null) }}
            className="w-full rounded bg-destructive/10 py-1.5 text-xs text-destructive hover:bg-destructive/20 transition-colors"
          >
            Delete connection
          </button>
        </div>
      </aside>
    )
  }

  if (!selectedNode) {
    return (
      <aside className="bg-card border-border flex h-full w-60 flex-col border-l">
        <PanelHeader label="Properties" />
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-xs text-muted-foreground">
            Select an element to edit its properties
          </p>
        </div>
      </aside>
    )
  }

  const imgInputRef = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<typeof selectedNode>) =>
    updateNode(selectedNode.id, patch)
  const updateStyle = (patch: Partial<ShapeStyle>) =>
    updateNode(selectedNode.id, { style: { ...selectedNode.style, ...patch } })

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.set('file', file)
    fd.set('nodeId', selectedNode.id)
    startTransition(async () => {
      const url = await uploadNodeImage(fd)
      updateNode(selectedNode.id, { imageUrl: url })
    })
    e.target.value = ''
  }

  return (
    <aside className="bg-card border-border flex h-full w-60 flex-col border-l overflow-y-auto">
      <PanelHeader label={TYPE_LABELS[selectedNode.type]} />

      <div className="flex-1 space-y-4 p-4">
        {/* Position & Size */}
        <Section label="Transform">
          <div className="grid grid-cols-2 gap-1.5">
            <NumberInput label="X" value={Math.round(selectedNode.x)} onChange={(v) => update({ x: v })} />
            <NumberInput label="Y" value={Math.round(selectedNode.y)} onChange={(v) => update({ y: v })} />
            <NumberInput label="W" value={Math.round(selectedNode.width)} onChange={(v) => update({ width: Math.max(20, v) })} />
            <NumberInput label="H" value={Math.round(selectedNode.height)} onChange={(v) => update({ height: Math.max(20, v) })} />
          </div>
        </Section>

        {/* Fill */}
        <Section label="Fill">
          <ColorInput
            value={selectedNode.style.fill}
            onChange={(v) => updateStyle({ fill: v })}
          />
        </Section>

        {/* Stroke */}
        <Section label="Border">
          <div className="flex items-center gap-2">
            <ColorInput
              value={selectedNode.style.stroke}
              onChange={(v) => updateStyle({ stroke: v })}
            />
            <NumberInput
              label="W"
              value={selectedNode.style.strokeWidth}
              onChange={(v) => updateStyle({ strokeWidth: Math.max(0, v) })}
              min={0}
              max={20}
            />
          </div>
        </Section>

        {/* Opacity */}
        <Section label="Opacity">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={selectedNode.style.opacity}
              onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
              className="h-1.5 flex-1 cursor-pointer accent-blue-500"
            />
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
              {Math.round(selectedNode.style.opacity * 100)}%
            </span>
          </div>
        </Section>

        {/* Typography */}
        <Section label="Typography">
          <div className="space-y-2">
            <NumberInput
              label="Size"
              value={selectedNode.style.fontSize}
              onChange={(v) => updateStyle({ fontSize: Math.max(8, v) })}
              min={8}
              max={96}
            />
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateStyle({ textAlign: align })}
                  className={[
                    'flex-1 rounded py-1 text-xs transition-colors',
                    selectedNode.style.textAlign === align
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {([
                { weight: '400', label: 'Regular' },
                { weight: '600', label: 'Semi' },
                { weight: '700', label: 'Bold' },
              ] as const).map(({ weight, label }) => (
                <button
                  key={weight}
                  onClick={() => updateStyle({ fontWeight: weight })}
                  className={[
                    'flex-1 rounded py-1 text-xs transition-colors',
                    selectedNode.style.fontWeight === weight
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Shadow */}
        <Section label="Effects">
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-xs text-muted-foreground">Shadow</span>
            <div
              onClick={() => updateStyle({ shadow: !selectedNode.style.shadow })}
              className={[
                'relative h-4 w-7 rounded-full transition-colors',
                selectedNode.style.shadow ? 'bg-blue-500' : 'bg-muted',
              ].join(' ')}
            >
              <div
                className={[
                  'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
                  selectedNode.style.shadow ? 'translate-x-3.5' : 'translate-x-0.5',
                ].join(' ')}
              />
            </div>
          </label>
        </Section>

        {selectedNode.type === 'image-block' && (
          <Section label="Image">
            <input
              ref={imgInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageFile}
            />
            <button
              onClick={() => imgInputRef.current?.click()}
              className="w-full rounded bg-muted py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {selectedNode.imageUrl ? 'Change image' : 'Upload image'}
            </button>
          </Section>
        )}

        <button
          onClick={() => removeNodes([selectedNode.id])}
          className="w-full rounded bg-destructive/10 py-1.5 text-xs text-destructive hover:bg-destructive/20 transition-colors"
        >
          Delete shape
        </button>
      </div>
    </aside>
  )
}

function PanelHeader({ label = 'Properties' }: { label?: string }) {
  return (
    <div className="border-border border-b px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-5 shrink-0 text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="bg-muted border-border h-7 w-full rounded border px-2 text-xs tabular-nums outline-none focus:border-blue-500"
      />
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded border border-border">
        <input
          type="color"
          value={value === 'transparent' ? '#ffffff' : value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-[-4px] h-[calc(100%+8px)] w-[calc(100%+8px)] cursor-pointer border-0 p-0"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-muted border-border h-7 flex-1 rounded border px-2 font-mono text-xs outline-none focus:border-blue-500"
        spellCheck={false}
      />
    </div>
  )
}
