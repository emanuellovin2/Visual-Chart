'use client'

import { useTransition } from 'react'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  className?: string
  variant?: 'default' | 'ghost' | 'outline' | 'destructive'
}

export function LogoutButton({ className, variant = 'ghost' }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant={variant}
      className={className}
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
    >
      {isPending ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
