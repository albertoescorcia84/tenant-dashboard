'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface User {
  username: string
  email:    string
  role:     string
}

interface Props {
  totalRestaurants?: number
}

export default function Header({ totalRestaurants }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]                 = useState<User | null>(null)
  const [signingOut, setSigningOut]     = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.user ? setUser(d.user) : null)
      .catch(() => null)
  }, [])

  useEffect(() => { setMobileNavOpen(false) }, [pathname])

  async function handleSignOut() {
    setSigningOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/',      label: 'Restaurants' },
    ...(user?.role === 'admin' ? [
      { href: '/users', label: 'Users' },
    ] : []),
  ]

  return (
    <>
      <header className="border-b border-border bg-panel sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Mobile hamburger */}
            <button
              className="sm:hidden text-dim hover:text-text transition-colors p-1"
              onClick={() => setMobileNavOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileNavOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
                T
              </div>
              <span className="text-text font-semibold text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                TenantOS
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-accent/10 text-accent'
                      : 'text-dim hover:text-text hover:bg-card'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {totalRestaurants !== undefined && pathname === '/' && (
              <span className="text-dim text-sm hidden md:block">
                {totalRestaurants} restaurant{totalRestaurants !== 1 ? 's' : ''}
              </span>
            )}

            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl hover:bg-card transition-colors border border-transparent hover:border-border"
                >
                  <div className="w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
                    {(user.username?.[0] ?? user.email[0]).toUpperCase()}
                  </div>
                  <span className="text-text text-sm font-medium hidden sm:block">{user.username ?? user.email}</span>
                  <span className="text-muted text-xs hidden md:block capitalize">({user.role})</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-dim hidden sm:block">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fade-up">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-text text-sm font-medium truncate">{user.username}</p>
                        <p className="text-dim text-xs truncate">{user.email}</p>
                        <p className="text-muted text-xs capitalize mt-0.5">{user.role}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red text-sm hover:bg-red/5 transition-colors disabled:opacity-50"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        {signingOut ? 'Signing out…' : 'Sign out'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <>
          <div className="fixed inset-0 z-20 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <nav className="fixed top-16 left-0 right-0 z-20 bg-panel border-b border-border shadow-xl animate-fade-up">
            <div className="flex flex-col py-2">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-6 py-3.5 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-accent bg-accent/5'
                      : 'text-text hover:bg-card'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </>
  )
}