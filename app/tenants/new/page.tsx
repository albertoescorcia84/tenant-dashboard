import pool from '@/app/lib/db'
import TenantForm from '@/app/components/TenantForm'
import Header from '@/app/components/Header'

export default async function NewTenantPage() {
  const { rows: models } = await pool.query(
    "SELECT id, model_name FROM llm_models WHERE status IS DISTINCT FROM 'inactive' ORDER BY id"
  )

  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <TenantForm models={models} isEdit={false} />
    </div>
  )
}