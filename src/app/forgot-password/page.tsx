'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/AuthShell'
import { PrimaryButton } from '@/components/ui/Button'
import { notify, getErrorMessage } from '@/lib/toast'
import { authInputCls } from '@/components/ui/inputs'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      setLoading(true)
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Something went wrong')
        setSent(true)
      } catch (err) {
        const message = getErrorMessage(err, 'Could not send reset link')
        setError(message)
        notify.error(message)
      } finally {
        setLoading(false)
      }
    },
    [email]
  )

  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl bg-base-100 p-8 border border-base-300 shadow-2xl">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Forgot password?</h2>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-base-content/70">
              If an account exists for <span className="font-medium text-base-content">{email}</span>, a reset link
              has been sent. The link expires in 30 minutes.
            </p>
            <Link href="/login" className="block text-center text-sm text-primary hover:underline">
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-base-content/60">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            {error && (
              <div role="alert" className="mb-4 rounded bg-error/10 p-3 text-sm text-error border border-error/20">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-base-content/70 mb-1">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={authInputCls}
                />
              </div>
              <PrimaryButton type="submit" loading={loading} className="w-full">
                Send reset link
              </PrimaryButton>
            </form>
            <p className="mt-4 text-center text-sm text-base-content/60">
              Remembered it?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthShell>
  )
}
