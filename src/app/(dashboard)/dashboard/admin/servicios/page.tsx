// src/app/(dashboard)/dashboard/admin/servicios/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ServiceList } from '@/components/admin/ServiceList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Servicios' }

export default async function AdminServiciosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('category')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Servicios</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catálogo de servicios de la clínica —{' '}
          {services?.filter((s) => s.is_active).length ?? 0} activos
        </p>
      </div>

      <ServiceList services={services ?? []} />
    </div>
  )
}