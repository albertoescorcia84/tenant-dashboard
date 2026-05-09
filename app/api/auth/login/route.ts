import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'
import { signToken, SESSION_COOKIE, MAX_AGE_SECONDS } from '@/app/lib/auth'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json()

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required.' },
        { status: 400 }
      )
    }

    // Hash the incoming password with MD5 to compare against DB
    const passwordHash = crypto.createHash('md5').update(password).digest('hex')

    // Look up user by username OR email
    const { rows } = await pool.query(`
      SELECT id, email, username, full_name, role, tenant_id, status, password_hash
      FROM users
      WHERE (username = $1 OR email = $1)
        AND status != 'inactive'
      LIMIT 1
    `, [identifier.trim().toLowerCase()])

    const user = rows[0]

    if (!user || user.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      )
    }

    if (user.status === 'on boarding') {
      return NextResponse.json(
        { error: 'Your account is pending activation. Contact your administrator.' },
        { status: 403 }
      )
    }

    // Update last_access
    await pool.query(
      'UPDATE users SET last_access = NOW() WHERE id = $1',
      [user.id]
    )

    // Sign JWT
    const token = await signToken({
      userId:   user.id,
      email:    user.email,
      username: user.username ?? user.email,
      role:     user.role,
      tenantId: user.tenant_id ?? null,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        email:    user.email,
        username: user.username,
        fullName: user.full_name,
        role:     user.role,
      },
    })

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   MAX_AGE_SECONDS,
      path:     '/',
    })

    return response

  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}