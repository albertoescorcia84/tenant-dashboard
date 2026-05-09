import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'
import crypto from 'crypto'

const CHAT_API_URL = process.env.CHAT_API_URL ?? 'https://api.albertoescorcia.ca'
const APP_URL      = process.env.APP_URL      ?? 'https://dashboard.albertoescorcia.ca'
const FROM_EMAIL   = process.env.FROM_EMAIL   ?? 'noreply@albertoescorcia.ca'
const FROM_NAME    = process.env.FROM_NAME    ?? 'TenantOS'

const GENERIC_MSG = "If this email belongs to an active account, you'll receive a password reset link shortly. Please check your inbox."

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

    const { rows } = await pool.query(
      `SELECT id, email, full_name, status FROM users WHERE email = $1`,
      [email.trim().toLowerCase()]
    )
    const user = rows[0]

    if (user && user.status === 'active') {
      await pool.query(
        `UPDATE onboarding_tokens SET used = true WHERE user_id = $1 AND type = 'password_reset'`,
        [user.id]
      )

      const token     = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await pool.query(`
        INSERT INTO onboarding_tokens (user_id, token, type, expires_at)
        VALUES ($1, $2, 'password_reset', $3)
      `, [user.id, token, expiresAt])

      const resetUrl = `${APP_URL}/reset-password?token=${token}`

      await fetch(`${CHAT_API_URL}/notifications/send-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_email:     FROM_EMAIL,
          from_name:      FROM_NAME,
          to:             [{ email: user.email, name: user.full_name }],
          subject:        `Reset your ${FROM_NAME} password`,
          title:          'Password Reset Request',
          body:           `Hi ${user.full_name.split(' ')[0]},\n\nWe received a request to reset your password. Click the link below to set a new password. This link expires in 24 hours and can only be used once.\n\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.`,
          sender_tagline: 'Account Security',
          sender_address: '',
        }),
      })
    }

    return NextResponse.json({ message: GENERIC_MSG })
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err)
    return NextResponse.json({ message: GENERIC_MSG })
  }
}