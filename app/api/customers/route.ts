import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'

export async function GET(req: NextRequest) {
  const tenantId = new URL(req.url).searchParams.get('tenant_id')
  if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })

  try {
    const { rows } = await pool.query(`
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
      FROM customers c
      JOIN tenant_customers tc ON tc.customer_id = c.id AND tc.tenant_id = $1
      LEFT JOIN tenant_customer_addresses a
        ON a.tenant_customer_id = tc.id AND a.is_default = true
      ORDER BY c.full_name
    `, [tenantId])

    return NextResponse.json({ customers: rows })
  } catch (err) {
    console.error('[GET /api/customers]', err)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}
