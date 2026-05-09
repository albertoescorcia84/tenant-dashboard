'use client'

import { useEffect, useState } from 'react'
import type { Tenant } from '../page'

interface Customer {
  id: string
  full_name: string
  phone_number: string
  email: string | null
  tenant_specific_status: string | null
  address_line_1: string | null
  city: string | null
  state: string | null
}

interface Props {
  tenant: Tenant
  onClose: () => void
}

export default function CustomersModal({ tenant, onClose }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')

  useEffect(() => {
    fetch(`/api/customers?tenant_id=${tenant.id}`)
      .then(r => r.json())
      .then(d => setCustomers(d.customers ?? []))
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false))
  }, [tenant.id])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone_number?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div
        className="bg-panel border border-border rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl animate-fade-up"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-text font-bold text-base" style={{ fontFamily: 'var(--font-display)' }}>
              {tenant.brand_name}
            </h3>
            <p className="text-dim text-xs">
              {loading ? 'Loading…' : `${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={onClose} className="text-dim hover:text-text transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        {!loading && customers.length > 0 && (
          <div className="px-5 py-3 border-b border-border shrink-0">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email…"
              className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="flex flex-col gap-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-40 text-red text-sm">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-dim text-sm gap-2">
              {search ? (
                <>
                  <p>No results for "{search}"</p>
                  <button onClick={() => setSearch('')} className="text-accent text-xs hover:underline">Clear search</button>
                </>
              ) : (
                <p>No customers yet for this restaurant.</p>
              )}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="divide-y divide-border">
              {filtered.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-card transition-colors animate-slide-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
                    {c.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text font-medium text-sm truncate">{c.full_name || '—'}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-dim text-xs truncate">{c.phone_number}</span>
                      {c.email && <span className="text-dim text-xs truncate hidden sm:block">{c.email}</span>}
                    </div>
                    {c.address_line_1 && (
                      <p className="text-muted text-xs mt-0.5 truncate">
                        📍 {[c.address_line_1, c.city, c.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${
                    c.tenant_specific_status === 'Active'
                      ? 'bg-green/10 text-green border-green/20'
                      : 'bg-muted/10 text-dim border-border'
                  }`}>
                    {c.tenant_specific_status ?? 'Active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
