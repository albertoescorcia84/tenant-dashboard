'use client'

import { useState, useRef, useEffect } from 'react'

const COUNTRIES = [
  { code: 'CA', name: 'Canada',         dial: '+1',   flag: '🇨🇦', maxDigits: 10 },
  { code: 'US', name: 'United States',  dial: '+1',   flag: '🇺🇸', maxDigits: 10 },
  { code: 'MX', name: 'Mexico',         dial: '+52',  flag: '🇲🇽', maxDigits: 10 },
  { code: 'GB', name: 'United Kingdom', dial: '+44',  flag: '🇬🇧', maxDigits: 10 },
  { code: 'ES', name: 'Spain',          dial: '+34',  flag: '🇪🇸', maxDigits: 9  },
  { code: 'CO', name: 'Colombia',       dial: '+57',  flag: '🇨🇴', maxDigits: 10 },
  { code: 'VE', name: 'Venezuela',      dial: '+58',  flag: '🇻🇪', maxDigits: 10 },
  { code: 'AR', name: 'Argentina',      dial: '+54',  flag: '🇦🇷', maxDigits: 10 },
  { code: 'BR', name: 'Brazil',         dial: '+55',  flag: '🇧🇷', maxDigits: 11 },
  { code: 'CL', name: 'Chile',          dial: '+56',  flag: '🇨🇱', maxDigits: 9  },
  { code: 'PE', name: 'Peru',           dial: '+51',  flag: '🇵🇪', maxDigits: 9  },
  { code: 'FR', name: 'France',         dial: '+33',  flag: '🇫🇷', maxDigits: 9  },
  { code: 'DE', name: 'Germany',        dial: '+49',  flag: '🇩🇪', maxDigits: 11 },
  { code: 'IT', name: 'Italy',          dial: '+39',  flag: '🇮🇹', maxDigits: 10 },
  { code: 'AU', name: 'Australia',      dial: '+61',  flag: '🇦🇺', maxDigits: 9  },
  { code: 'IN', name: 'India',          dial: '+91',  flag: '🇮🇳', maxDigits: 10 },
]

interface Props {
  value:        string
  onChange:     (v: string) => void
  placeholder?: string
  className?:   string
  autoFocus?:   boolean
}

export default function PhoneInput({ value, onChange, placeholder, className = '', autoFocus }: Props) {
  const [open, setOpen]       = useState(false)
  const [country, setCountry] = useState(COUNTRIES[0])
  const [digits, setDigits]   = useState('')
  const [search, setSearch]   = useState('')
  const inputRef              = useRef<HTMLInputElement>(null)
  const searchRef             = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search)
  )

  function selectCountry(c: typeof COUNTRIES[0]) {
    setCountry(c)
    setDigits('')
    setSearch('')
    onChange(c.dial)
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleDigits(raw: string) {
    const cleaned    = raw.replace(/[^\d\s\-()]/g, '')
    const digitsOnly = cleaned.replace(/\D/g, '')
    if (digitsOnly.length > country.maxDigits) return
    setDigits(cleaned)
    onChange(`${country.dial}${digitsOnly}`)
  }

  const digitCount = digits.replace(/\D/g, '').length
  const isValid    = digitCount === country.maxDigits

  return (
    <>
      <div className={`relative flex gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-3 bg-panel border border-border rounded-xl text-sm hover:border-muted transition-colors shrink-0 min-w-[90px]"
        >
          <span className="text-lg leading-none">{country.flag}</span>
          <span className="text-dim text-xs font-mono">{country.dial}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted shrink-0">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="tel"
            value={digits}
            onChange={e => handleDigits(e.target.value)}
            placeholder={placeholder ?? `${country.maxDigits} digits`}
            autoFocus={autoFocus}
            style={{ fontSize: '16px' }}
            className={`w-full bg-panel border rounded-xl px-4 py-3 text-text placeholder:text-muted focus:outline-none focus:ring-2 transition-all pr-16 ${
              digits && !isValid
                ? 'border-amber/50 focus:ring-amber/20'
                : digits && isValid
                ? 'border-green/50 focus:ring-green/20'
                : 'border-border focus:ring-accent/30 focus:border-accent'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-mono pointer-events-none">
            {digitCount}/{country.maxDigits}
          </span>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setOpen(false); setSearch('') }}
        >
          <div
            className="bg-panel border border-border w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-fade-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-text font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                Select Country
              </h3>
              <button
                onClick={() => { setOpen(false); setSearch('') }}
                className="text-dim hover:text-text transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="px-4 py-3 border-b border-border">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country…"
                style={{ fontSize: '16px' }}
                className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            <div className="overflow-y-auto max-h-72 sm:max-h-80">
              {filtered.length === 0 ? (
                <p className="text-dim text-sm text-center py-6">No countries found</p>
              ) : filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => selectCountry(c)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors text-left ${
                    c.code === country.code
                      ? 'bg-accent/10 text-accent'
                      : 'text-text hover:bg-card'
                  }`}
                >
                  <span className="text-xl leading-none">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-dim text-xs font-mono">{c.dial}</span>
                  <span className="text-muted text-xs">{c.maxDigits}d</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}