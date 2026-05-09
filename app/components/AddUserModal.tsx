'use client'

import { useEffect, useState } from 'react'

interface Tenant {
  id:         string
  brand_name: string
  status:     string
}

interface Props {
  onClose:   () => void
  onSuccess: () => void
}

export default function AddUserModal({ onClose, onSuccess }: Props) {
  const [tenants, setTenants]   = useState<Tenant[]>([])
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [role, setRole]         = useState<'admin' | 'tenant'>('tenant')
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/tenants?limit=100')
      .then(r => r.json())
      .then(d => setTenants((d.tenants ?? []).filter((t: Tenant) => t.status === 'Active')))
  }, [])

  async function handleSubmit() {
    setError('')
    if (!fullName || !email) { setError('Full name and email are required.'); return }
    if (role === 'tenant' && !tenantId) { setError('Please select a restaurant.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          full_name: fullName,
          email,
          role,
          tenant_id: role === 'tenant' ? tenantId : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create user.'); return }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div
        className="bg-panel border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="text-text font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            Add New User
          </h2>
          <button onClick={onClose} className="text-dim hover:text-text transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-5">
          <div>
            <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">Role</label>
            <div className="flex gap-3">
              {(['tenant', 'admin'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => { setRole(r); if (r === 'admin') setTenantId('') }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    role === r
                      ? 'bg-accent text-white border-accent'
                      : 'bg-card text-dim border-border hover:border-muted'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {role === 'tenant' && (
            <div>
              <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">Restaurant</label>
              <select
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              >
                <option value="">Select a restaurant…</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.brand_name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red/10 border border-red/20 rounded-xl px-4 py-3 text-red text-sm">
              {error}
            </div>
          )}

          <p className="text-dim text-xs">
            An invitation email will be sent to the user with a link to complete their account setup. The link expires in 24 hours.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-panel border border-border text-dim rounded-xl text-sm font-semibold hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create & Send Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}