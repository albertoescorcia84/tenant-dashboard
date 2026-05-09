import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SESSION_COOKIE, signToken, MAX_AGE_SECONDS } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
  }

  // Sliding window — refresh token on every request
  const newToken = await signToken(payload)
  const response = NextResponse.json({ user: payload })

  response.cookies.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   MAX_AGE_SECONDS,
    path:     '/',
  })

  return response
}