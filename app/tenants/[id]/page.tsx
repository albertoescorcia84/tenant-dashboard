import pool from '@/app/lib/db'
import TenantForm from '@/app/components/TenantForm'
import Header from '@/app/components/Header'
import { notFound } from 'next/navigation'

export default async function EditTenantPage({ params }: { params: { id: string } }) {
  const [modelsResult, tenantResult] = await Promise.all([
    pool.query("SELECT id, model_name FROM llm_models WHERE status IS DISTINCT FROM 'inactive' ORDER BY id"),
    pool.query(`
      SELECT t.*, s.model_id, s.system_prompt, mv.content AS menu_content
      FROM tenants t
      LEFT JOIN tenant_ai_settings s ON s.tenant_id = t.id
      LEFT JOIN menu_vectors mv      ON mv.tenant_id = t.id
      WHERE t.id = $1
    `, [params.id]),
  ])

  if (!tenantResult.rows[0]) notFound()

  const tenant = tenantResult.rows[0]

  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <TenantForm
        models={modelsResult.rows}
        initialData={tenant}
        isEdit={true}
      />
    </div>
  )
}