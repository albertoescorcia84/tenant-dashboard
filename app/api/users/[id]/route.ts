import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'
import { verifyToken, SESSION_COOKIE } from '@/app/lib/auth'

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { status } = await req.json()

    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Status must be active or inactive.' }, { status: 400 })
    }

    const { rows } = await pool.query(`
      UPDATE users SET status = $1 WHERE id = $2
      RETURNING id, email, full_name, status
    `, [status, params.id])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: rows[0] })
  } catch (err) {
    console.error('[PATCH /api/users/[id]]', err)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}