'use client'

import { Suspense, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/AuthShell'
import { PrimaryButton } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { notify, getErrorMessage } from '@/lib/toast'
import { validatePassword } from '@/lib/validations/auth'

const inputCls =
  'w-full rounded-lg bg-base-100 border border-base-300 px-4 py-2.5 text-base-content focus:border-primary focus:outline-none'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      const pwError = validatePassword(password)
      if (pwError) return setError(pwError)
      if (password !== confirm) return setError('Passwords do not match')

      setLoading(true)
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Something went wrong')

        notify.success('Password updated. Please log in.')
        router.push('/login')
      } catch (err) {
        const message = getErrorMessage(err, 'Could not reset password')
        setError(message)
        notify.error(message)
      } finally {
        setLoading(false)
      }
    },
    [token, password, confirm, router]
  )

  if (!token) {
    return (
      <AuthShell>
        <div className="w-full max-w-md rounded-xl bg-base-100 p-8 border border-base-300 shadow-2xl space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Invalid link</h2>
          <p className="text-sm text-base-content/70">This reset link is missing or incomplete.</p>
          <Link href="/forgot-password" className="block text-center text-sm text-primary hover:underline">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl bg-base-100 p-8 border border-base-300 shadow-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Set a new password</h2>
        {error && (
          <div className="mb-4 rounded bg-error/10 p-3 text-sm text-error border border-error/20">
            {error}
            {error.includes('invalid or has expired') && (
              <>
                {' '}
                <Link href="/forgot-password" className="underline">
                  Request a new link
                </Link>
              </>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-1">New password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              className={inputCls}
            />
            <p className="mt-1 text-xs text-base-content/50">At least 8 characters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-1">Confirm password</label>
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className={inputCls}
            />
          </div>
          <PrimaryButton type="submit" loading={loading} className="w-full">
            Update password
          </PrimaryButton>
        </form>
      </div>
    </AuthShell>
  )
}