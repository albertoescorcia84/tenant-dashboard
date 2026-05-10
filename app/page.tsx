'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from './components/Header'
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
  const router = useRouter()
  const [tenants, setTenants]       = useState<Tenant[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [chatTenant, setChatTenant] = useState<Tenant | null>(null)
  const [custTenant, setCustTenant] = useState<Tenant | null>(null)
  const [userRole, setUserRole]     = useState<string>('')

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.role) setUserRole(d.user.role) })
  }, [])

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
      <Header totalRestaurants={pagination?.total} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Restaurants
            </h1>
            <p className="text-dim text-sm">Manage tenants, chat with their AI, and view customers.</p>
          </div>
          {userRole === 'admin' && (
            <button
              onClick={() => router.push('/tenants/new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 active:scale-[0.97] transition-all shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="hidden sm:inline">New Tenant</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

        <TenantGrid
          tenants={tenants}
          loading={loading}
          userRole={userRole}
          onChat={setChatTenant}
          onCustomers={setCustTenant}
          onEdit={t => router.push(`/tenants/${t.id}`)}
        />

        {pagination && pagination.pages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-border text-dim text-sm hover:text-text hover:border-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <div className="flex gap-1 flex-wrap justify-center">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page ? 'bg-accent text-white' : 'text-dim hover:text-text hover:bg-card'
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

      {chatTenant && <ChatModal tenant={chatTenant} onClose={() => setChatTenant(null)} />}
      {custTenant && <CustomersModal tenant={custTenant} onClose={() => setCustTenant(null)} />}
    </div>
  )
}