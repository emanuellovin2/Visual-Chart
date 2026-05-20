'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal, Pencil, Copy, Trash2, ExternalLink } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { renameProjectAction, duplicateProjectAction, deleteProjectAction } from '@/app/dashboard/actions'
import type { Project } from '@/types'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(project.title)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  function handleOpen() {
    if (!isRenaming) router.push(`/editor/${project.id}`)
  }

  function handleRenameSubmit() {
    setIsRenaming(false)
    if (renameValue === project.title) return
    startTransition(async () => { await renameProjectAction(project.id, renameValue) })
  }

  function handleDuplicate() {
    startTransition(async () => { await duplicateProjectAction(project.id) })
  }

  function handleDelete() {
    startTransition(async () => { await deleteProjectAction(project.id) })
  }

  const timeAgo = formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })

  return (
    <>
      <div
        className={`group bg-card border-border hover:border-border/80 relative flex cursor-pointer flex-col rounded-xl border transition-all duration-150 hover:shadow-lg ${isPending ? 'opacity-50' : ''}`}
        onClick={handleOpen}
      >
        {/* Thumbnail */}
        <div className="bg-muted relative flex h-36 items-center justify-center overflow-hidden rounded-t-xl">
          {project.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnail_url} alt={project.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
            <ExternalLink size={18} className="text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start justify-between gap-2 p-3" onClick={(e) => e.stopPropagation()}>
          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit()
                  if (e.key === 'Escape') { setRenameValue(project.title); setIsRenaming(false) }
                }}
                autoFocus
                className="h-7 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="truncate text-sm font-medium">{project.title}</p>
            )}
            <p className="text-muted-foreground mt-0.5 text-xs">{timeAgo}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              render={
                <button className="ring-offset-background focus-visible:ring-ring inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" />
              }
            >
              <MoreHorizontal size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => { setIsRenaming(true); setRenameValue(project.title) }}>
                <Pencil size={13} className="mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy size={13} className="mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={13} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{project.title}&rdquo; will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
