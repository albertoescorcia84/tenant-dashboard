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
    const { raw_text, brand_name } = await req.json()

    if (!raw_text) {
      return NextResponse.json({ error: 'File content is required.' }, { status: 400 })
    }

    const truncated = raw_text.slice(0, 6000)

    const prompt = `You are a data extraction assistant for a restaurant AI ordering system.

Extract ALL menu items and relevant restaurant information from the following text for "${brand_name || 'this restaurant'}".

Format the output as clean, structured text that an AI ordering assistant can use to answer customer questions. Include:
- All menu items with prices (format: "Item Name: $XX.XX")
- Brief descriptions if available
- Categories/sections if present
- Any special notes (allergens, dietary info, etc.)
- Any other useful information for customers (hours, specials, policies)

Raw text to process:
---
${truncated}
---

Return ONLY the structured menu content, no preamble.`

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        temperature: 0.1,
        max_tokens:  2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[process-menu] Groq error:', err)
      return NextResponse.json({ error: 'AI service error.' }, { status: 502 })
    }

    const data        = await res.json()
    const menu_content = data.choices?.[0]?.message?.content?.trim() ?? ''

    return NextResponse.json({ menu_content })

  } catch (err) {
    console.error('[process-menu]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}