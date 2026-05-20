'use client'

import { useState, useEffect, useActionState, startTransition } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectCard } from './ProjectCard'
import { createProjectAction } from '@/app/dashboard/actions'
import type { Project } from '@/types'

interface ProjectsGridProps {
  projects: Project[]
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  const [query, setQuery] = useState('')
  const [actionState, action, isPending] = useActionState(createProjectAction, undefined)

  useEffect(() => {
    if (actionState?.error) toast.error(actionState.error)
  }, [actionState])

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  )

  const recent = filtered.slice(0, 4)
  const allProjects = filtered

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search projects..."
            className="pl-8 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={() => startTransition(action)}
          disabled={isPending}
          className="gap-1.5 bg-violet-600 hover:bg-violet-700"
        >
          <Plus size={16} />
          New project
        </Button>
      </div>

      {/* Recent */}
      {!query && recent.length > 0 && (
        <section>
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-widest">
            Recent
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence>
              {recent.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* All projects */}
      <section>
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-widest">
          {query ? `Results (${filtered.length})` : 'All projects'}
        </h2>

        {allProjects.length === 0 ? (
          <EmptyState query={query} onNew={() => startTransition(action)} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <AnimatePresence>
              {allProjects.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  )
}

function EmptyState({ query, onNew }: { query: string; onNew: () => void }) {
  if (query) {
    return (
      <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground text-sm">No projects match &ldquo;{query}&rdquo;</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center"
    >
      <div className="bg-muted mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
      <p className="mb-1 text-sm font-medium">No projects yet</p>
      <p className="text-muted-foreground mb-4 text-sm">Create your first diagram to get started.</p>
      <Button onClick={onNew} size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700">
        <Plus size={14} /> New project
      </Button>
    </motion.div>
  )
}

export function ProjectsGridSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
