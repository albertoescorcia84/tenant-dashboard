import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'
import crypto from 'crypto'

const CHAT_API_URL = process.env.CHAT_API_URL ?? 'https://api.albertoescorcia.ca'
const FROM_EMAIL   = process.env.FROM_EMAIL   ?? 'noreply@albertoescorcia.ca'
const FROM_NAME    = process.env.FROM_NAME    ?? 'TenantOS'
const APP_URL      = process.env.APP_URL      ?? 'https://dashboard.albertoescorcia.ca'

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token is required.' }, { status: 400 })

  try {
    const { rows } = await pool.query(`
      SELECT ot.id, ot.user_id, ot.used, ot.expires_at,
             u.email, u.full_name, u.status
      FROM onboarding_tokens ot
      JOIN users u ON u.id = ot.user_id
      WHERE ot.token = $1 AND ot.type = 'onboarding'
    `, [token])

    const rec = rows[0]
    if (!rec)     return NextResponse.json({ error: 'Invalid invitation link.' }, { status: 404 })
    if (rec.used) return NextResponse.json({ error: 'This invitation has already been used.' }, { status: 410 })
    if (new Date() > new Date(rec.expires_at)) {
      return NextResponse.json({ error: 'This invitation has expired. Please request a new one.' }, { status: 410 })
    }
    if (rec.status !== 'on boarding') {
      return NextResponse.json({ error: 'This account has already been activated.' }, { status: 409 })
    }

    return NextResponse.json({ valid: true, email: rec.email, full_name: rec.full_name })
  } catch (err) {
    console.error('[GET /api/onboarding]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, username, phone_number, password, confirm_password } = await req.json()

    if (!token || !username || !phone_number || !password || !confirm_password) {
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

    const { rows: tokenRows } = await pool.query(`
      SELECT ot.id, ot.user_id, ot.used, ot.expires_at,
             u.email, u.full_name
      FROM onboarding_tokens ot
      JOIN users u ON u.id = ot.user_id
      WHERE ot.token = $1 AND ot.type = 'onboarding'
    `, [token])

    const rec = tokenRows[0]
    if (!rec)     return NextResponse.json({ error: 'Invalid token.' }, { status: 404 })
    if (rec.used) return NextResponse.json({ error: 'This invitation has already been used.' }, { status: 410 })
    if (new Date() > new Date(rec.expires_at)) {
      return NextResponse.json({ error: 'Invitation expired. Please request a new one.' }, { status: 410 })
    }

    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.trim().toLowerCase()]
    )
    if (usernameCheck.rows.length > 0) {
      return NextResponse.json({ error: 'This username is already taken. Please choose another.' }, { status: 409 })
    }

    const passwordHash = crypto.createHash('md5').update(password).digest('hex')

    await pool.query(`
      UPDATE users
      SET username = $1, phone_number = $2, password_hash = $3, status = 'active'
      WHERE id = $4
    `, [username.trim().toLowerCase(), phone_number, passwordHash, rec.user_id])

    await pool.query('UPDATE onboarding_tokens SET used = true WHERE id = $1', [rec.id])

    await fetch(`${CHAT_API_URL}/notifications/send-email`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_email:     FROM_EMAIL,
        from_name:      FROM_NAME,
        to:             [{ email: rec.email, name: rec.full_name }],
        subject:        `Your ${FROM_NAME} account is ready`,
        title:          'Account Activated Successfully!',
        body:           `Hi ${rec.full_name.split(' ')[0]},\n\nYour account has been successfully activated. You can now sign in to ${FROM_NAME} using your username and password.\n\n${APP_URL}/login\n\nWelcome aboard!`,
        sender_tagline: 'Platform Management',
        sender_address: '',
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/onboarding]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}