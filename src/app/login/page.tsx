'use client'

import { Suspense, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PrimaryButton } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { notify, getErrorMessage } from '@/lib/toast'
import { getSafeNextPath } from '@/lib/safe-redirect'
import { AuthShell } from '@/components/auth/AuthShell'

const inputCls =
  'w-full rounded-lg bg-base-100 border border-base-300 px-4 py-2.5 text-base-content focus:border-primary focus:outline-none';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      setLoading(true)

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Something went wrong')
        }

        notify.success('Welcome back!')
        router.push(nextPath ?? '/dashboard')
      } catch (err) {
        const message = getErrorMessage(err, 'Login failed')
        setError(message)
        notify.error(message)
      } finally {
        setLoading(false)
      }
    },
    [router, email, password, nextPath]
  )

  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl bg-base-100 p-8 border border-base-300 shadow-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Welcome Back</h2>
        {error && (
          <div className="mb-4 rounded bg-error/10 p-3 text-sm text-error border border-error/20">{error}</div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-base-content/70">Password</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className={inputCls}
            />
          </div>
          <PrimaryButton type="submit" loading={loading} className="w-full">Log In</PrimaryButton>
        </form>
        <p className="mt-4 text-center text-sm text-base-content/60">
          Don&apos;t have an account?{' '}
          <Link href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'} className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}