'use client'

import { useState, useRef, useEffect } from 'react'
import type { Tenant } from '../page'

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

interface Props {
  tenant: Tenant
  onClose: () => void
}

type Step = 'phone' | 'chat'

export default function ChatModal({ tenant, onClose }: Props) {
  const [step, setStep]             = useState<Step>('phone')
  const [phone, setPhone]           = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [sending, setSending]       = useState(false)
  const [sessionId, setSessionId]   = useState<string | null>(null)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    if (step === 'chat') inputRef.current?.focus()
  }, [step])

  function validatePhone(v: string) {
    const clean = v.replace(/\s/g, '')
    if (!clean) return 'Phone number is required'
    if (!/^\+?[\d\-\(\)]{7,15}$/.test(clean)) return 'Enter a valid phone number'
    return ''
  }

  function handleStartChat() {
    const err = validatePhone(phone)
    if (err) { setPhoneError(err); return }
    setPhoneError('')
    setStep('chat')
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || sending) return

    setInput('')
    const userMsg: Message = { role: 'user', content, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setSending(true)

    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_number:   tenant.phone_number,
          from_number: phone.trim(),
          message:     content,
        }),
      })
      const data = await res.json()
      if (data.session_id) setSessionId(data.session_id)
      const reply = data.reply || data.error || 'No response'
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please try again.',
        ts: Date.now(),
      }])
    } finally {
      setSending(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div
        className="bg-panel border border-border rounded-2xl w-full max-w-lg flex flex-col overflow-hidden shadow-2xl animate-fade-up"
        style={{ height: step === 'chat' ? '85vh' : 'auto', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card shrink-0">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-base" style={{ fontFamily: 'var(--font-display)' }}>
            {tenant.brand_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {tenant.brand_name}
            </p>
            {step === 'chat' && (
              <p className="text-dim text-xs truncate">{phone}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-dim hover:text-text transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Phone step */}
        {step === 'phone' && (
          <div className="p-8 flex flex-col gap-6">
            <div>
              <h3 className="text-text font-bold text-xl mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Start a conversation
              </h3>
              <p className="text-dim text-sm">
                Enter the customer's phone number to simulate a chat session with{' '}
                <strong className="text-text">{tenant.brand_name}</strong>'s AI assistant.
              </p>
            </div>

            <div>
              <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">
                Customer phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setPhoneError('') }}
                onKeyDown={e => e.key === 'Enter' && handleStartChat()}
                placeholder="+1 416 555 0100"
                autoFocus
                className={`w-full bg-card border rounded-xl px-4 py-3 text-text text-base placeholder:text-muted focus:outline-none focus:ring-2 transition-all ${
                  phoneError
                    ? 'border-red focus:ring-red/30'
                    : 'border-border focus:ring-accent/30 focus:border-accent'
                }`}
              />
              {phoneError && (
                <p className="text-red text-xs mt-2">{phoneError}</p>
              )}
            </div>

            <button
              onClick={handleStartChat}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all"
            >
              Start Chat →
            </button>
          </div>
        )}

        {/* Chat step */}
        {step === 'chat' && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div>
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3 text-2xl">
                      👋
                    </div>
                    <p className="text-dim text-sm">Say hello to start ordering!</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex bubble-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center mr-2 mt-auto shrink-0" style={{ fontFamily: 'var(--font-display)' }}>
                      {tenant.brand_name[0]}
                    </div>
                  )}
                  <div className={`max-w-[72%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent text-white rounded-br-sm'
                        : 'bg-card border border-border text-text rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-muted text-[10px] px-1">{formatTime(msg.ts)}</span>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start bubble-in">
                  <div className="w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center mr-2 mt-auto shrink-0">
                    {tenant.brand_name[0]}
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-dim inline-block" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-dim inline-block" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-dim inline-block" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border bg-card shrink-0">
              <div className="flex gap-2 items-end">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message…"
                  disabled={sending}
                  className="flex-1 bg-panel border border-border rounded-xl px-4 py-2.5 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
