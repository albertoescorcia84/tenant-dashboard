import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'
import crypto from 'crypto'

const CHAT_API_URL = process.env.CHAT_API_URL ?? 'https://api.albertoescorcia.ca'
const APP_URL      = process.env.APP_URL      ?? 'https://dashboard.albertoescorcia.ca'
const FROM_EMAIL   = process.env.FROM_EMAIL   ?? 'noreply@albertoescorcia.ca'
const FROM_NAME    = process.env.FROM_NAME    ?? 'TenantOS'

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token is required.' }, { status: 400 })

  try {
    const { rows } = await pool.query(`
      SELECT id, used, expires_at FROM onboarding_tokens
      WHERE token = $1 AND type = 'password_reset'
    `, [token])

    const rec = rows[0]
    if (!rec)     return NextResponse.json({ error: 'Invalid reset link.' }, { status: 404 })
    if (rec.used) return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 410 })
    if (new Date() > new Date(rec.expires_at)) {
      return NextResponse.json({ error: 'This reset link has expired.' }, { status: 410 })
    }

    return NextResponse.json({ valid: true })
  } catch (err) {
    console.error('[GET /api/auth/reset-password]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password, confirm_password } = await req.json()

    if (!token || !password || !confirm_password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (password !== confirm_password) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }
    if (!PASSWORD_RE.test(password)) {
      return NextResponse.json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      }, { status: 400 })
    }

    const { rows } = await pool.query(`
      SELECT ot.id, ot.user_id, ot.used, ot.expires_at,
             u.email, u.full_name
      FROM onboarding_tokens ot
      JOIN users u ON u.id = ot.user_id
      WHERE ot.token = $1 AND ot.type = 'password_reset'
    `, [token])

    const rec = rows[0]
    if (!rec)     return NextResponse.json({ error: 'Invalid reset link.' }, { status: 404 })
    if (rec.used) return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 410 })
    if (new Date() > new Date(rec.expires_at)) {
      return NextResponse.json({ error: 'This reset link has expired.' }, { status: 410 })
    }

    const passwordHash = crypto.createHash('md5').update(password).digest('hex')

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, rec.user_id])
    await pool.query('UPDATE onboarding_tokens SET used = true WHERE id = $1', [rec.id])

    await fetch(`${CHAT_API_URL}/notifications/send-email`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_email:     FROM_EMAIL,
        from_name:      FROM_NAME,
        to:             [{ email: rec.email, name: rec.full_name }],
        subject:        `Your ${FROM_NAME} password has been changed`,
        title:          'Password Changed Successfully',
        body:           `Hi ${rec.full_name.split(' ')[0]},\n\nYour password has been successfully updated. You can now sign in with your new password.\n\n${APP_URL}/login\n\nIf you did not make this change, please contact your administrator immediately.`,
        sender_tagline: 'Account Security',
        sender_address: '',
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}