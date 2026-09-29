'use client'

import { Suspense, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PrimaryButton } from '@/components/ui/Button'
import { notify, getErrorMessage } from '@/lib/toast'
import { getSafeNextPath } from '@/lib/safe-redirect'

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
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
      } catch (err: any) {
        setError(err.message)
        notify.error(getErrorMessage(err, 'Signup failed'))
      } finally {
        setLoading(false)
      }
    },
    [router, name, email, password, loginHref]
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-md rounded-xl bg-gray-900 p-8 border border-gray-800 shadow-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Create Account</h2>
        {error && <div className="mb-4 rounded bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{error}</div>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <PrimaryButton type="submit" loading={loading} className="w-full">
            Sign Up
          </PrimaryButton>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href={loginHref} className="text-indigo-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}