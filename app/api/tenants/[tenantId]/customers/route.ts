import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = params
  const { searchParams } = new URL(req.url)
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '20'))
  const offset = (page - 1) * limit

  try {
    const [rows, countRow] = await Promise.all([
      pool.query(`
        SELECT
          c.id,
          c.full_name,
          c.phone_number,
          c.email,
          c.status,
          tc.tenant_specific_status,
          a.address_line_1,
          a.city,
          a.state
        FROM tenant_customers tc
        JOIN customers c ON c.id = tc.customer_id
        LEFT JOIN tenant_customer_addresses a
          ON a.tenant_customer_id = tc.id AND a.is_default = true
        WHERE tc.tenant_id = $1
        ORDER BY c.full_name
        LIMIT $2 OFFSET $3
      `, [tenantId, limit, offset]),
      pool.query(
        'SELECT COUNT(*)::int AS total FROM tenant_customers WHERE tenant_id = $1',
        [tenantId]
      ),
    ])

    return NextResponse.json({
      customers: rows.rows,
      total: countRow.rows[0].total,
      page,
      limit,
      pages: Math.ceil(countRow.rows[0].total / limit),
    })
  } catch (err) {
    console.error('[customers API]', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
