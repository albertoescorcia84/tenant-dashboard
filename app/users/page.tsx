'use client'

import { useEffect, useState } from 'react'
import Header from '../components/Header'
import AddUserModal from '../components/AddUserModal'

interface User {
  id:          string
  email:       string
  full_name:   string
  username:    string | null
  role:        string
  tenant_id:   string | null
  tenant_name: string | null
  status:      string
  last_access: string | null
  created_at:  string
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    'active':      'bg-green/10 text-green border-green/20',
    'inactive':    'bg-red/10 text-red border-red/20',
    'on boarding': 'bg-amber/10 text-amber border-amber/20',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg[status] ?? 'bg-muted/10 text-dim border-border'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status === 'on boarding' ? 'Onboarding' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function UsersPage() {
  const [users, setUsers]         = useState<User[]>([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchUsers() {
    setLoading(true)
    try {
      const res  = await fetch('/api/users')
      const data = await res.json()
      setUsers(data.users ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  async function toggleStatus(user: User) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    setActionLoading(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u))
        showToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`)
      } else {
        showToast('Failed to update user status.', 'error')
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function resendInvitation(user: User) {
    setActionLoading(user.id + '_resend')
    try {
      const res = await fetch(`/api/users/${user.id}/resend`, { method: 'POST' })
      if (res.ok) {
        showToast('Invitation resent successfully.')
      } else {
        const d = await res.json()
        showToast(d.error ?? 'Failed to resend invitation.', 'error')
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Users
            </h1>
            <p className="text-dim text-sm">Manage platform users and invitations.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 active:scale-[0.97] transition-all flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add User
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col gap-2 p-6">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-panel rounded-xl animate-pulse" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-dim text-sm">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['User', 'Role', 'Tenant', 'Status', 'Last Access', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-dim uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-panel transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
                            {user.full_name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="text-text text-sm font-medium">{user.full_name}</p>
                            <p className="text-dim text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          user.role === 'admin'
                            ? 'bg-accent/10 text-accent border-accent/20'
                            : 'bg-panel text-dim border-border'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-dim text-sm">{user.tenant_name ?? '—'}</td>
                      <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                      <td className="px-5 py-4 text-dim text-xs">
                        {user.last_access
                          ? new Date(user.last_access).toLocaleDateString('en-CA', { dateStyle: 'medium' })
                          : 'Never'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {user.status === 'on boarding' && (
                            <button
                              onClick={() => resendInvitation(user)}
                              disabled={actionLoading === user.id + '_resend'}
                              className="px-3 py-1.5 text-xs font-medium bg-amber/10 text-amber border border-amber/20 rounded-lg hover:bg-amber/20 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === user.id + '_resend' ? '…' : 'Resend Invite'}
                            </button>
                          )}
                          {user.status !== 'on boarding' && (
                            <button
                              onClick={() => toggleStatus(user)}
                              disabled={actionLoading === user.id}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                                user.status === 'active'
                                  ? 'bg-red/10 text-red border-red/20 hover:bg-red/20'
                                  : 'bg-green/10 text-green border-green/20 hover:bg-green/20'
                              }`}
                            >
                              {actionLoading === user.id ? '…' : user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-xl animate-fade-up ${
          toast.type === 'success' ? 'bg-green' : 'bg-red'
        }`}>
          {toast.msg}
        </div>
      )}

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchUsers() }}
        />
      )}
    </div>
  )
}