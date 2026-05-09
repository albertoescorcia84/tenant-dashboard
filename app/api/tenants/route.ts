import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '12'))
  const offset = (page - 1) * limit

  try {
    const { rows } = await pool.query(`
      SELECT
        t.id,
        t.brand_name,
        t.legal_name,
        t.business_type,
        t.physical_address,
        t.city,
        t.state,
        t.postal_code,
        t.service_description,
        t.status,
        t.email_address,
        t.phone_number,
        t.created_on,
        COUNT(tc.id)::int AS customer_count
      FROM tenants t
      LEFT JOIN tenant_customers tc
        ON tc.tenant_id = t.id
        AND tc.tenant_specific_status = 'Active'
      GROUP BY t.id
      ORDER BY t.created_on DESC NULLS LAST, t.brand_name
      LIMIT $1 OFFSET $2
    `, [limit, offset])

    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM tenants')
    const total = countResult.rows[0].total

    return NextResponse.json({
      tenants: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('[GET /api/tenants]', err)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}
