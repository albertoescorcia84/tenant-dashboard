import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SESSION_COOKIE } from '@/app/lib/auth'

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ''
const GROQ_MODEL   = process.env.GROQ_MODEL   ?? 'llama-3.1-8b-instant'
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured.' }, { status: 500 })
  }

  try {
    const { description, business_type, brand_name } = await req.json()

    if (!description) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 })
    }

    const prompt = `You are a professional copywriter specializing in restaurant and hospitality marketing.

A ${business_type || 'restaurant'} called "${brand_name || 'this business'}" provided this rough description:
"${description}"

Write an improved, professional service description for their business profile.
Requirements:
- 3-5 sentences maximum
- Warm, inviting, and professional tone
- Highlight what makes them unique based on the keywords provided
- Do NOT invent specific details not implied by the original text
- Return ONLY the improved description, no preamble or explanation`

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        temperature: 0.7,
        max_tokens:  300,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[improve-description] Groq error:', err)
      return NextResponse.json({ error: 'AI service error.' }, { status: 502 })
    }

    const data    = await res.json()
    const improved = data.choices?.[0]?.message?.content?.trim() ?? ''

    return NextResponse.json({ improved })

  } catch (err) {
    console.error('[improve-description]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}