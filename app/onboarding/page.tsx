'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PhoneInput from '../components/PhoneInput'

const PASSWORD_RULES = [
  { label: 'At least 8 characters',           test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',       test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',       test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',                 test: (p: string) => /\d/.test(p) },
  { label: 'One special character (!@#$%...)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

function OnboardingForm() {
  const params  = useSearchParams()
  const router  = useRouter()
  const token   = params.get('token') ?? ''

  const [tokenState, setTokenState] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [tokenError, setTokenError] = useState('')
  const [userData, setUserData]     = useState<{ email: string; full_name: string } | null>(null)
  const [username, setUsername]     = useState('')
  const [phone, setPhone]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)

  useEffect(() => {
    if (!token) { setTokenState('invalid'); setTokenError('No invitation token found.'); return }
    fetch(`/api/onboarding?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid) { setUserData({ email: d.email, full_name: d.full_name }); setTokenState('valid') }
        else { setTokenState('invalid'); setTokenError(d.error ?? 'Invalid invitation.') }
      })
      .catch(() => { setTokenState('invalid'); setTokenError('Could not validate invitation.') })
  }, [token])

  async function handleSubmit() {
    setError('')
    const phoneDigits = phone.replace(/\D/g, '')
    if (!username)              { setError('Username is required.'); return }
    if (phoneDigits.length < 7) { setError('Please enter a valid phone number.'); return }
    if (!password || !confirm)  { setError('Password fields are required.'); return }
    if (password !== confirm)   { setError('Passwords do not match.'); return }
    if (!PASSWORD_RULES.every(r => r.test(password))) {
      setError('Password does not meet all requirements.'); return
    }

    setLoading(true)
    try {
      const res  = await fetch('/api/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, username, phone_number: phone, password, confirm_password: confirm }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (tokenState === 'loading') return <div className="text-dim text-sm text-center">Validating your invitation…</div>

  if (tokenState === 'invalid') return (
    <div className="text-center">
      <div className="text-4xl mb-4">🔗</div>
      <h2 className="text-text font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>Invalid Invitation</h2>
      <p className="text-dim text-sm mb-4">{tokenError}</p>
      <p className="text-dim text-xs">Please contact your administrator to request a new invitation.</p>
    </div>
  )

  if (done) return (
    <div className="text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-text font-bold text-xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>Account Ready!</h2>
      <p className="text-dim text-sm mb-6">Your account has been activated. Check your email for a confirmation.</p>
      <button onClick={() => router.push('/login')} className="px-6 py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-all">
        Go to Login →
      </button>
    </div>
  )

  return (
    <>
      <div className="mb-6 text-center">
        <p className="text-dim text-sm">Welcome, <strong className="text-text">{userData?.full_name}</strong></p>
        <p className="text-muted text-xs mt-1">{userData?.email}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
            placeholder="john.doe"
            className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">Phone Number</label>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            placeholder="Phone number"
          />
        </div>

        <div>
          <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
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
          <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={`w-full bg-panel border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 transition-all ${
              confirm && confirm !== password
                ? 'border-red focus:ring-red/30'
                : 'border-border focus:ring-accent/30 focus:border-accent'
            }`}
          />
        </div>

        {error && (
          <div className="bg-red/10 border border-red/20 rounded-xl px-4 py-3 text-red text-sm">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? 'Setting up your account…' : 'Complete Setup →'}
        </button>
      </div>
    </>
  )
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white text-xl font-bold mx-auto mb-4" style={{ fontFamily: 'var(--font-display)' }}>T</div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'var(--font-display)' }}>Complete Your Account</h1>
          <p className="text-dim text-sm mt-1">Set up your credentials to get started.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8">
          <Suspense fallback={<div className="text-dim text-sm text-center">Loading…</div>}>
            <OnboardingForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
