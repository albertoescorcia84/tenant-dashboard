import { NextRequest, NextResponse } from 'next/server'

const CHAT_API = process.env.CHAT_API_URL ?? 'https://api.albertoescorcia.ca'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${CHAT_API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('[POST /api/chat]', err)
    return NextResponse.json({ error: 'Chat API unreachable' }, { status: 502 })
  }
}
