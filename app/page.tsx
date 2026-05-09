'use client'

import { useEffect, useState, useCallback } from 'react'
import TenantGrid from './components/TenantGrid'
import ChatModal from './components/ChatModal'
import CustomersModal from './components/CustomersModal'

export interface Tenant {
  id: string
  brand_name: string
  legal_name: string
  business_type: string | null
  physical_address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  service_description: string | null
  status: string | null
  email_address: string | null
  phone_number: string
  created_on: string | null
  customer_count: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function Home() {
  const [tenants, setTenants]         = useState<Tenant[]>([])
  const [pagination, setPagination]   = useState<Pagination | null>(null)
  const [page, setPage]               = useState(1)
  const [loading, setLoading]         = useState(true)
  const [chatTenant, setChatTenant]   = useState<Tenant | null>(null)
  const [custTenant, setCustTenant]   = useState<Tenant | null>(null)

  const fetchTenants = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/tenants?page=${p}&limit=12`)
      const data = await res.json()
      setTenants(data.tenants ?? [])
      setPagination(data.pagination ?? null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTenants(page) }, [page, fetchTenants])

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="border-b border-border bg-panel sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              T
            </div>
            <span className="text-text font-semibold text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              TenantOS
            </span>
          </div>
          <div className="flex items-center gap-2 text-dim text-sm">
            {pagination && (
              <span>{pagination.total} restaurant{pagination.total !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Restaurants
          </h1>
          <p className="text-dim text-sm">Manage tenants, chat with their AI, and view customers.</p>
        </div>

        <TenantGrid
          tenants={tenants}
          loading={loading}
          onChat={setChatTenant}
          onCustomers={setCustTenant}
        />

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-border text-dim text-sm hover:text-text hover:border-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-accent text-white'
                      : 'text-dim hover:text-text hover:bg-card'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 rounded-lg border border-border text-dim text-sm hover:text-text hover:border-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {chatTenant && (
        <ChatModal tenant={chatTenant} onClose={() => setChatTenant(null)} />
      )}
      {custTenant && (
        <CustomersModal tenant={custTenant} onClose={() => setCustTenant(null)} />
      )}
    </div>
  )
}
