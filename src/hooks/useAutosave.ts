'use client'

import { useEffect, useRef } from 'react'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useEditorStore } from '@/store/useEditorStore'
import { saveCanvas } from '@/app/editor/[id]/actions'

export function useAutosave(projectId: string) {
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const unsub = useCanvasStore.subscribe((state, prev) => {
      if (state.nodes === prev.nodes && state.edges === prev.edges) return

      setSaveStatus('unsaved')

      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return
        setSaveStatus('saving')
        try {
          await saveCanvas(projectId, state.nodes, state.edges)
          if (mountedRef.current) setSaveStatus('saved')
        } catch {
          if (mountedRef.current) setSaveStatus('unsaved')
        }
      }, 1500)
    })

    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [projectId, setSaveStatus])
}
