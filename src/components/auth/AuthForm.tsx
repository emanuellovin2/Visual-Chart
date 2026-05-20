'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { login, register } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/client'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = mode === 'login' ? await login(formData) : await register(formData)
      if (result?.error) setError(result.error)
      if (result && 'success' in result) setSuccess(result.success as string)
    })
  }

  async function handleGoogle() {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) setError(error.message)
    })
  }

  const isLogin = mode === 'login'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-sm space-y-6"
    >
      {/* Logo */}
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M17.5 17.5L14 14M17.5 17.5L21 21M17.5 17.5L21 14M17.5 17.5L14 21" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isLogin ? 'Sign in to your Graphify account' : 'Start building diagrams for free'}
        </p>
      </div>

      {/* Google OAuth */}
      <form action={handleGoogle}>
        <Button
          type="submit"
          variant="outline"
          className="w-full gap-2"
          disabled={isPending}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>
      </form>

      <div className="relative">
        <Separator />
        <span className="bg-background text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
          or
        </span>
      </div>

      {/* Email form */}
      <form action={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="John Doe"
              required
              disabled={isPending}
              className="bg-background"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
            className="bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {isLogin && (
              <Link href="/auth/reset-password" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            disabled={isPending}
            className="bg-background"
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}

        {success && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400"
          >
            {success}
          </motion.p>
        )}

        <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={isPending}>
          {isPending ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <Link
          href={isLogin ? '/auth/register' : '/auth/login'}
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </Link>
      </p>
    </motion.div>
  )
}
