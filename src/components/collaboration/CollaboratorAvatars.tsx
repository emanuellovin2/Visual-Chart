'use client'

import Image from 'next/image'
import { useCollaborationStore } from '@/store/useCollaborationStore'

export function CollaboratorAvatars() {
  const { collaborators, isConnected } = useCollaborationStore()
  const list = Object.values(collaborators)

  if (!isConnected && list.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      {isConnected && (
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live
        </span>
      )}
      {list.length > 0 && (
        <div className="ml-2 flex -space-x-2">
          {list.slice(0, 5).map((c) => (
            <div
              key={c.userId}
              className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-slate-900"
              style={{ borderColor: c.color }}
              title={c.userName}
            >
              {c.avatarUrl ? (
                <Image
                  src={c.avatarUrl}
                  alt={c.userName}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: c.color }}
                >
                  {c.userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}
          {list.length > 5 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-300 ring-2 ring-slate-900">
              +{list.length - 5}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
