'use client'

import { useState, useTransition } from 'react'
import { X, Link2, Check, Globe, Lock } from 'lucide-react'
import { setProjectVisibility } from '@/app/editor/[id]/actions'

interface ShareDialogProps {
  projectId: string
  projectTitle: string
  initialIsPublic: boolean
  onClose: () => void
}

export function ShareDialog({ projectId, projectTitle, initialIsPublic, onClose }: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${projectId}`
    : `/share/${projectId}`

  const handleToggle = (next: boolean) => {
    setIsPublic(next)
    startTransition(async () => {
      await setProjectVisibility(projectId, next)
    })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="bg-card border-border relative w-[400px] rounded-xl border p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Share diagram</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Project name */}
        <p className="text-sm text-muted-foreground truncate">
          <span className="font-medium text-foreground">{projectTitle}</span>
        </p>

        {/* Visibility toggle */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Visibility</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleToggle(false)}
              disabled={isPending}
              className={[
                'flex items-center gap-2 rounded-lg border p-3 text-left transition-colors',
                !isPublic
                  ? 'border-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:bg-accent',
              ].join(' ')}
            >
              <Lock className="h-4 w-4 shrink-0" />
              <div>
                <div className="text-sm font-medium text-foreground">Private</div>
                <div className="text-xs text-muted-foreground">Only you can view</div>
              </div>
            </button>
            <button
              onClick={() => handleToggle(true)}
              disabled={isPending}
              className={[
                'flex items-center gap-2 rounded-lg border p-3 text-left transition-colors',
                isPublic
                  ? 'border-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:bg-accent',
              ].join(' ')}
            >
              <Globe className="h-4 w-4 shrink-0" />
              <div>
                <div className="text-sm font-medium text-foreground">Public</div>
                <div className="text-xs text-muted-foreground">Anyone with the link</div>
              </div>
            </button>
          </div>
        </div>

        {/* Link copy */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Share link</span>
          <div className="flex gap-2 items-center">
            <div className={[
              'flex-1 truncate rounded-lg border px-3 py-2 text-xs font-mono transition-colors',
              isPublic ? 'border-border bg-muted text-foreground' : 'border-border bg-muted text-muted-foreground/50',
            ].join(' ')}>
              {shareUrl}
            </div>
            <button
              onClick={handleCopy}
              disabled={!isPublic}
              title={isPublic ? 'Copy link' : 'Make public first'}
              className={[
                'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors shrink-0',
                isPublic
                  ? 'border-border hover:bg-accent text-foreground'
                  : 'border-border text-muted-foreground/30 cursor-not-allowed',
              ].join(' ')}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
            </button>
          </div>
          {!isPublic && (
            <p className="text-xs text-muted-foreground">
              Enable public access to generate a shareable link.
            </p>
          )}
          {isPublic && (
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the diagram (read-only).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
