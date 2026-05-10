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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { rows } = await pool.query(`
      SELECT
        t.*,
        s.id    AS ai_settings_id,
        s.model_id,
        s.system_prompt,
        mv.content AS menu_content
      FROM tenants t
      LEFT JOIN tenant_ai_settings s ON s.tenant_id = t.id
      LEFT JOIN menu_vectors mv      ON mv.tenant_id = t.id
      WHERE t.id = $1
    `, [params.id])

    if (!rows[0]) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })

    return NextResponse.json({ tenant: rows[0] })
  } catch (err) {
    console.error('[GET /api/tenants/[id]]', err)
    return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      legal_name, brand_name, other_names,
      phone_number, email_address,
      physical_address, city, state, country, postal_code,
      business_type, service_description,
      contact_name, contact_phone_name, alt_phone_1, alt_phone_2,
      status, model_id, system_prompt, menu_content,
    } = body

    await pool.query(`
      UPDATE tenants SET
        legal_name          = $1,
        brand_name          = $2,
        other_names         = $3,
        phone_number        = $4,
        email_address       = $5,
        physical_address    = $6,
        city                = $7,
        state               = $8,
        country             = $9,
        postal_code         = $10,
        business_type       = $11,
        service_description = $12,
        contact_name        = $13,
        contact_phone_name  = $14,
        alt_phone_1         = $15,
        alt_phone_2         = $16,
        status              = $17
      WHERE id = $18
    `, [
      legal_name, brand_name || legal_name, other_names || null,
      phone_number || null, email_address || null,
      physical_address, city, state, country, postal_code,
      business_type, service_description,
      contact_name, contact_phone_name,
      alt_phone_1 || null, alt_phone_2 || null,
      status || 'Active',
      params.id,
    ])

    if (model_id && system_prompt) {
      await pool.query(`
        INSERT INTO tenant_ai_settings (tenant_id, model_id, system_prompt)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id) DO UPDATE
          SET model_id = EXCLUDED.model_id,
              system_prompt = EXCLUDED.system_prompt,
              updated_at = NOW()
      `, [params.id, model_id, system_prompt])
    }

    if (menu_content !== undefined) {
      await pool.query('DELETE FROM menu_vectors WHERE tenant_id = $1', [params.id])
      if (menu_content) {
        await pool.query(
          'INSERT INTO menu_vectors (tenant_id, content) VALUES ($1, $2)',
          [params.id, menu_content]
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/tenants/[id]]', err)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}