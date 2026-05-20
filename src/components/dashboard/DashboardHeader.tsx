import { logout } from '@/app/auth/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, User } from 'lucide-react'
import type { User as UserType } from '@/types'

interface DashboardHeaderProps {
  user: UserType
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 flex h-14 items-center justify-between border-b px-6 backdrop-blur">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M17.5 17.5L14 14M17.5 17.5L21 21M17.5 17.5L21 14M17.5 17.5L14 21" />
          </svg>
        </div>
        <span className="text-sm font-semibold">Graphify</span>
      </div>

      {/* Profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="ring-offset-background focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? user.email} />
                <AvatarFallback className="bg-violet-600 text-xs text-white">{initials}</AvatarFallback>
              </Avatar>
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{user.full_name ?? 'User'}</p>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User size={13} className="mr-2" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Settings size={13} className="mr-2" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={logout} className="w-full">
            <DropdownMenuItem
              className="text-destructive w-full"
              render={<button type="submit" className="w-full" />}
            >
              <LogOut size={13} className="mr-2" /> Sign out
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
