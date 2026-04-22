// src/app/(dashboard)/dashboard/veterinario/pacientes/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PacientesList } from '@/components/veterinario/PacientesList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pacientes' }

interface PacientesPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function VetPacientesPage({ searchParams }: PacientesPageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { q } = await searchParams

  // Leer todas las mascotas activas con su dueño
  // La búsqueda se hace server-side — filtramos por nombre de mascota o dueño
  let query = supabase
    .from('pets')
    .select(`
      id,
      name,
      species,
      breed,
      date_of_birth,
      photo_url,
      weight_kg,
      owner:profiles!pets_owner_id_fkey (
        id,
        full_name,
        phone
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Filtro de búsqueda — por nombre de mascota
  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: pets } = await query

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pets?.length ?? 0} mascotas registradas
        </p>
      </div>

      <PacientesList pets={pets ?? []} initialSearch={q ?? ''} />
    </div>
  )
}