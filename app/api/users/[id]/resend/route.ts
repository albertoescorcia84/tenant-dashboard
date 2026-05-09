import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'
import { verifyToken, SESSION_COOKIE } from '@/app/lib/auth'
import crypto from 'crypto'

const CHAT_API_URL = process.env.CHAT_API_URL ?? 'https://api.albertoescorcia.ca'
const APP_URL      = process.env.APP_URL      ?? 'https://dashboard.albertoescorcia.ca'
const FROM_EMAIL   = process.env.FROM_EMAIL   ?? 'noreply@albertoescorcia.ca'
const FROM_NAME    = process.env.FROM_NAME    ?? 'TenantOS'

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { rows } = await pool.query(
      `SELECT id, email, full_name, status FROM users WHERE id = $1`,
      [params.id]
    )
    const user = rows[0]

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    if (user.status !== 'on boarding') {
      return NextResponse.json({ error: 'User is not in onboarding status.' }, { status: 400 })
    }

    await pool.query(
      `UPDATE onboarding_tokens SET used = true WHERE user_id = $1 AND type = 'onboarding'`,
      [user.id]
    )

    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await pool.query(`
      INSERT INTO onboarding_tokens (user_id, token, type, expires_at)
      VALUES ($1, $2, 'onboarding', $3)
    `, [user.id, token, expiresAt])

    const onboardingUrl = `${APP_URL}/onboarding?token=${token}`

    await fetch(`${CHAT_API_URL}/notifications/send-email`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_email:     FROM_EMAIL,
        from_name:      FROM_NAME,
        to:             [{ email: user.email, name: user.full_name }],
        subject:        `Your new invitation to join ${FROM_NAME}`,
        title:          `New Invitation — ${FROM_NAME}`,
        body:           `Your previous invitation has been refreshed.\n\nPlease use the link below to complete your account setup. This link is valid for 24 hours.\n\n${onboardingUrl}\n\nIf you did not request this, please ignore this email.`,
        sender_tagline: 'Platform Management',
        sender_address: '',
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/users/[id]/resend]', err)
    return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 })
  }
}