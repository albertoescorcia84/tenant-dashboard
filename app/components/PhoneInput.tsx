'use client'

import { useState, useRef } from 'react'

// Country data: flag emoji, dial code, max digits, name
const COUNTRIES = [
  { code: 'CA', name: 'Canada',        dial: '+1',   flag: '🇨🇦', maxDigits: 10 },
  { code: 'US', name: 'United States', dial: '+1',   flag: '🇺🇸', maxDigits: 10 },
  { code: 'MX', name: 'Mexico',        dial: '+52',  flag: '🇲🇽', maxDigits: 10 },
  { code: 'GB', name: 'United Kingdom',dial: '+44',  flag: '🇬🇧', maxDigits: 10 },
  { code: 'ES', name: 'Spain',         dial: '+34',  flag: '🇪🇸', maxDigits: 9  },
  { code: 'CO', name: 'Colombia',      dial: '+57',  flag: '🇨🇴', maxDigits: 10 },
  { code: 'VE', name: 'Venezuela',     dial: '+58',  flag: '🇻🇪', maxDigits: 10 },
  { code: 'AR', name: 'Argentina',     dial: '+54',  flag: '🇦🇷', maxDigits: 10 },
  { code: 'BR', name: 'Brazil',        dial: '+55',  flag: '🇧🇷', maxDigits: 11 },
  { code: 'CL', name: 'Chile',         dial: '+56',  flag: '🇨🇱', maxDigits: 9  },
  { code: 'PE', name: 'Peru',          dial: '+51',  flag: '🇵🇪', maxDigits: 9  },
  { code: 'FR', name: 'France',        dial: '+33',  flag: '🇫🇷', maxDigits: 9  },
  { code: 'DE', name: 'Germany',       dial: '+49',  flag: '🇩🇪', maxDigits: 11 },
  { code: 'IT', name: 'Italy',         dial: '+39',  flag: '🇮🇹', maxDigits: 10 },
  { code: 'AU', name: 'Australia',     dial: '+61',  flag: '🇦🇺', maxDigits: 9  },
  { code: 'IN', name: 'India',         dial: '+91',  flag: '🇮🇳', maxDigits: 10 },
]

interface Props {
  value:       string          // full number e.g. "+14165550001"
  onChange:    (v: string) => void
  placeholder?: string
  className?:  string
  autoFocus?:  boolean
}

export default function PhoneInput({ value, onChange, placeholder, className = '', autoFocus }: Props) {
  const [open, setOpen]       = useState(false)
  const [country, setCountry] = useState(COUNTRIES[0]) // default Canada
  const [digits, setDigits]   = useState('')
  const inputRef              = useRef<HTMLInputElement>(null)

  function selectCountry(c: typeof COUNTRIES[0]) {
    setCountry(c)
    setDigits('')
    onChange(c.dial)
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleDigits(raw: string) {
    // Only allow numbers, spaces, dashes, parentheses
    const cleaned = raw.replace(/[^\d\s\-()]/g, '')
    const digitsOnly = cleaned.replace(/\D/g, '')

    // Enforce max digits for selected country
    if (digitsOnly.length > country.maxDigits) return

    setDigits(cleaned)
    onChange(`${country.dial}${digitsOnly}`)
  }

  const isValid = digits.replace(/\D/g, '').length === country.maxDigits

  return (
    <div className={`relative flex gap-2 ${className}`}>
      {/* Country selector button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-3 bg-panel border border-border rounded-xl text-sm hover:border-muted transition-colors shrink-0 min-w-[90px]"
      >
        <span className="text-lg leading-none">{country.flag}</span>
        <span className="text-dim text-xs font-mono">{country.dial}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted shrink-0">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-panel transition-colors text-left ${
                  c.code === country.code ? 'bg-accent/10 text-accent' : 'text-text'
                }`}
              >
                <span className="text-lg leading-none">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-dim text-xs font-mono shrink-0">{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Number input */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="tel"
          value={digits}
          onChange={e => handleDigits(e.target.value)}
          placeholder={placeholder ?? `${country.maxDigits} digits`}
          autoFocus={autoFocus}
          className={`w-full bg-panel border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 transition-all ${
            digits && !isValid
              ? 'border-amber/50 focus:ring-amber/20'
              : digits && isValid
              ? 'border-green/50 focus:ring-green/20'
              : 'border-border focus:ring-accent/30 focus:border-accent'
          }`}
        />
        {/* Digit counter */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-mono">
          {digits.replace(/\D/g, '').length}/{country.maxDigits}
        </span>
      </div>
    </div>
  )
}
