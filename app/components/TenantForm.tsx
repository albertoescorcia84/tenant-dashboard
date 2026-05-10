'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface LLMModel {
  id:         number
  model_name: string
}

interface TenantFormData {
  id:                  string
  legal_name:          string
  brand_name:          string
  other_names:         string
  phone_number:        string
  email_address:       string
  physical_address:    string
  city:                string
  state:               string
  country:             string
  postal_code:         string
  business_type:       string
  service_description: string
  contact_name:        string
  contact_phone_name:  string
  alt_phone_1:         string
  alt_phone_2:         string
  status:              string
  model_id:            string
  system_prompt:       string
  menu_content:        string
}

interface Props {
  initialData?: Partial<TenantFormData>
  models:       LLMModel[]
  isEdit?:      boolean
}

const DEFAULT_SYSTEM_PROMPT = `You are the friendly and professional virtual assistant for {restaurant_name}.

Your role is to help customers place food orders based on the menu below.
Menu Context: {menu_context}

Be warm, concise, and helpful. Keep responses to 2-3 sentences maximum.`

const BUSINESS_TYPES = ['Restaurant', 'Bar', 'Cafe', 'Food Truck', 'Bakery', 'Pizzeria', 'Sushi Bar', 'Steakhouse', 'Other']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-panel">
        <h2 className="text-text font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-dim text-xs font-medium mb-2 uppercase tracking-widest">
        {label}{required && <span className="text-red ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-panel border border-border rounded-xl px-4 py-3 text-text text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"

export default function TenantForm({ initialData, models, isEdit = false }: Props) {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<TenantFormData>({
    id:                  initialData?.id                  ?? '',
    legal_name:          initialData?.legal_name          ?? '',
    brand_name:          initialData?.brand_name          ?? '',
    other_names:         initialData?.other_names         ?? '',
    phone_number:        initialData?.phone_number        ?? '',
    email_address:       initialData?.email_address       ?? '',
    physical_address:    initialData?.physical_address    ?? '',
    city:                initialData?.city                ?? '',
    state:               initialData?.state               ?? '',
    country:             initialData?.country             ?? '',
    postal_code:         initialData?.postal_code         ?? '',
    business_type:       initialData?.business_type       ?? 'Restaurant',
    service_description: initialData?.service_description ?? '',
    contact_name:        initialData?.contact_name        ?? '',
    contact_phone_name:  initialData?.contact_phone_name  ?? '',
    alt_phone_1:         initialData?.alt_phone_1         ?? '',
    alt_phone_2:         initialData?.alt_phone_2         ?? '',
    status:              initialData?.status              ?? 'Active',
    model_id:            String(initialData?.model_id     ?? (models[0]?.id ?? '')),
    system_prompt:       initialData?.system_prompt       ?? DEFAULT_SYSTEM_PROMPT,
    menu_content:        initialData?.menu_content        ?? '',
  })

  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState('')
  const [toast,            setToast]            = useState('')
  const [improvingDesc,    setImprovingDesc]    = useState(false)
  const [processingMenu,   setProcessingMenu]   = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')

  function set(key: keyof TenantFormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function improveDescription() {
    if (!form.service_description.trim()) {
      setError('Please write a basic description first.')
      return
    }
    setImprovingDesc(true)
    setError('')
    try {
      const res  = await fetch('/api/ai/improve-description', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          description:   form.service_description,
          business_type: form.business_type,
          brand_name:    form.brand_name || form.legal_name,
        }),
      })
      const data = await res.json()
      if (data.improved) {
        set('service_description', data.improved)
        showToast('Description improved by AI ✨')
      } else {
        setError(data.error ?? 'AI improvement failed.')
      }
    } finally {
      setImprovingDesc(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    setProcessingMenu(true)
    setError('')

    try {
      let raw_text = ''
      if (file.type.startsWith('image/')) {
        raw_text = `[Image file: ${file.name}] — Please extract menu items and prices visible in this image.`
      } else {
        raw_text = await file.text()
      }

      const res  = await fetch('/api/ai/process-menu', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          raw_text,
          brand_name: form.brand_name || form.legal_name,
        }),
      })
      const data = await res.json()
      if (data.menu_content) {
        set('menu_content', data.menu_content)
        showToast(`Menu extracted from ${file.name} ✨`)
      } else {
        setError(data.error ?? 'Menu extraction failed.')
      }
    } finally {
      setProcessingMenu(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSave() {
    setError('')

    const required: [string, string][] = [
      [form.id,                  'Tenant ID'],
      [form.legal_name,          'Legal Name'],
      [form.physical_address,    'Physical Address'],
      [form.business_type,       'Business Type'],
      [form.service_description, 'Service Description'],
      [form.city,                'City'],
      [form.state,               'State / Province'],
      [form.country,             'Country'],
      [form.postal_code,         'Postal Code'],
      [form.contact_name,        'Contact Name'],
      [form.contact_phone_name,  'Contact Phone'],
    ]

    const missing = required.filter(([v]) => !v.trim()).map(([, l]) => l)
    if (missing.length > 0) {
      setError(`Missing required fields: ${missing.join(', ')}`)
      return
    }

    setSaving(true)
    try {
      const url    = isEdit ? `/api/tenants/${form.id}` : '/api/tenants'
      const method = isEdit ? 'PUT' : 'POST'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to save tenant.')
        return
      }

      router.push('/')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-dim hover:text-text transition-colors p-2 rounded-lg hover:bg-card"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'var(--font-display)' }}>
            {isEdit ? 'Edit Tenant' : 'New Tenant'}
          </h1>
          <p className="text-dim text-sm">
            {isEdit ? 'Update restaurant information' : 'Register a new restaurant on the platform'}
          </p>
        </div>
      </div>

      {/* Section 1: Identity */}
      <Section title="Business Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tenant ID" required>
            <input
              value={form.id}
              onChange={e => set('id', e.target.value.toUpperCase().replace(/\s/g, '-'))}
              placeholder="R-0002"
              disabled={isEdit}
              className={`${inputCls} ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {!isEdit && <p className="text-muted text-xs mt-1">Unique identifier, e.g. R-0002</p>}
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Legal Name" required>
            <input value={form.legal_name} onChange={e => set('legal_name', e.target.value)} placeholder="Primo's Roast Chicken Ltd." className={inputCls} />
          </Field>
          <Field label="Brand / Trade Name">
            <input value={form.brand_name} onChange={e => set('brand_name', e.target.value)} placeholder="Primo's Roast Chicken" className={inputCls} />
          </Field>
          <Field label="Other Names / Aliases">
            <input value={form.other_names} onChange={e => set('other_names', e.target.value)} placeholder="Primos" className={inputCls} />
          </Field>
          <Field label="Business Type" required>
            <select value={form.business_type} onChange={e => set('business_type', e.target.value)} className={inputCls}>
              {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-dim text-xs font-medium uppercase tracking-widest">
              Service Description <span className="text-red ml-1">*</span>
            </label>
            <button
              type="button"
              onClick={improveDescription}
              disabled={improvingDesc}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
            >
              {improvingDesc ? (
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              )}
              {improvingDesc ? 'Improving…' : 'Improve with AI'}
            </button>
          </div>
          <textarea
            value={form.service_description}
            onChange={e => set('service_description', e.target.value)}
            placeholder="We sell great burgers..."
            rows={4}
            className={`${inputCls} resize-none`}
          />
          <p className="text-muted text-xs mt-1">Write a basic description, then click "Improve with AI" to enhance it.</p>
        </div>
      </Section>

      {/* Section 2: Contact & Location */}
      <Section title="Contact & Location">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact Name" required>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="John Doe" className={inputCls} />
          </Field>
          <Field label="Contact Phone" required>
            <input value={form.contact_phone_name} onChange={e => set('contact_phone_name', e.target.value)} placeholder="+1 416 555 0001" className={inputCls} />
          </Field>
          <Field label="Primary Phone (WhatsApp)">
            <input value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+14165550001" className={inputCls} />
          </Field>
          <Field label="Email Address">
            <input type="email" value={form.email_address} onChange={e => set('email_address', e.target.value)} placeholder="info@restaurant.com" className={inputCls} />
          </Field>
          <Field label="Alt Phone 1">
            <input value={form.alt_phone_1} onChange={e => set('alt_phone_1', e.target.value)} placeholder="+1 416 555 0002" className={inputCls} />
          </Field>
          <Field label="Alt Phone 2">
            <input value={form.alt_phone_2} onChange={e => set('alt_phone_2', e.target.value)} placeholder="+1 416 555 0003" className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Physical Address" required>
              <input value={form.physical_address} onChange={e => set('physical_address', e.target.value)} placeholder="2450 Victoria Park Ave" className={inputCls} />
            </Field>
          </div>
          <Field label="City" required>
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Toronto" className={inputCls} />
          </Field>
          <Field label="State / Province" required>
            <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Ontario" className={inputCls} />
          </Field>
          <Field label="Country" required>
            <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Canada" className={inputCls} />
          </Field>
          <Field label="Postal Code" required>
            <input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} placeholder="M2J 4A2" className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Section 3: Menu */}
      <Section title="Menu & Knowledge Base">
        <p className="text-dim text-sm mb-4">
          Upload a menu file (TXT, CSV, Excel, Word, or image) and the AI will extract structured menu data.
        </p>
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processingMenu}
            className="flex items-center gap-2 px-4 py-2.5 bg-panel border border-border rounded-xl text-sm text-dim hover:text-text hover:border-muted transition-colors disabled:opacity-50"
          >
            {processingMenu ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Processing…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Menu File
              </>
            )}
          </button>
          {uploadedFileName && !processingMenu && (
            <span className="text-green text-xs">✓ {uploadedFileName}</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.csv,.xlsx,.xls,.docx,.doc,.pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        <textarea
          value={form.menu_content}
          onChange={e => set('menu_content', e.target.value)}
          placeholder="Menu content will appear here after uploading a file, or type/paste directly..."
          rows={8}
          className={`${inputCls} resize-y font-mono text-xs`}
        />
        <p className="text-muted text-xs mt-1">You can edit the extracted content directly before saving.</p>
      </Section>

      {/* Section 4: AI Settings */}
      <Section title="AI Configuration">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Language Model">
            <select value={form.model_id} onChange={e => set('model_id', e.target.value)} className={inputCls}>
              {models.map(m => (
                <option key={m.id} value={String(m.id)}>{m.model_name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="System Prompt">
          <textarea
            value={form.system_prompt}
            onChange={e => set('system_prompt', e.target.value)}
            rows={6}
            className={`${inputCls} resize-y font-mono text-xs`}
          />
          <p className="text-muted text-xs mt-1">
            Use <code className="text-accent">{'{restaurant_name}'}</code> and <code className="text-accent">{'{menu_context}'}</code> as placeholders.
          </p>
        </Field>
      </Section>

      {error && (
        <div className="bg-red/10 border border-red/20 rounded-xl px-5 py-4 text-red text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pb-8">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-panel border border-border text-dim rounded-xl text-sm font-semibold hover:text-text transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 sm:flex-none px-8 py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Saving…
            </>
          ) : isEdit ? 'Save Changes' : 'Create Tenant & Send Welcome Email'}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-5 py-3 rounded-xl bg-green text-white text-sm font-medium shadow-xl animate-fade-up z-50">
          {toast}
        </div>
      )}
    </div>
  )
}