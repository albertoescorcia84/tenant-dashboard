'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ identifier, password }),
      })
      const data = await res.json()

      if (!res.ok) { setError(data.error ?? 'Login failed.'); return }

      router.push('/')
      router.refresh()
    } catch {
      setError('Connection error. Please try again.')
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
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'var(--font-display)' }}>TenantOS</h1>
          <p className="text-dim text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div>
              <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="alberto.escorcia"
                required
                autoFocus
                className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-dim text-xs font-medium uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-accent text-xs hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            {error && (
              <div className="bg-red/10 border border-red/20 rounded-xl px-4 py-3 text-red text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in…
                </>
              ) : 'Sign In →'}
            </button>

          </form>
        </div>

        <p className="text-center text-muted text-xs mt-6">
          Session expires after 30 minutes of inactivity.
        </p>
      </div>
    </div>
  )
}