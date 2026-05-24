'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Tenant } from '../page'
import PhoneInput from './PhoneInput'

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
  const [step, setStep]           = useState<Step>('phone')
  const [phone, setPhone]         = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [sending, setSending]     = useState(false)
  // ── NEW (v4.13): keep the backend session id between messages ──
  // null means "no active session yet" — the backend will create one
  // on the first /chat call and return its id in `data.session_id`.
  const [sessionId, setSessionId] = useState<string | null>(null)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Auto-focus input whenever step changes to chat or after sending
  const focusInput = useCallback(() => {
    // Small delay ensures DOM is ready
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    if (step === 'chat') focusInput()
  }, [step, focusInput])

  // Re-focus after sending completes
  useEffect(() => {
    if (!sending && step === 'chat') focusInput()
  }, [sending, step, focusInput])

  function handleStartChat() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) {
      setPhoneError('Please enter a valid phone number.')
      return
    }
    setPhoneError('')
    // Fresh start: clear any previous session_id and messages
    setSessionId(null)
    setMessages([])
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
          from_number: phone,
          message:     content,
          // Only include session_id if we already have one (otherwise the
          // backend will allocate a fresh session on this first call).
          ...(sessionId && { session_id: sessionId }),
        }),
      })
      const data = await res.json()

      // Persist the session_id returned by the backend so subsequent
      // messages continue the same conversation (cart, customer data, etc.).
      if (data.session_id) {
        setSessionId(data.session_id)
      }

      // When the order is completed, give the user a few seconds to see the
      // confirmation and then clear the session_id so the NEXT message starts
      // a brand-new order on a clean session.
      if (data.status === 'completed') {
        setTimeout(() => setSessionId(null), 8000)
      }

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
      // Focus is restored via the useEffect watching `sending`
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    // Full-screen on mobile, centered modal on desktop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 modal-overlay"
      onClick={onClose}
    >
      <div
        className={`
          bg-panel border border-border w-full flex flex-col overflow-hidden shadow-2xl
          rounded-t-2xl sm:rounded-2xl
          ${step === 'chat'
            ? 'h-[92dvh] sm:h-[85vh] sm:max-w-lg'
            : 'sm:max-w-lg'}
          animate-fade-up
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card shrink-0">
          <div
            className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-base shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
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
          <button onClick={onClose} className="text-dim hover:text-text transition-colors p-1 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── PHONE STEP ── */}
        {step === 'phone' && (
          <div className="p-6 sm:p-8 flex flex-col gap-6">
            <div>
              <h3 className="text-text font-bold text-xl mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Start a conversation
              </h3>
              <p className="text-dim text-sm">
                Enter the customer's phone number to simulate a chat with{' '}
                <strong className="text-text">{tenant.brand_name}</strong>'s AI assistant.
              </p>
            </div>

            <div>
              <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">
                Customer phone number
              </label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                placeholder="Phone number"
                autoFocus
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

        {/* ── CHAT STEP ── */}
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
                    <div
                      className="w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center mr-2 mt-auto shrink-0"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {tenant.brand_name[0]}
                    </div>
                  )}
                  <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
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

            {/* Input bar — stays above keyboard on mobile */}
            <div className="px-4 py-3 border-t border-border bg-card shrink-0 safe-area-bottom">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message…"
                  disabled={sending}
                  // Prevent zoom on iOS (font-size >= 16px)
                  style={{ fontSize: '16px' }}
                  className="flex-1 bg-panel border border-border rounded-xl px-4 py-2.5 text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all disabled:opacity-50"
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
