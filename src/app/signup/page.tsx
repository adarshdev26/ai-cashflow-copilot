'use client'

import { Suspense, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PrimaryButton } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { notify, getErrorMessage } from '@/lib/ui/toast'
import { getSafeNextPath } from '@/lib/auth/safe-redirect'
import { AuthShell } from '@/components/auth/AuthShell'
import { authInputCls } from '@/components/ui/inputs'
import { usePublicSettings } from '@/features/settings/hooks/use-settings'

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const { data: settings } = usePublicSettings()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = getSafeNextPath(searchParams.get('next'))
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      setLoading(true)

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Something went wrong')
        }

        notify.success('Account created. Please log in.')
        router.push(loginHref)
      } catch (err) {
        const message = getErrorMessage(err, 'Signup failed')
        setError(message)
        notify.error(message)
      } finally {
        setLoading(false)
      }
    },
    [router, name, email, password, loginHref]
  )

  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl bg-base-100 p-8 border border-base-300 shadow-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Create Account</h2>
        {settings?.['auth.signupEnabled'] === false ? (
          <div role="status" className="rounded bg-base-200 p-3 text-sm text-base-content/70">
            New account signups are currently disabled.
          </div>
        ) : (
          <>
        {error && (
          <div role="alert" className="mb-4 rounded bg-error/10 p-3 text-sm text-error border border-error/20">{error}</div>
        )}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-base-content/70 mb-1">Name</label>
            <input id="signup-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={authInputCls} />
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-base-content/70 mb-1">Email</label>
            <input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputCls} />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-base-content/70 mb-1">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              id="signup-password"
              className={authInputCls}
            />
          </div>
          <PrimaryButton type="submit" loading={loading} className="w-full">Sign Up</PrimaryButton>
        </form>
          </>
        )}
        <p className="mt-4 text-center text-sm text-base-content/60">
          Already have an account?{' '}
          <Link href={loginHref} className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </AuthShell>
  )
}
