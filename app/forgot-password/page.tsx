'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-up">

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white text-xl font-bold mx-auto mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            T
          </div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'var(--font-display)' }}>
            Forgot Password
          </h1>
          <p className="text-dim text-sm mt-1">Enter your email to receive a reset link.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <p className="text-text text-sm leading-relaxed">
                If this email belongs to an active account, you will receive a password reset link shortly. Please check your inbox and spam folder.
              </p>
              <Link href="/login" className="mt-6 inline-block text-accent text-sm hover:underline">
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send Reset Link →'}
              </button>

              <Link href="/login" className="text-center text-dim text-sm hover:text-text transition-colors">
                ← Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}