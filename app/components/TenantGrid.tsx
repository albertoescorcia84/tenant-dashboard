'use client'

import type { Tenant } from '../page'

interface Props {
  tenants: Tenant[]
  loading: boolean
  onChat: (t: Tenant) => void
  onCustomers: (t: Tenant) => void
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status?.toLowerCase()
  const cfg =
    s === 'active'   ? { label: 'Active',   cls: 'bg-green/10 text-green border-green/20' } :
    s === 'inactive' ? { label: 'Inactive', cls: 'bg-red/10 text-red border-red/20' } :
                       { label: status ?? 'Unknown', cls: 'bg-amber/10 text-amber border-amber/20' }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  )
}

function TenantCard({ tenant, onChat, onCustomers, idx }: {
  tenant: Tenant
  onChat: () => void
  onCustomers: () => void
  idx: number
}) {
  const address = [tenant.physical_address, tenant.city, tenant.state, tenant.postal_code]
    .filter(Boolean).join(', ')

  return (
    <div
      className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-muted transition-all duration-200 animate-fade-up group"
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-text font-semibold text-base truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {tenant.brand_name}
            </h2>
          </div>
          {tenant.legal_name && tenant.legal_name !== tenant.brand_name && (
            <p className="text-dim text-xs truncate">{tenant.legal_name}</p>
          )}
        </div>
        <StatusBadge status={tenant.status} />
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        {tenant.business_type && (
          <span className="px-2.5 py-1 bg-panel border border-border rounded-lg text-xs text-dim font-medium">
            {tenant.business_type}
          </span>
        )}
        <span className="px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-lg text-xs text-accent font-medium">
          {tenant.customer_count} customer{tenant.customer_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Address */}
      {address && (
        <p className="text-dim text-xs leading-relaxed line-clamp-1">
          📍 {address}
        </p>
      )}

      {/* Description */}
      {tenant.service_description && (
        <p className="text-dim text-xs leading-relaxed line-clamp-3 flex-1">
          {tenant.service_description}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onChat}
          className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Chat
        </button>
        <button
          onClick={onCustomers}
          className="flex-1 py-2.5 bg-panel border border-border text-text rounded-xl text-sm font-semibold hover:bg-card hover:border-muted active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          See Customers
        </button>
      </div>
    </div>
  )
}

export default function TenantGrid({ tenants, loading, onChat, onCustomers }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 h-72 animate-pulse" />
        ))}
      </div>
    )
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-24 text-dim">
        <p className="text-lg mb-2">No restaurants found</p>
        <p className="text-sm">Add tenants to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {tenants.map((t, i) => (
        <TenantCard
          key={t.id}
          tenant={t}
          idx={i}
          onChat={() => onChat(t)}
          onCustomers={() => onCustomers(t)}
        />
      ))}
    </div>
  )
}
