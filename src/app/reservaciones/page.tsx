// src/app/reservaciones/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingFlow } from '@/components/reservaciones/BookingFlow'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reservar cita' }

export default async function ReservacionesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar todos los datos necesarios en paralelo
  const [{ data: vets }, { data: services }, { data: pets }] = await Promise.all([

    // Vets verificados con horario activo
    supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        veterinario_profiles!inner (
          specialty,
          consultation_fee,
          is_verified
        ),
        vet_schedules (
          day_of_week
        )
      `)
      .eq('role', 'veterinario')
      .eq('is_active', true)
      .eq('veterinario_profiles.is_verified', true),

    // Servicios activos
    supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name'),

    // Mascotas del cliente
    supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('name'),
  ])

  // Solo vets que tienen al menos un día de horario configurado
  const vetsWithSchedule = (vets ?? []).filter(
    (v) => v.vet_schedules && v.vet_schedules.length > 0
  )

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Reservar cita</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agenda una cita con uno de nuestros veterinarios
          </p>
        </div>

        <div className="bg-background rounded-xl border p-6">
          <BookingFlow
            vets={vetsWithSchedule as any}
            services={services ?? []}
            pets={pets ?? []}
          />
        </div>
      </div>
    </div>
  )
}