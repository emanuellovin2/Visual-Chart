'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useCollaborationStore, getCollabColor } from '@/store/useCollaborationStore'
import type { CollabEvent, CollaboratorPresence } from '@/types/realtime'
import type { CanvasNode, CanvasEdge } from '@/types'

interface UseRealtimeCollaborationOptions {
  projectId: string
  userId: string
  userName: string
  avatarUrl: string | null
}

export function useRealtimeCollaboration({
  projectId,
  userId,
  userName,
  avatarUrl,
}: UseRealtimeCollaborationOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isApplyingRemoteRef = useRef(false)
  const { setConnected, upsertCollaborator, removeCollaborator, updateCursor, clearCollaborators } =
    useCollaborationStore()

  const myColor = getCollabColor(userId)

  const broadcast = useCallback(
    (event: Omit<CollabEvent, 'senderId'>) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'canvas',
        payload: { ...event, senderId: userId },
      })
    },
    [userId]
  )

  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'cursor',
        payload: { type: 'cursor_moved', x, y, senderId: userId },
      })
    },
    [userId]
  )

  // Register cursor broadcaster so CanvasContainer can call it without prop drilling
  useEffect(() => {
    useCollaborationStore.getState().setBroadcastCursor(broadcastCursor)
    return () => {
      useCollaborationStore.getState().setBroadcastCursor(null)
    }
  }, [broadcastCursor])

  useEffect(() => {
    const sb = createClient()

    const channel = sb.channel(`project:${projectId}`, {
      config: { presence: { key: userId } },
    })

    channelRef.current = channel

    // ── Presence ──────────────────────────────────────────────────────────────

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<CollaboratorPresence>()
      Object.entries(state).forEach(([presenceKey, presences]) => {
        const p = presences[0]
        if (presenceKey !== userId && p) {
          upsertCollaborator({
            userId: presenceKey,
            userName: p.userName,
            avatarUrl: p.avatarUrl,
            color: getCollabColor(presenceKey),
            cursorX: p.cursorX ?? 0,
            cursorY: p.cursorY ?? 0,
            onlineAt: p.onlineAt,
          })
        }
      })
    })

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (key === userId) return
      const p = newPresences[0] as unknown as CollaboratorPresence | undefined
      if (!p) return
      upsertCollaborator({
        userId: key,
        userName: p.userName,
        avatarUrl: p.avatarUrl,
        color: getCollabColor(key),
        cursorX: 0,
        cursorY: 0,
        onlineAt: p.onlineAt,
      })
    })

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      if (key !== userId) removeCollaborator(key)
    })

    // ── Canvas events ──────────────────────────────────────────────────────────

    channel.on('broadcast', { event: 'canvas' }, ({ payload }: { payload: CollabEvent }) => {
      if (payload.senderId === userId) return
      isApplyingRemoteRef.current = true
      const store = useCanvasStore.getState()

      switch (payload.type) {
        case 'node_added':
          if (!store.nodes.find((n) => n.id === (payload.node as CanvasNode).id)) {
            store.addNode(payload.node as CanvasNode)
          }
          break
        case 'node_updated':
          store.updateNode(payload.nodeId, payload.updates)
          break
        case 'node_removed':
          store.removeNodes(payload.nodeIds)
          break
        case 'edge_added':
          if (!store.edges.find((e) => e.id === (payload.edge as CanvasEdge).id)) {
            store.addEdge(payload.edge as CanvasEdge)
          }
          break
        case 'edge_removed':
          store.removeEdges(payload.edgeIds)
          break
      }

      isApplyingRemoteRef.current = false
    })

    // ── Cursor events ──────────────────────────────────────────────────────────

    channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if ((payload as CollabEvent).senderId === userId) return
      const p = payload as { senderId: string; x: number; y: number }
      updateCursor(p.senderId, p.x, p.y)
    })

    // ── Subscribe & track presence ─────────────────────────────────────────────

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setConnected(true)
        await channel.track({
          userName,
          avatarUrl,
          color: myColor,
          cursorX: 0,
          cursorY: 0,
          onlineAt: new Date().toISOString(),
        })
      }
    })

    return () => {
      channel.unsubscribe()
      sb.removeChannel(channel)
      setConnected(false)
      clearCollaborators()
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId])

  return { broadcast, broadcastCursor, isApplyingRemoteRef }
}
