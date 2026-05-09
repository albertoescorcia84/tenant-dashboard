'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const PASSWORD_RULES = [
  { label: 'At least 8 characters',           test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',       test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',       test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',                 test: (p: string) => /\d/.test(p) },
  { label: 'One special character (!@#$%...)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token  = params.get('token') ?? ''

  const [tokenState, setTokenState] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [tokenError, setTokenError] = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)

  useEffect(() => {
    if (!token) { setTokenState('invalid'); setTokenError('No reset token found.'); return }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid) setTokenState('valid')
        else { setTokenState('invalid'); setTokenError(d.error ?? 'Invalid reset link.') }
      })
      .catch(() => { setTokenState('invalid'); setTokenError('Could not validate reset link.') })
  }, [token])

  async function handleSubmit() {
    setError('')
    if (!password || !confirm) { setError('Both fields are required.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }
    if (!PASSWORD_RULES.every(r => r.test(password))) { setError('Password does not meet the requirements.'); return }

    setLoading(true)
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password, confirm_password: confirm }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (tokenState === 'loading') return <div className="text-dim text-sm text-center">Validating reset link…</div>

  if (tokenState === 'invalid') return (
    <div className="text-center">
      <div className="text-4xl mb-4">🔗</div>
      <p className="text-text font-bold mb-2">Invalid Reset Link</p>
      <p className="text-dim text-sm mb-4">{tokenError}</p>
      <button onClick={() => router.push('/forgot-password')} className="text-accent text-sm hover:underline">
        Request a new reset link →
      </button>
    </div>
  )

  if (done) return (
    <div className="text-center">
      <div className="text-5xl mb-4">✅</div>
      <p className="text-text font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>Password Changed!</p>
      <p className="text-dim text-sm mb-6">Your password has been updated. You can now sign in with your new password.</p>
      <button onClick={() => router.push('/login')} className="px-6 py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-all">
        Go to Login →
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">New Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoFocus
          className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" />
        {password && (
          <ul className="mt-2 flex flex-col gap-1">
            {PASSWORD_RULES.map(r => (
              <li key={r.label} className={`flex items-center gap-2 text-xs ${r.test(password) ? 'text-green' : 'text-dim'}`}>
                <span>{r.test(password) ? '✓' : '○'}</span>{r.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">Confirm New Password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
          className={`w-full bg-panel border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 transition-all ${
            confirm && confirm !== password ? 'border-red focus:ring-red/30' : 'border-border focus:ring-accent/30 focus:border-accent'}`} />
      </div>
      {error && <div className="bg-red/10 border border-red/20 rounded-xl px-4 py-3 text-red text-sm">{error}</div>}
      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50">
        {loading ? 'Updating password…' : 'Set New Password →'}
      </button>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white text-xl font-bold mx-auto mb-4" style={{ fontFamily: 'var(--font-display)' }}>T</div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'var(--font-display)' }}>Reset Password</h1>
          <p className="text-dim text-sm mt-1">Choose a new secure password.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8">
          <Suspense fallback={<div className="text-dim text-sm text-center">Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}