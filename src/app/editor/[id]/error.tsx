'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditorError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[Editor error]', error)
  }, [error])

  return (
    <div className="bg-background flex h-screen flex-col items-center justify-center gap-4">
      <AlertTriangle className="text-destructive h-10 w-10" />
      <h1 className="text-lg font-semibold">Could not load editor</h1>
      <p className="text-muted-foreground max-w-sm text-center text-sm">{error.message}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={unstable_retry}>
          Try again
        </Button>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
