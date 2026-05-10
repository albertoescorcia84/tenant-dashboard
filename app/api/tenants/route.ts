import { NextRequest, NextResponse } from 'next/server'
import pool from '@/app/lib/db'
import { verifyToken, SESSION_COOKIE } from '@/app/lib/auth'

const CHAT_API_URL = process.env.CHAT_API_URL ?? 'https://api.albertoescorcia.ca'
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
  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '12'))
  const offset = (page - 1) * limit

  try {
    const { rows } = await pool.query(`
      SELECT
        t.id, t.brand_name, t.legal_name, t.business_type,
        t.physical_address, t.city, t.state, t.postal_code,
        t.service_description, t.status, t.email_address,
        t.phone_number, t.created_on,
        COUNT(tc.id)::int AS customer_count
      FROM tenants t
      LEFT JOIN tenant_customers tc
        ON tc.tenant_id = t.id AND tc.tenant_specific_status = 'Active'
      GROUP BY t.id
      ORDER BY t.created_on DESC NULLS LAST, t.brand_name
      LIMIT $1 OFFSET $2
    `, [limit, offset])

    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM tenants')
    const total = countResult.rows[0].total

    return NextResponse.json({
      tenants: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[GET /api/tenants]', err)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      id, legal_name, brand_name, other_names,
      phone_number, email_address,
      physical_address, city, state, country, postal_code,
      business_type, service_description,
      contact_name, contact_phone_name, alt_phone_1, alt_phone_2,
      status, model_id, system_prompt, menu_content,
    } = body

    if (!id || !legal_name || !physical_address || !business_type ||
        !service_description || !city || !state || !country ||
        !postal_code || !contact_name || !contact_phone_name) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const existing = await pool.query('SELECT id FROM tenants WHERE id = $1', [id])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A tenant with this ID already exists.' }, { status: 409 })
    }

    await pool.query(`
      INSERT INTO tenants (
        id, legal_name, brand_name, other_names,
        phone_number, email_address,
        physical_address, city, state, country, postal_code,
        business_type, service_description,
        contact_name, contact_phone_name, alt_phone_1, alt_phone_2,
        status, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    `, [
      id, legal_name, brand_name || legal_name, other_names || null,
      phone_number || null, email_address || null,
      physical_address, city, state, country, postal_code,
      business_type, service_description,
      contact_name, contact_phone_name,
      alt_phone_1 || null, alt_phone_2 || null,
      status || 'Active', admin.userId,
    ])

    if (model_id && system_prompt) {
      await pool.query(`
        INSERT INTO tenant_ai_settings (tenant_id, model_id, system_prompt)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id) DO UPDATE
          SET model_id = EXCLUDED.model_id,
              system_prompt = EXCLUDED.system_prompt,
              updated_at = NOW()
      `, [id, model_id, system_prompt])
    }

    if (menu_content) {
      await pool.query(
        'INSERT INTO menu_vectors (tenant_id, content) VALUES ($1, $2)',
        [id, menu_content]
      )
    }

    if (email_address) {
      await fetch(`${CHAT_API_URL}/notifications/send-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_email:     FROM_EMAIL,
          from_name:      FROM_NAME,
          to:             [{ email: email_address, name: contact_name }],
          subject:        `Welcome to ${FROM_NAME} — Your restaurant is now live!`,
          title:          `Congratulations, ${brand_name || legal_name}!`,
          body:           `Hi ${contact_name},\n\nWe're excited to welcome ${brand_name || legal_name} to the ${FROM_NAME} platform!\n\nYour restaurant profile has been successfully created and is now active. Your AI-powered ordering assistant is ready to start taking orders.\n\nWelcome aboard — we're thrilled to have you with us!`,
          sender_tagline: 'Restaurant Management Platform',
          sender_address: '',
        }),
      }).catch(e => console.error('[email] Welcome email failed:', e))
    }

    return NextResponse.json({ success: true, tenant_id: id }, { status: 201 })

  } catch (err) {
    console.error('[POST /api/tenants]', err)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}