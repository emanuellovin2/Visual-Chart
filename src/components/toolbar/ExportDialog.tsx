'use client'

import { useState } from 'react'
import { Download, FileImage, FileCode2, FileJson, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCanvasStore } from '@/store/useCanvasStore'
import { exportSvg, exportPng, exportPdf, exportJson } from '@/lib/export'

type Format = 'png' | 'svg' | 'pdf' | 'json'
type Scale = 1 | 2 | 3

interface ExportDialogProps {
  projectTitle: string
  onClose: () => void
}

const FORMATS: { id: Format; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'png', label: 'PNG', desc: 'Raster image, great for sharing', icon: FileImage },
  { id: 'svg', label: 'SVG', desc: 'Vector, scales infinitely', icon: FileCode2 },
  { id: 'pdf', label: 'PDF', desc: 'Print-ready document', icon: FileText },
  { id: 'json', label: 'JSON', desc: 'Raw diagram data', icon: FileJson },
]

export function ExportDialog({ projectTitle, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<Format>('png')
  const [scale, setScale] = useState<Scale>(2)
  const [loading, setLoading] = useState(false)

  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)

  const slug =
    projectTitle
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'diagram'

  const handleExport = async () => {
    setLoading(true)
    try {
      switch (format) {
        case 'svg':
          exportSvg(nodes, edges, `${slug}.svg`)
          break
        case 'png':
          await exportPng(nodes, edges, `${slug}.png`, scale)
          break
        case 'pdf':
          await exportPdf(nodes, edges, `${slug}.pdf`, scale)
          break
        case 'json':
          exportJson(nodes, edges, `${slug}.json`)
          break
      }
      toast.success(`Exported as ${format.toUpperCase()}`)
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="bg-card border-border relative w-[360px] rounded-xl border p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Export diagram</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Format picker */}
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map(({ id, label, desc, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFormat(id)}
              className={[
                'flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors',
                format === id
                  ? 'border-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:bg-accent',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span className="text-xs leading-tight">{desc}</span>
            </button>
          ))}
        </div>

        {/* Scale picker — PNG and PDF only */}
        {(format === 'png' || format === 'pdf') && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium">Resolution</span>
            <div className="flex gap-2">
              {([1, 2, 3] as Scale[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={[
                    'flex-1 rounded-lg border py-1.5 text-sm font-medium transition-colors',
                    scale === s
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent',
                  ].join(' ')}
                >
                  {s}×
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              {scale}× = {scale * 100}% — {scale === 1 ? 'screen resolution' : scale === 2 ? 'retina quality' : 'print quality'}
            </p>
          </div>
        )}

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export {format.toUpperCase()}
        </button>
      </div>
    </div>
  )
}
