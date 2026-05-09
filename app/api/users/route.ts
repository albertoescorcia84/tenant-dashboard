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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.email, u.full_name, u.username,
        u.role, u.tenant_id, u.status, u.last_access, u.created_at,
        t.brand_name AS tenant_name
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      ORDER BY u.created_at DESC
    `)
    return NextResponse.json({ users: rows })
  } catch (err) {
    console.error('[GET /api/users]', err)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { full_name, email, role, tenant_id } = await req.json()

    if (!full_name || !email || !role) {
      return NextResponse.json({ error: 'full_name, email and role are required.' }, { status: 400 })
    }
    if (role === 'tenant' && !tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required for tenant users.' }, { status: 400 })
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 })
    }

    const { rows } = await pool.query(`
      INSERT INTO users (id, email, full_name, role, tenant_id, status)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, 'on boarding')
      RETURNING id, email, full_name, role, status
    `, [email.toLowerCase(), full_name, role, tenant_id || null])

    const newUser = rows[0]

    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await pool.query(`
      INSERT INTO onboarding_tokens (user_id, token, type, expires_at)
      VALUES ($1, $2, 'onboarding', $3)
    `, [newUser.id, token, expiresAt])

    const onboardingUrl = `${APP_URL}/onboarding?token=${token}`

    await fetch(`${CHAT_API_URL}/notifications/send-email`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_email:     FROM_EMAIL,
        from_name:      FROM_NAME,
        to:             [{ email: newUser.email, name: newUser.full_name }],
        subject:        `You're invited to join ${FROM_NAME}`,
        title:          `Welcome to ${FROM_NAME}, ${newUser.full_name.split(' ')[0]}!`,
        body:           `You have been invited to join the ${FROM_NAME} platform.\n\nTo complete your account setup, please click the link below. This invitation is valid for 24 hours.\n\n${onboardingUrl}\n\nIf you did not expect this invitation, you can safely ignore this email.`,
        sender_tagline: 'Platform Management',
        sender_address: '',
      }),
    })

    return NextResponse.json({ success: true, user: newUser }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/users]', err)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}